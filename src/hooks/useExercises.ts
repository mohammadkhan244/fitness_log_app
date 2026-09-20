import { useEffect, useState } from 'react';
import { notionProxy } from '../api/proxy';
import { db } from '../db/schema';

const DS_ID = import.meta.env.VITE_WORKOUT_LOG_DATA_SOURCE_ID as string;
const CACHE_TTL = 24 * 60 * 60 * 1000;

export function useExercises(): { names: string[]; refreshing: boolean } {
  const [names, setNames] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    const cached = await db.exercises.toArray();
    if (cached.length > 0) {
      setNames(cached.map((e) => e.name).sort());
    }

    const meta = await db.meta.get('exercisesCachedAt');
    const stale = !meta || Date.now() - Number(meta.value) > CACHE_TTL;
    if (stale && navigator.onLine) {
      setRefreshing(true);
      try {
        await fetchAndCache();
        const fresh = await db.exercises.toArray();
        setNames(fresh.map((e) => e.name).sort());
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
