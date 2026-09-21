import { notionProxy } from '../api/proxy';
import type { InboxEntry } from '../types';
import { db } from './schema';

const EMOJI: Record<string, string> = { Thought: '💭', Link: '🔗', Quote: '💬' };

// Cache the Inbox data source ID in meta so we only search once
async function getInboxDsId(): Promise<string | null> {
  // 1. Prefer env var if set
  const envId = import.meta.env.VITE_INBOX_DATA_SOURCE_ID as string | undefined;
  if (envId) return envId;

  // 2. Check local cache
  const cached = await db.meta.get('inboxDataSourceId');
  if (cached) return cached.value;

  // 3. Search Notion for the Inbox database
  try {
    const res = await notionProxy<{
      results: Array<{ id: string; object: string; title?: Array<{ plain_text: string }> }>;
    }>({
      path: 'search',
      method: 'POST',
      body: {
        query: 'Inbox',
        filter: { value: 'data_source', property: 'object', in_trash: false },
      },
    });

    const found = res.results.find(
      (r) => r.object === 'data_source' || r.object === 'database',
    );
    if (found) {
      await db.meta.put({ key: 'inboxDataSourceId', value: found.id });
      return found.id;
    }
  } catch (e) {
    console.warn('[inbox] could not find Inbox database:', e);
  }
  return null;
}

function toNotionPage(e: InboxEntry, dsId: string): object {
  const titleText = `${EMOJI[e.type] ?? ''} ${e.content}`.trim();
  return {
    parent: { type: 'data_source_id', data_source_id: dsId },
    properties: {
      Name: { title: [{ text: { content: titleText } }] },
      'Client ID': { rich_text: [{ text: { content: e.clientId } }] },
    },
  };
}

export async function syncInboxPending(): Promise<{ synced: number; failed: number }> {
  const dsId = await getInboxDsId();
  if (!dsId) return { synced: 0, failed: 0 };

  const pending = await db.inbox.where('syncedAt').equals(0).toArray();
  let synced = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const page = await notionProxy<{ id: string }>({
        path: 'pages',
        method: 'POST',
        body: toNotionPage(entry, dsId),
      });
      await db.inbox.update(entry.id!, { syncedAt: Date.now(), notionPageId: page.id });
      synced++;
    } catch (err) {
      failed++;
      console.error('[inbox sync] failed for', entry.clientId, err);
    }
    await new Promise<void>((r) => setTimeout(r, 150));
  }

  return { synced, failed };
}

// ─── Markdown weekly export ───────────────────────────────────────────────────

const PROGRAM_START_MS = new Date('2025-06-23T00:00:00').getTime();

export function currentWeek(): number {
  const days = Math.round((Date.now() - PROGRAM_START_MS) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

export function weekDateRange(week: number): [string, string] {
  const startMs = PROGRAM_START_MS + (week - 1) * 7 * 24 * 3600 * 1000;
  const endMs = startMs + 7 * 24 * 3600 * 1000;
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return [fmt(startMs), fmt(endMs)];
}

const UNIT_LABEL: Record<string, string> = {
  seconds: 's', lbs: 'lbs', reps_total: 'reps', reps: 'reps', reps_per_leg: 'reps/leg', none: '',
};

export async function buildWeekMarkdown(week: number): Promise<string> {
  const [start, end] = weekDateRange(week);

  const all = await db.sets.toArray();
  const entries = all.filter(
    (s) => s.week === week || (s.date >= start && s.date < end),
  ).sort((a, b) => a.date.localeCompare(b.date));

  const inboxEntries = await db.inbox.where('week').equals(week).toArray();

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const fmtRange = (s: string, e: string) => {
    const sd = new Date(s + 'T12:00:00'), ed = new Date(e + 'T12:00:00');
    ed.setDate(ed.getDate() - 1);
    return `${sd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${ed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  let md = `# Week ${week} Training Log\n`;
  md += `*${fmtRange(start, end)}*\n\n`;

  if (entries.length === 0) {
    md += '*No sessions logged this week.*\n\n';
  } else {
    md += '## Sessions\n\n';

    const byDate = new Map<string, typeof entries>();
    for (const e of entries) {
      const arr = byDate.get(e.date) ?? [];
      arr.push(e);
      byDate.set(e.date, arr);
    }

    for (const [date, dayEntries] of Array.from(byDate.entries())) {
      const domain = dayEntries[0]?.domain;
      md += `### ${fmtDate(date)}${domain ? ` — ${domain}` : ''}\n\n`;

      const byExercise = new Map<string, typeof dayEntries>();
      for (const e of dayEntries) {
        const arr = byExercise.get(e.exercise) ?? [];
        arr.push(e);
        byExercise.set(e.exercise, arr);
      }

      for (const [exercise, sets] of byExercise) {
        const values = sets
          .filter((s) => s.value != null)
          .map((s) => `${s.value}${UNIT_LABEL[s.unit ?? ''] ?? s.unit ?? ''}`);
        const details = sets.filter((s) => s.detail).map((s) => s.detail!);
        if (values.length > 0) {
          md += `- **${exercise}** (${sets.length} sets) — ${values.join(', ')}\n`;
        } else if (details.length > 0) {
          md += `- **${exercise}** — ${details.join(', ')}\n`;
        } else {
          md += `- **${exercise}** (${sets.length} sets)\n`;
        }
      }
      md += '\n';
    }
  }

  // Stats
  const fatigueSets = entries.filter((e) => e.fatigue != null);
  const avgFatigue =
    fatigueSets.length > 0
      ? fatigueSets.reduce((s, e) => s + (e.fatigue ?? 0), 0) / fatigueSets.length
      : null;

  md += '## Stats\n\n';
  md += `- Total sets: ${entries.length}\n`;
  md += `- Days trained: ${new Set(entries.map((e) => e.date)).size}\n`;
  if (avgFatigue != null) md += `- Avg fatigue: ${avgFatigue.toFixed(1)} / 5\n`;
  md += '\n';

  if (inboxEntries.length > 0) {
    md += '## Captures this week\n\n';
    for (const e of inboxEntries) {
      md += `- ${EMOJI[e.type] ?? ''} **[${e.type}]** ${e.content}${e.url ? `\n  ${e.url}` : ''}\n`;
    }
    md += '\n';
  }

  md += '---\n*Generated with fitness-log-app*';
  return md;
}

// ─── JSON backup ─────────────────────────────────────────────────────────────

export async function buildBackupJson(): Promise<string> {
  const [sets, inbox, aliases] = await Promise.all([
    db.sets.toArray(),
    db.inbox.toArray(),
    db.exerciseAliases.toArray(),
  ]);
  return JSON.stringify(
    { exportedAt: new Date().toISOString(), sets, inbox, aliases },
    null,
    2,
  );
}
