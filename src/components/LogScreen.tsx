import { useEffect, useState } from 'react';
import { db } from '../db/schema';
import { useExercises } from '../hooks/useExercises';
import type { Category, Equipment, ExerciseSet, Unit } from '../types';
import ExerciseRow, { type RowState } from './ExerciseRow';
import SessionHeader, { type SessionValues } from './SessionHeader';

const PROGRAM_START = new Date('2025-06-23T00:00:00');

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekFromDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const days = Math.round((d.getTime() - PROGRAM_START.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return '';
  return String(Math.floor(days / 7) + 1);
}

function defaultSession(): SessionValues {
  const t = today();
  return { date: t, week: weekFromDate(t) };
}

function loadSession(): SessionValues {
  const t = today();
  try {
    const raw = localStorage.getItem('session-meta');
    if (raw) {
      const saved = JSON.parse(raw) as Partial<SessionValues>;
      return { ...defaultSession(), ...saved, date: t, week: weekFromDate(t) };
    }
  } catch { /* ignore */ }
  return defaultSession();
}

function newRow(): RowState {
  return {
    key: crypto.randomUUID(),
    exercise: '',
    category: '',
    equipment: 'Bodyweight',
    sets: 3,
    reps: '',
    unit: 'reps',
    notes: '',
  };
}

interface Props {
  sync: () => Promise<void>;
  saveTrigger: React.MutableRefObject<() => void>;
  onSavingChange: (saving: boolean, msg: string) => void;
}

export default function LogScreen({ sync, saveTrigger, onSavingChange }: Props) {
  const [session, setSession] = useState<SessionValues>(loadSession);
  const [rows, setRows] = useState<RowState[]>(() => [newRow()]);
  const { names: exerciseNames } = useExercises();

  function updateSession(patch: Partial<SessionValues>) {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      if (patch.date && !('week' in patch)) {
        next.week = weekFromDate(patch.date);
      }
      try { localStorage.setItem('session-meta', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    const valid = rows.filter((r) => r.exercise.trim());
    if (valid.length === 0) {
      onSavingChange(false, 'Add at least one exercise.');
      return;
    }

    onSavingChange(true, '');
    try {
      const base = {
        date: session.date,
        week: session.week ? Number(session.week) : undefined,
      };
      const entries: Omit<ExerciseSet, 'id'>[] = valid.flatMap((r) =>
        Array.from({ length: r.sets }, (_, i) => ({
          ...base,
          clientId: crypto.randomUUID(),
          syncedAt: 0,
          exercise: r.exercise.trim(),
          category: r.category as Category,
          equipment: (r.equipment || undefined) as Equipment | undefined,
          set: i + 1,
          value: r.reps ? Number(r.reps) : undefined,
          unit: r.unit as Unit,
          notes: r.notes || undefined,
        })),
      );

      await db.sets.bulkAdd(entries);

      // Persist any newly typed exercise names
      const uniqueNames = [...new Set(valid.map((r) => r.exercise.trim()))];
      for (const name of uniqueNames) {
        try { await db.exercises.add({ name }); } catch { /* already exists */ }
      }

      setRows([newRow()]);
      onSavingChange(false, `${entries.length} set${entries.length > 1 ? 's' : ''} saved`);
      void sync();
    } catch (err) {
      onSavingChange(false, 'Save failed');
      console.error(err);
    }
  }

  useEffect(() => {
    saveTrigger.current = () => void handleSave();
  });

  return (
    <div className="max-w-lg mx-auto">
      <SessionHeader values={session} onChange={updateSession} />

      <div className="p-4 space-y-3">
        {rows.map((row, i) => (
          <ExerciseRow
            key={row.key}
            row={row}
            exerciseNames={exerciseNames}
            onChange={(patch) => updateRow(row.key, patch)}
            onRemove={() => removeRow(row.key)}
            autoFocus={i === rows.length - 1 && row.exercise === ''}
          />
        ))}

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, newRow()])}
          className="w-full h-11 border border-dashed border-gray-700 rounded-xl text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600 active:bg-gray-900 transition-colors"
        >
          + Add exercise
        </button>
      </div>
    </div>
  );
}
