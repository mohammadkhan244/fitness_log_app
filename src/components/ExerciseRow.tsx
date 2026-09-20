import type { Category, Unit } from '../types';
import Autocomplete from './Autocomplete';

export interface RowState {
  key: string;
  exercise: string;
  category: Category | '';
  set: number;
  value: string;
  unit: Unit | '';
  notes: string;
}

interface Props {
  row: RowState;
  exerciseNames: string[];
  onChange: (patch: Partial<RowState>) => void;
  onRepeat: () => void;
  onRemove: () => void;
  autoFocus?: boolean;
}

const CATEGORIES: Category[] = [
  'Fast Tempo', 'Slow Tempo', 'Skills', 'Guardian', 'Benchmark', 'Rest/Chaos', 'General',
];
const UNITS: Unit[] = ['reps', 'reps_total', 'reps_per_leg', 'lbs', 'seconds', 'none'];

const fieldCls =
  'bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

export default function ExerciseRow({
  row,
  exerciseNames,
  onChange,
  onRepeat,
  onRemove,
  autoFocus,
}: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
      {/* Row 1: exercise + category */}
      <div className="flex gap-2">
        <Autocomplete
          value={row.exercise}
          onChange={(v) => onChange({ exercise: v })}
          options={exerciseNames}
          placeholder="Exercise"
          autoFocus={autoFocus}
          className="flex-1"
        />
        <select
          value={row.category}
          onChange={(e) => onChange({ category: e.target.value as Category })}
          className={`w-36 ${fieldCls}`}
        >
          <option value="">Category</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Row 2: set / value / unit */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-gray-500">Set</span>
          <input
            type="number"
            value={row.set}
            onChange={(e) => onChange({ set: Number(e.target.value) })}
            min="1"
            className={`w-12 text-center ${fieldCls}`}
          />
        </div>
        <input
          type="number"
          value={row.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Value"
          step="any"
          className={`flex-1 ${fieldCls}`}
        />
        <select
          value={row.unit}
          onChange={(e) => onChange({ unit: e.target.value as Unit })}
          className={`w-28 ${fieldCls}`}
        >
          <option value="">Unit</option>
          {UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>

      {/* Row 3: notes + actions */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={row.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Notes (optional)"
          className={`flex-1 ${fieldCls} placeholder-gray-600`}
        />
        <button
          type="button"
          onClick={onRepeat}
          title="Repeat this set (next set number)"
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors flex-shrink-0"
        >
          +set
        </button>
        <button
          type="button"
          onClick={onRemove}
          title="Remove row"
          className="px-2 py-1.5 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
