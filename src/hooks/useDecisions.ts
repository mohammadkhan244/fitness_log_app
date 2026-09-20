import { useEffect, useState } from 'react';
import { notionProxy } from '../api/proxy';
import { db } from '../db/schema';

export interface Decision {
  id: string;
  name: string;
  trigger: string;
  revisitDate: string | null;
  status: string;
  outcomeNote: string;
}

interface UseDecisionsResult {
  decisions: Decision[];
  loading: boolean;
  error: string | null;
  markStatus: (id: string, status: 'Confirmed' | 'Changed') => Promise<void>;
  refresh: () => void;
}

function parseDecisions(
  results: Array<{ id: string; properties: Record<string, unknown> }>,
): Decision[] {
  return results.map((page) => {
    const pr = page.properties;
    const titleProp = pr['Decision'] as { title?: Array<{ plain_text: string }> } | null;
    const trigProp = pr['What would change it'] as { rich_text?: Array<{ plain_text: string }> } | null;
    const dateProp = pr['Revisit date'] as { date?: { start: string } | null } | null;
    const statusProp = pr['Status'] as { select?: { name: string } | null } | null;
    const noteProp = pr['Outcome note'] as { rich_text?: Array<{ plain_text: string }> } | null;

    return {
      id: page.id,
      name: titleProp?.title?.[0]?.plain_text ?? '(untitled)',
      trigger: trigProp?.rich_text?.[0]?.plain_text ?? '',
      revisitDate: dateProp?.date?.start ?? null,
      status: statusProp?.select?.name ?? '',
      outcomeNote: noteProp?.rich_text?.[0]?.plain_text ?? '',
    };
  });
}

async function findDecisionsDbId(): Promise<string | null> {
  // Check cache first
  const cached = await db.meta.get('decisionsDbId');
  if (cached) return cached.value;

  // Notion 2025-09-03: search filter values are "page" | "data_source"
  const res = await notionProxy<{
    results: Array<{
      id: string;
      object: string;
      title?: Array<{ plain_text: string }>;
    }>;
  }>({
    path: 'search',
    method: 'POST',
    body: {
      query: 'Decisions',
      filter: { value: 'data_source', property: 'object', in_trash: false },
    },
  });

  const found = res.results.find(
    (r) =>
      (r.object === 'data_source' || r.object === 'database') &&
      r.title?.[0]?.plain_text === 'Decisions',
  );
  if (!found) return null;

  await db.meta.put({ key: 'decisionsDbId', value: found.id });
  return found.id;
}

async function fetchDecisions(dsId: string): Promise<Decision[]> {
  // Use data_sources query (2025-09-03 API)
  const res = await notionProxy<{
    results: Array<{ id: string; properties: Record<string, unknown> }>;
  }>({
    path: `data_sources/${dsId}/query`,
    method: 'POST',
    body: {},
  });
  return parseDecisions(res.results);
}

export function useDecisions(): UseDecisionsResult {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!navigator.onLine) {
      setLoading(false);
      setError('Offline — decisions require a connection');
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Clear stale cache if previous fetch failed
        const dsId = await findDecisionsDbId();
        if (!dsId) {
          throw new Error(
            'Decisions database not found in Notion — run npm run migrate first, then add decisions in Notion',
          );
        }
        const all = await fetchDecisions(dsId);
        if (!cancelled) setDecisions(all);
      } catch (e) {
        // Clear cached ID on error so next attempt re-searches
        void db.meta.delete('decisionsDbId');
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load decisions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const markStatus = async (id: string, status: 'Confirmed' | 'Changed') => {
    await notionProxy({
      path: `pages/${id}`,
      method: 'PATCH',
      body: { properties: { Status: { select: { name: status } } } },
    });
    setTick((t) => t + 1);
  };

  return { decisions, loading, error, markStatus, refresh: () => setTick((t) => t + 1) };
}
