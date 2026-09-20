import { notionProxy } from '../api/proxy';
import type { ExerciseSet } from '../types';
import { db } from './schema';

const DS_ID = import.meta.env.VITE_WORKOUT_LOG_DATA_SOURCE_ID as string;

function toNotionPage(e: ExerciseSet): object {
  return {
    parent: { type: 'data_source_id', data_source_id: DS_ID },
    properties: {
      Exercise: { title: [{ text: { content: e.exercise } }] },
      Date: { date: { start: e.date } },
      ...(e.week != null && { Week: { number: e.week } }),
      Year: { select: { name: String(new Date(e.date + 'T12:00:00').getFullYear()) } },
      Category: { select: { name: e.category } },
      ...(e.value != null && { Value: { number: e.value } }),
      ...(e.unit && e.unit !== 'none' && { Unit: { select: { name: e.unit } } }),
      Domain: { select: { name: e.domain } },
      Equipment: { select: { name: e.equipment } },
      'Day Status': { select: { name: e.dayStatus } },
      ...(e.cause && { Cause: { select: { name: e.cause } } }),
      ...(e.fatigue != null && { Fatigue: { number: e.fatigue } }),
      ...(e.set != null && { Set: { number: e.set } }),
      ...(e.notes && { Notes: { rich_text: [{ text: { content: e.notes } }] } }),
      'Client ID': { rich_text: [{ text: { content: e.clientId } }] },
    },
  };
}

export async function syncPending(): Promise<{ synced: number; failed: number }> {
  const pending = await db.sets.where('syncedAt').equals(0).toArray();
  let synced = 0;
  let failed = 0;

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
      console.error('[sync] failed for', entry.clientId, err);
    }
    // Throttle: ~6 req/sec, safely under the 10/sec Business plan limit
    await new Promise<void>((r) => setTimeout(r, 150));
  }

  return { synced, failed };
}
