import { notionProxy } from '../api/proxy';
import type { Category, Cause, DayStatus, Domain, Equipment, ExerciseSet, Unit } from '../types';
import { db } from './schema';

const DS_ID = import.meta.env.VITE_WORKOUT_LOG_DATA_SOURCE_ID as string;

// ─── Push local entries to Notion ────────────────────────────────────────────

function toNotionPage(e: ExerciseSet): object {
  return {
    parent: { type: 'data_source_id', data_source_id: DS_ID },
    properties: {
      Exercise: { title: [{ text: { content: e.exercise } }] },
      Date: { date: { start: e.date } },
      ...(e.week != null && { Week: { number: e.week } }),
      Year: { select: { name: String(new Date(e.date + 'T12:00:00').getFullYear()) } },
      Category: { select: { name: e.category || 'General' } },
      ...(e.value != null && { Value: { number: e.value } }),
      ...(e.unit && e.unit !== 'none' && { Unit: { select: { name: e.unit } } }),
      ...(e.domain && { Domain: { select: { name: e.domain } } }),
      ...(e.equipment && { Equipment: { select: { name: e.equipment } } }),
      ...(e.dayStatus && { 'Day Status': { select: { name: e.dayStatus } } }),
      ...(e.cause && { Cause: { select: { name: e.cause } } }),
      ...(e.fatigue != null && { Fatigue: { number: e.fatigue } }),
      ...(e.set != null && { Set: { number: e.set } }),
      ...(e.notes && { Notes: { rich_text: [{ text: { content: e.notes } }] } }),
      'Client ID': { rich_text: [{ text: { content: e.clientId } }] },
    },
  };
}

export interface SyncFailure {
  entry: ExerciseSet;
  message: string;
}

function parseNotionError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  try {
    const match = msg.match(/Proxy \d+: (.+)/s);
    if (match) {
      const body = JSON.parse(match[1]) as { message?: string };
      if (body.message) return body.message;
    }
  } catch { /* ignore */ }
  return msg;
}

export async function syncPending(): Promise<{ synced: number; failed: number; errors: SyncFailure[] }> {
  const pending = await db.sets.where('syncedAt').equals(0).toArray();
  let synced = 0;
  let failed = 0;
  const errors: SyncFailure[] = [];

  for (const entry of pending) {
    try {
      const page = await notionProxy<{ id: string }>({
        path: 'pages',
        method: 'POST',
        body: toNotionPage(entry),
      });
      await db.sets.update(entry.id!, { syncedAt: Date.now(), notionPageId: page.id });
      synced++;
    } catch (err) {
      failed++;
      errors.push({ entry, message: parseNotionError(err) });
    }
    await new Promise<void>((r) => setTimeout(r, 150));
  }

  return { synced, failed, errors };
}

// ─── Import historical data from Notion ──────────────────────────────────────

interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
}

function str(prop: unknown): string | undefined {
  const p = prop as { rich_text?: Array<{ plain_text: string }> } | null;
  return p?.rich_text?.[0]?.plain_text?.trim() || undefined;
}
function sel(prop: unknown): string | undefined {
  const p = prop as { select?: { name: string } | null } | null;
  return p?.select?.name || undefined;
}
function num(prop: unknown): number | undefined {
  const p = prop as { number?: number | null } | null;
  return p?.number ?? undefined;
}
function title(prop: unknown): string {
  const p = prop as { title?: Array<{ plain_text: string }> } | null;
  return p?.title?.[0]?.plain_text?.trim() ?? '';
}
function date(prop: unknown): string | undefined {
  const p = prop as { date?: { start: string } | null } | null;
  return p?.date?.start || undefined;
}

function fromNotionPage(page: NotionPage): Omit<ExerciseSet, 'id'> | null {
  const pr = page.properties;
  const exercise = title(pr['Exercise']);
  const entryDate = date(pr['Date']);
  if (!exercise || !entryDate) return null;

  return {
    clientId: str(pr['Client ID']) || crypto.randomUUID(),
    syncedAt: Date.now(),
    notionPageId: page.id,
    source: 'notion',
    date: entryDate,
    week: num(pr['Week']),
    domain: sel(pr['Domain']) as Domain | undefined,
    equipment: sel(pr['Equipment']) as Equipment | undefined,
    dayStatus: sel(pr['Day Status']) as DayStatus | undefined,
    cause: sel(pr['Cause']) as Cause | undefined,
    fatigue: num(pr['Fatigue']),
    exercise,
    category: (sel(pr['Category']) as Category) || 'General',
    set: num(pr['Set']),
    value: num(pr['Value']),
    unit: sel(pr['Unit']) as Unit | undefined,
    detail: str(pr['Detail']),
    notes: str(pr['Notes']),
  };
}

export async function importFromNotion(
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  // Build set of already-imported Notion page IDs to avoid duplicates
  const existing = new Set<string>(
    (await db.sets.toArray())
      .map((s) => s.notionPageId)
      .filter((id): id is string => !!id),
  );

  let cursor: string | undefined;
  let totalSeen = 0;
  const toInsert: Omit<ExerciseSet, 'id'>[] = [];

  do {
    const res = await notionProxy<{
      results: NotionPage[];
      has_more: boolean;
      next_cursor: string | null;
    }>({
      path: `data_sources/${DS_ID}/query`,
      method: 'POST',
      body: { ...(cursor && { start_cursor: cursor }), page_size: 100 },
    });

    for (const page of res.results) {
      totalSeen++;
      if (existing.has(page.id)) continue;
      const entry = fromNotionPage(page);
      if (entry) toInsert.push(entry);
    }

    onProgress?.(totalSeen, totalSeen); // show progress as pages are fetched
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
    // small pause between pages to be kind to the API
    if (cursor) await new Promise<void>((r) => setTimeout(r, 150));
  } while (cursor);

  if (toInsert.length > 0) {
    await db.sets.bulkAdd(toInsert);
  }

  await db.meta.put({ key: 'notionImportedAt', value: String(Date.now()) });
  return toInsert.length;
}
