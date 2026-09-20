import { useState } from 'react';
import { db } from '../db/schema';
import { useExercises } from '../hooks/useExercises';
import type { Category, Cause, DayStatus, Domain, Equipment, ExerciseSet, Unit } from '../types';
import ExerciseRow, { type RowState } from './ExerciseRow';
import SessionHeader, { type SessionValues } from './SessionHeader';

// Week 1 = June 23, 2025 (the Monday from which Notion weekly tracking began)
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
  return { date: t, week: weekFromDate(t), domain: 'Gym', equipment: 'Bodyweight', dayStatus: 'Full', cause: '', fatigue: '' };
}

function loadSession(): SessionValues {
  const t = today();
  try {
    const raw = localStorage.getItem('session-meta');
    if (raw) {
      const saved = JSON.parse(raw) as Partial<SessionValues>;
      // Always reset date and week to today on load
      return { ...defaultSession(), ...saved, date: t, week: weekFromDate(t) };
    }
  } catch { /* ignore */ }
  return defaultSession();
}

function newRow(set: number, from?: RowState): RowState {
  return {
    key: crypto.randomUUID(),
    exercise: from?.exercise ?? '',
    category: from?.category ?? '',
    set,
    value: '',
    unit: from?.unit ?? '',
    notes: '',
  };
}

export default function LogScreen({ sync }: { sync: () => Promise<void> }) {
  const [session, setSession] = useState<SessionValues>(loadSession);
  const [rows, setRows] = useState<RowState[]>(() => [newRow(1)]);
  const [headerOpen, setHeaderOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const { names: exerciseNames } = useExercises();

  function updateSession(patch: Partial<SessionValues>) {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      // Auto-recompute week when date changes (user can still override week separately)
      if (patch.date && !('week' in patch)) {
        next.week = weekFromDate(patch.date);
      }
      try { localStorage.setItem('session-meta', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  function repeatRow(index: number) {
    const row = rows[index];
    const next = newRow(row.set + 1, row);
    setRows((prev) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, next);
      return updated;
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
    if (valid.length === 0) { setMsg('Add at least one exercise.'); return; }

    setSaving(true);
    setMsg('');
    try {
      const entries: Omit<ExerciseSet, 'id'>[] = valid.map((r) => ({
        clientId: crypto.randomUUID(),
        syncedAt: 0,
        date: session.date,
        week: session.week ? Number(session.week) : undefined,
        domain: session.domain as Domain,
        equipment: session.equipment as Equipment,
        dayStatus: session.dayStatus as DayStatus,
        cause: (session.cause || undefined) as Cause | undefined,
        fatigue: session.fatigue ? Number(session.fatigue) : undefined,
        exercise: r.exercise.trim(),
        category: r.category as Category,
        set: r.set,
        value: r.value ? Number(r.value) : undefined,
        unit: (r.unit || undefined) as Unit | undefined,
        notes: r.notes || undefined,
      }));

      await db.sets.bulkAdd(entries);
      setRows([newRow(1)]);
      setMsg(`${valid.length} set${valid.length > 1 ? 's' : ''} saved.`);
      void sync();
    } catch (err) {
      setMsg('Save failed — check console.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-36">
      <SessionHeader
        values={session}
        onChange={updateSession}
        collapsed={!headerOpen}
        onToggle={() => setHeaderOpen((o) => !o)}
      />

      <div className="p-4 space-y-3">
        {rows.map((row, i) => (
          <ExerciseRow
            key={row.key}
            row={row}
            exerciseNames={exerciseNames}
            onChange={(patch) => updateRow(row.key, patch)}
            onRepeat={() => repeatRow(i)}
            onRemove={() => removeRow(row.key)}
            autoFocus={i === rows.length - 1 && row.exercise === ''}
          />
        ))}

        <button
          type="button"
          onClick={() => {
            const last = rows[rows.length - 1];
            setRows((prev) => [...prev, newRow((last?.set ?? 0) + 1)]);
          }}
          className="w-full py-2.5 border border-dashed border-gray-700 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
        >
          + Add exercise
        </button>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-12 inset-x-0 bg-gray-950 border-t border-gray-800 p-4 flex items-center gap-3">
        <div className="max-w-lg mx-auto w-full flex items-center gap-3">
          {msg && <span className="text-xs text-gray-400 flex-1 truncate">{msg}</span>}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="ml-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
        </div>
      </div>
    </div>
  );
}
