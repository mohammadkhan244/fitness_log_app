import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { notionProxy } from '../api/proxy';
import { db } from '../db/schema';

const DS_ID = import.meta.env.VITE_WORKOUT_LOG_DATA_SOURCE_ID as string;
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function useExercises(): { names: string[]; refreshing: boolean } {
  const [refreshing, setRefreshing] = useState(false);

  // Reactive — updates immediately when any exercise is added to the DB
  const exercises = useLiveQuery(() => db.exercises.toArray(), []) ?? [];
  const names = exercises.map((e) => e.name).sort();

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    // If cache is empty, populate from DB first so autocomplete isn't blank
    const meta = await db.meta.get('exercisesCachedAt');
    const stale = !meta || Date.now() - Number(meta.value) > CACHE_TTL;
    if (stale && navigator.onLine) {
      setRefreshing(true);
      try {
        await fetchAndCache();
      } catch (err) {
        console.error('[exercises] cache refresh failed:', err);
      } finally {
        setRefreshing(false);
      }
    }
  }

  return { names, refreshing };
}

async function fetchAndCache() {
  const allNames = new Set<string>();
  let cursor: string | undefined;

  do {
    const res = await notionProxy<{
      results: Array<{
        properties: { Exercise: { title: Array<{ plain_text: string }> } };
      }>;
      has_more: boolean;
      next_cursor: string | null;
    }>({
      path: `data_sources/${DS_ID}/query`,
      method: 'POST',
      body: { ...(cursor && { start_cursor: cursor }), page_size: 100 },
    });

    for (const row of res.results) {
      const name = row.properties.Exercise?.title?.[0]?.plain_text?.trim();
      if (name) allNames.add(name);
    }
    cursor = res.has_more && res.next_cursor ? res.next_cursor : undefined;
  } while (cursor);

  await db.transaction('rw', db.exercises, db.meta, async () => {
    await db.exercises.clear();
    await db.exercises.bulkAdd([...allNames].map((name) => ({ name })));
    await db.meta.put({ key: 'exercisesCachedAt', value: String(Date.now()) });
  });
}
