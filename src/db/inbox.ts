import { notionProxy } from '../api/proxy';
import { db } from './schema';

// ─── Week helpers ─────────────────────────────────────────────────────────────

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

// ─── Markdown export ──────────────────────────────────────────────────────────

const EMOJI: Record<string, string> = { Thought: '💭', Link: '🔗', Quote: '💬' };
const UNIT_LABEL: Record<string, string> = {
  seconds: 's', lbs: 'lbs', reps_total: 'reps', reps: 'reps', reps_per_leg: 'reps/leg', none: '',
};

export async function buildWeekMarkdown(week: number): Promise<string> {
  const [start, end] = weekDateRange(week);

  const all = await db.sets.toArray();
  const entries = all
    .filter((s) => s.week === week || (s.date >= start && s.date < end))
    .sort((a, b) => a.date.localeCompare(b.date));

  const inboxEntries = await db.inbox.where('week').equals(week).toArray();

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'short', day: 'numeric',
    });
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

// ─── Notion page export ───────────────────────────────────────────────────────

type RichText = {
  text: { content: string };
  annotations?: { bold?: boolean; italic?: boolean };
};

function parseRichText(text: string): RichText[] {
  const parts: RichText[] = [];
  let i = 0;
  let buf = '';

  while (i < text.length) {
    if (text[i] === '*' && text[i + 1] === '*') {
      if (buf) { parts.push({ text: { content: buf } }); buf = ''; }
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        parts.push({ text: { content: text.slice(i + 2, end) }, annotations: { bold: true } });
        i = end + 2;
      } else { buf += '**'; i += 2; }
    } else if (text[i] === '*') {
      if (buf) { parts.push({ text: { content: buf } }); buf = ''; }
      const end = text.indexOf('*', i + 1);
      if (end !== -1) {
        parts.push({ text: { content: text.slice(i + 1, end) }, annotations: { italic: true } });
        i = end + 1;
      } else { buf += '*'; i++; }
    } else {
      buf += text[i++];
    }
  }
  if (buf) parts.push({ text: { content: buf } });
  return parts.filter((p) => p.text.content.length > 0);
}

function mdToBlocks(md: string): object[] {
  const blocks: object[] = [];
  for (const line of md.split('\n')) {
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading_1', heading_1: { rich_text: parseRichText(line.slice(2)) } });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading_2', heading_2: { rich_text: parseRichText(line.slice(3)) } });
    } else if (line.startsWith('### ')) {
      blocks.push({ type: 'heading_3', heading_3: { rich_text: parseRichText(line.slice(4)) } });
    } else if (line.startsWith('- ')) {
      blocks.push({ type: 'bulleted_list_item', bulleted_list_item: { rich_text: parseRichText(line.slice(2)) } });
    } else if (line === '---') {
      blocks.push({ type: 'divider', divider: {} });
    } else if (line.trim() !== '') {
      blocks.push({ type: 'paragraph', paragraph: { rich_text: parseRichText(line) } });
    }
  }
  return blocks;
}

export async function exportWeekToNotion(week: number): Promise<string> {
  const parentPageId = import.meta.env.VITE_PARENT_PAGE_ID as string | undefined;
  if (!parentPageId) throw new Error('VITE_PARENT_PAGE_ID not configured');

  const md = await buildWeekMarkdown(week);
  const blocks = mdToBlocks(md);

  const page = await notionProxy<{ id: string; url: string }>({
    path: 'pages',
    method: 'POST',
    body: {
      parent: { page_id: parentPageId },
      properties: {
        title: [{ text: { content: `Week ${week} Training Log` } }],
      },
      children: blocks.slice(0, 100),
    },
  });

  return page.url;
}

// ─── JSON backup ──────────────────────────────────────────────────────────────

export async function buildBackupJson(): Promise<string> {
  const [sets, inbox, aliases] = await Promise.all([
    db.sets.toArray(),
    db.inbox.toArray(),
    db.exerciseAliases.toArray(),
  ]);
  return JSON.stringify({ exportedAt: new Date().toISOString(), sets, inbox, aliases }, null, 2);
}
