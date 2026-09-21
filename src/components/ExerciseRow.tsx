import type { Category } from '../types';
import Autocomplete from './Autocomplete';

export interface RowState {
  key: string;
  exercise: string;
  category: Category | '';
  sets: number;
  reps: string;
  unit: 'reps' | 'seconds';
  notes: string;
}

interface Props {
  row: RowState;
  exerciseNames: string[];
  onChange: (patch: Partial<RowState>) => void;
  onRemove: () => void;
  autoFocus?: boolean;
}

const CATEGORIES: Category[] = [
  'Fast Tempo', 'Slow Tempo', 'Skills', 'Guardian', 'Benchmark', 'Rest/Chaos', 'General',
];

const fieldCls =
  'bg-gray-800 border border-gray-700 rounded-lg px-3 h-11 text-base text-gray-100 focus:outline-none focus:border-blue-500';

export default function ExerciseRow({ row, exerciseNames, onChange, onRemove, autoFocus }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2">
      {/* Row 1: exercise + category */}
      <div className="flex gap-2">
        <Autocomplete
          value={row.exercise}
          onChange={(v) => onChange({ exercise: v })}
          options={exerciseNames}
          placeholder="Exercise"
          autoFocus={autoFocus}
          className="flex-1 min-w-0"
        />
        <select
          value={row.category}
          onChange={(e) => onChange({ category: e.target.value as Category })}
          className={`w-32 flex-shrink-0 ${fieldCls}`}
        >
          <option value="">Category</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Row 2: sets × reps + unit toggle */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-500">Sets</span>
          <input
            type="number"
            value={row.sets}
            onChange={(e) => onChange({ sets: Math.max(1, Number(e.target.value)) })}
            min="1"
            inputMode="numeric"
            className={`w-12 text-center flex-shrink-0 ${fieldCls}`}
          />
        </div>
        <span className="text-gray-600 flex-shrink-0">×</span>
        <input
          type="number"
          value={row.reps}
          onChange={(e) => onChange({ reps: e.target.value })}
          placeholder={row.unit === 'seconds' ? 'Sec' : 'Reps'}
          inputMode="numeric"
          className={`flex-1 min-w-0 ${fieldCls}`}
        />
        {/* Unit pill toggle */}
        <div className="flex flex-shrink-0 rounded-lg overflow-hidden border border-gray-700 h-11">
          {(['reps', 'seconds'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => onChange({ unit: u })}
              className={`px-3 text-sm font-medium transition-colors ${
                row.unit === u
                  ? 'bg-white text-gray-900'
                  : 'bg-gray-800 text-gray-500 hover:text-gray-200'
              }`}
            >
              {u === 'reps' ? 'reps' : 'sec'}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: notes + remove */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={row.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Notes (optional)"
          className={`flex-1 min-w-0 ${fieldCls} placeholder-gray-600`}
        />
        <button
          type="button"
          onClick={onRemove}
          className="h-11 w-11 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 text-xl"
        >
          ×
        </button>
      </div>
    </div>
  );
}
