import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { ExerciseSet } from '../types';

interface Props {
  week: number;
  onClose: () => void;
}

const PROGRAM_START_MS = new Date('2025-06-23T00:00:00').getTime();

function weekDateRange(week: number): [string, string] {
  const startMs = PROGRAM_START_MS + (week - 1) * 7 * 24 * 3600 * 1000;
  const endMs = startMs + 7 * 24 * 3600 * 1000;
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return [fmt(startMs), fmt(endMs)];
}

function computedWeek(date: string): number {
  const d = new Date(date + 'T12:00:00').getTime();
  const days = Math.round((d - PROGRAM_START_MS) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

const UNIT_SHORT: Record<string, string> = {
  seconds: 's',
  lbs: 'lbs',
  reps_total: 'reps',
  reps: 'reps',
  reps_per_leg: 'reps/leg',
  none: '',
};

export default function WeekDetail({ week, onClose }: Props) {
  const [start, end] = weekDateRange(week);

  // Full-table scan so we catch entries regardless of whether they have
  // an explicit week field, a date in range, or just a computed-week match.
  // The dataset is small enough (<10k rows) that this is effectively instant.
  const allEntries = useLiveQuery(async () => {
    const all = await db.sets.toArray();
    const matched = all.filter(
      (s) =>
        s.week === week ||               // Notion-imported week field
        (s.date >= start && s.date < end) || // date falls in computed range
        computedWeek(s.date) === week,       // computed week matches
    );
    return matched.sort((a, b) => a.date.localeCompare(b.date));
  }, [week]);

  const byDate = new Map<string, ExerciseSet[]>();
  for (const e of allEntries ?? []) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }

  const totalSets = allEntries?.length ?? 0;

  return (
    <div className="fixed inset-0 z-30 bg-black/60 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-t-2xl max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-700" />
        </div>

        <div className="px-4 pb-2 flex items-center justify-between">
          <div>
            <span className="text-base font-semibold text-gray-100">Week {week}</span>
            <span className="text-xs text-gray-500 ml-2">{start} → {end}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{totalSets} sets</span>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {!allEntries ? (
          <div className="p-4 text-xs text-gray-600 text-center">Loading…</div>
        ) : allEntries.length === 0 ? (
          <div className="p-4 text-xs text-gray-600 text-center">
            No entries found for week {week}.
          </div>
        ) : (
          <div className="px-4 pb-6 space-y-4">
            {Array.from(byDate.entries()).map(([date, dayEntries]) => (
              <div key={date}>
                <div className="text-xs text-gray-500 font-medium mb-2 sticky top-0 bg-gray-900 py-1">
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {dayEntries[0]?.domain && (
                    <span className="ml-2 text-gray-600">· {dayEntries[0].domain}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayEntries.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-800/50">
                      <span className="text-gray-300 flex-1 min-w-0 truncate">{e.exercise}</span>
                      {e.set != null && (
                        <span className="text-gray-600 text-xs flex-shrink-0">set {e.set}</span>
                      )}
                      {e.value != null && (
                        <span className="text-amber-400 text-xs font-medium flex-shrink-0">
                          {e.value}{UNIT_SHORT[e.unit ?? ''] ?? e.unit ?? ''}
                        </span>
                      )}
                      {e.value == null && e.detail && (
                        <span className="text-amber-400 text-xs font-medium flex-shrink-0">{e.detail}</span>
                      )}
                      {e.category && e.category !== 'General' && (
                        <span className="text-gray-700 text-xs flex-shrink-0">{e.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
