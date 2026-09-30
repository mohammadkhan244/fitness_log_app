import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { updateEntryDate } from '../db/sync';
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


const UNIT_SHORT: Record<string, string> = {
  seconds: 's', minutes: 'min', lbs: 'lbs',
  reps_total: 'reps', reps: 'reps', reps_per_leg: 'reps/leg',
  miles: 'mi', km: 'km', meters: 'm',
  none: '',
};

export default function WeekDetail({ week, onClose }: Props) {
  const [start, end] = weekDateRange(week);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [pendingDate, setPendingDate] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [pendingEntryDate, setPendingEntryDate] = useState('');
  const [saving, setSaving] = useState(false);

  const allEntries = useLiveQuery(async () => {
    const all = await db.sets.toArray();
    const matched = all.filter(
      (s) =>
        s.week === week ||
        (s.date >= start && s.date < end) ||
        (Math.max(1, Math.floor(Math.round((new Date(s.date + 'T12:00:00').getTime() - PROGRAM_START_MS) / 86400000) / 7) + 1)) === week,
    );
    return matched.sort((a, b) => a.date.localeCompare(b.date));
  }, [week]);

  const byDate = new Map<string, ExerciseSet[]>();
  for (const e of allEntries ?? []) {
    const arr = byDate.get(e.date) ?? [];
    arr.push(e);
    byDate.set(e.date, arr);
  }

  async function handleMoveEntry(entry: ExerciseSet, newDate: string) {
    if (!newDate || newDate === entry.date) { setEditingEntryId(null); return; }
    setSaving(true);
    try {
      await updateEntryDate(entry.id!, entry.notionPageId, newDate);
    } finally {
      setSaving(false);
      setEditingEntryId(null);
    }
  }

  async function handleMoveDate(dayEntries: ExerciseSet[], newDate: string) {
    if (!newDate || newDate === dayEntries[0]?.date) {
      setEditingDate(null);
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        dayEntries.map((e) => updateEntryDate(e.id!, e.notionPageId, newDate)),
      );
    } finally {
      setSaving(false);
      setEditingDate(null);
    }
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
          <div className="p-4 text-xs text-gray-600 text-center">No entries found for week {week}.</div>
        ) : (
          <div className="px-4 pb-6 space-y-4">
            {Array.from(byDate.entries()).map(([date, dayEntries]) => (
              <div key={date}>
                {/* Day header */}
                <div className="sticky top-0 bg-gray-900 py-1 mb-2 flex items-center justify-between">
                  {editingDate === date ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="date"
                        defaultValue={date}
                        onChange={(e) => setPendingDate(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-2 h-8 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => void handleMoveDate(dayEntries, pendingDate || date)}
                        disabled={saving}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
                      >
                        {saving ? 'Moving…' : 'Move'}
                      </button>
                      <button
                        onClick={() => setEditingDate(null)}
                        className="text-xs text-gray-500 hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                        {dayEntries[0]?.domain && (
                          <span className="ml-2 text-gray-600">· {dayEntries[0].domain}</span>
                        )}
                      </span>
                      <button
                        onClick={() => { setEditingDate(date); setPendingDate(date); setEditingEntryId(null); }}
                        className="text-gray-600 hover:text-gray-300 text-xs px-2 py-0.5 rounded transition-colors"
                        title="Fix date"
                      >
                        ✎
                      </button>
                    </>
                  )}
                </div>

                {/* Entries */}
                <div className="space-y-1">
                  {dayEntries.map((e) => (
                    editingEntryId === e.id ? (
                      <div key={e.id} className="flex items-center gap-2 py-1 border-b border-gray-800/50">
                        <span className="text-xs text-gray-400 truncate flex-shrink-0 max-w-[90px]">{e.exercise}</span>
                        <input
                          type="date"
                          defaultValue={e.date}
                          onChange={(ev) => setPendingEntryDate(ev.target.value)}
                          className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-2 h-7 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => void handleMoveEntry(e, pendingEntryDate || e.date)}
                          disabled={saving}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50 flex-shrink-0"
                        >
                          {saving ? '…' : 'Move'}
                        </button>
                        <button
                          onClick={() => setEditingEntryId(null)}
                          className="text-xs text-gray-500 hover:text-gray-300 flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div key={e.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-800/50">
                        <span className="text-gray-300 flex-1 min-w-0 truncate">{e.exercise}</span>
                        {e.set != null && (
                          <span className="text-gray-600 text-xs flex-shrink-0">set {e.set}</span>
                        )}
                        {e.value != null && (
                          <span className="text-amber-400 text-xs font-medium flex-shrink-0">
                            {e.value}{UNIT_SHORT[e.unit ?? ''] ?? e.unit ?? ''}
                            {e.load != null && <span className="text-gray-500 font-normal"> @ {e.load}lbs</span>}
                          </span>
                        )}
                        {e.value == null && e.detail && (
                          <span className="text-amber-400 text-xs font-medium flex-shrink-0">{e.detail}</span>
                        )}
                        {e.category && e.category !== 'General' && (
                          <span className="text-gray-700 text-xs flex-shrink-0">{e.category}</span>
                        )}
                        <button
                          onClick={() => { setEditingEntryId(e.id!); setPendingEntryDate(e.date); setEditingDate(null); }}
                          className="text-gray-700 hover:text-gray-400 text-xs flex-shrink-0 transition-colors"
                          title="Fix date for this exercise"
                        >
                          ✎
                        </button>
                      </div>
                    )
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
