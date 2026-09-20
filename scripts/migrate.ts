import 'dotenv/config';

const BASE = 'https://api.notion.com/v1';
const VERSION = '2025-09-03';

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}

const TOKEN = requireEnv('NOTION_TOKEN');
const DS_ID = requireEnv('WORKOUT_LOG_DATA_SOURCE_ID');
const PAGE_ID = requireEnv('PARENT_PAGE_ID');

async function api<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': VERSION,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(
      `Notion ${method} /${path} → ${res.status}\n${JSON.stringify(detail, null, 2)}`,
    );
  }
  return res.json() as T;
}

// ---- Property schema types ----

type SelectOption = { name: string };
type PropDef =
  | { type: 'title'; title: Record<string, never> }
  | { type: 'rich_text'; rich_text: Record<string, never> }
  | { type: 'number'; number: { format: 'number' } }
  | { type: 'select'; select: { options: SelectOption[] } }
  | { type: 'date'; date: Record<string, never> }
  | { type: 'checkbox'; checkbox: Record<string, never> }
  | { type: 'created_time'; created_time: Record<string, never> };

const sel = (...names: string[]): PropDef => ({
  type: 'select',
  select: { options: names.map((n) => ({ name: n })) },
});

// ---- New properties for the Workout Log data source ----

const WORKOUT_NEW_PROPS: Record<string, PropDef> = {
  Domain: sel('Gym', 'Home', 'Hotel', 'Outdoor'),
  Equipment: sel('Bodyweight', 'Dumbbell/KB', 'Machine/Cable', 'Barbell', 'Sandbag/Improvised', 'None'),
  Set: { type: 'number', number: { format: 'number' } },
  'Day Status': sel('Full', 'Reduced', 'Chaos-absorption', 'Rest-on-signal'),
  Cause: sel('Work', 'Sleep', 'Travel', 'Signal', 'Other'),
  Fatigue: { type: 'number', number: { format: 'number' } },
  'Client ID': { type: 'rich_text', rich_text: {} },
};

// ---- Decisions database schema ----

const DECISIONS_PROPS: Record<string, PropDef> = {
  Decision: { type: 'title', title: {} },
  'Date made': { type: 'created_time', created_time: {} },
  'What would change it': { type: 'rich_text', rich_text: {} },
  'Revisit date': { type: 'date', date: {} },
  Status: sel('Active', 'Revisit due', 'Changed', 'Confirmed'),
  'Outcome note': { type: 'rich_text', rich_text: {} },
};

// ---- Inbox database schema ----

const INBOX_PROPS: Record<string, PropDef> = {
  'Text or URL': { type: 'title', title: {} },
  Type: sel('Thought', 'Link', 'Quote'),
  'Principle tag': sel(
    'tendon-first',
    'chaos',
    'control-before-speed',
    'timed-stiffness',
    'mobility-over-load',
    'other',
  ),
  'Why it matters': { type: 'rich_text', rich_text: {} },
  Week: { type: 'number', number: { format: 'number' } },
  Shareable: { type: 'checkbox', checkbox: {} },
};

// ---- Step 1: Add missing properties to Workout Log ----

async function migrateWorkoutLog(): Promise<void> {
  console.log('[1/4] Checking Workout Log data source...');

  const ds = await api<{ properties: Record<string, unknown> }>(
    `data_sources/${DS_ID}`,
    'GET',
  );
  const existing = new Set(Object.keys(ds.properties));

  const toAdd = Object.fromEntries(
    Object.entries(WORKOUT_NEW_PROPS).filter(([name]) => !existing.has(name)),
  );
  const count = Object.keys(toAdd).length;

  if (count === 0) {
    console.log('      skip  — all 7 new properties already present');
    return;
  }

  console.log(`      add   — ${Object.keys(toAdd).join(', ')}`);
  await api(`data_sources/${DS_ID}`, 'PATCH', { properties: toAdd });
  console.log(`      done  — added ${count} propert${count === 1 ? 'y' : 'ies'}`);
}

// ---- List existing child databases under the parent page ----

async function listChildDatabases(): Promise<Array<{ id: string; title: string }>> {
  const dbs: Array<{ id: string; title: string }> = [];
  let cursor: string | undefined;

  do {
    const qs = cursor ? `?start_cursor=${cursor}` : '';
    const page = await api<{
      results: Array<{ id: string; type: string; child_database?: { title: string } }>;
      has_more: boolean;
      next_cursor: string | null;
    }>(`blocks/${PAGE_ID}/children${qs}`, 'GET');

    for (const block of page.results) {
      if (block.type === 'child_database' && block.child_database) {
        dbs.push({ id: block.id, title: block.child_database.title });
      }
    }
    cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined;
  } while (cursor);

  return dbs;
}

// ---- Step 2 & 3: Create a database if not already present ----

async function ensureDatabase(
  name: string,
  props: Record<string, PropDef>,
  existing: Array<{ id: string; title: string }>,
): Promise<void> {
  const found = existing.find((db) => db.title === name);
  if (found) {
    console.log(`      skip  — "${name}" already exists (${found.id})`);
    return;
  }

  const db = await api<{ id: string }>('databases', 'POST', {
    parent: { type: 'page_id', page_id: PAGE_ID },
    title: [{ type: 'text', text: { content: name } }],
    initial_data_source: { properties: props },
  });
  console.log(`      done  — "${name}" created (${db.id})`);
}

// ---- Main ----

async function main(): Promise<void> {
  console.log('Fitness 2.0 — Phase 0: Schema Migration');
  console.log('=========================================');

  await migrateWorkoutLog();

  console.log('[2/4] Listing child databases under parent page...');
  const existing = await listChildDatabases();
  console.log(`      found ${existing.length} child database(s)`);

  console.log('[3/4] Ensuring Decisions database...');
  await ensureDatabase('Decisions', DECISIONS_PROPS, existing);

  console.log('[4/4] Ensuring Inbox database...');
  await ensureDatabase('Inbox', INBOX_PROPS, existing);

  console.log('\nMigration complete.');
}

main().catch((e) => {
  console.error(`\nERROR: ${(e as Error).message}`);
  process.exit(1);
});
