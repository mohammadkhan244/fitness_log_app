import type { Category, Equipment, Unit } from '../types';
import Autocomplete from './Autocomplete';

export interface RowState {
  key: string;
  exercise: string;
  category: Category | '';
  equipment: Equipment | '';
  sets: string;
  reps: string;
  unit: Unit;
  load: string;   // weight in lbs, separate from rep value
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
const EQUIPMENTS: Equipment[] = [
  'Bodyweight', 'Dumbbell', 'Kettlebell', 'Sandbag', 'Weighted Backpack', 'Machine/Cable', 'Barbell', 'None',
];

const DECIMAL_UNITS = new Set<Unit>(['miles', 'km', 'meters']);

const VALUE_PLACEHOLDER: Partial<Record<Unit, string>> = {
  reps: 'Reps', reps_per_leg: 'Reps/leg', reps_total: 'Total reps',
  seconds: 'Seconds', minutes: 'Minutes',
  miles: 'Miles', km: 'Km', meters: 'Meters',
};

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
          className={`w-28 flex-shrink-0 ${fieldCls}`}
        >
          <option value="">Category</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Row 2: equipment */}
      <select
        value={row.equipment}
        onChange={(e) => onChange({ equipment: e.target.value as Equipment })}
        className={`w-full ${fieldCls}`}
      >
        <option value="">Equipment</option>
        {EQUIPMENTS.map((eq) => <option key={eq}>{eq}</option>)}
      </select>

      {/* Row 3: sets × value + unit */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-gray-500">Sets</span>
          <input
            type="number"
            value={row.sets}
            onChange={(e) => onChange({ sets: e.target.value })}
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
          placeholder={VALUE_PLACEHOLDER[row.unit] ?? 'Value'}
          inputMode={DECIMAL_UNITS.has(row.unit) ? 'decimal' : 'numeric'}
          step={DECIMAL_UNITS.has(row.unit) ? 'any' : undefined}
          className={`flex-1 min-w-0 ${fieldCls}`}
        />
        <select
          value={row.unit}
          onChange={(e) => onChange({ unit: e.target.value as Unit })}
          className={`w-28 flex-shrink-0 ${fieldCls}`}
        >
          <optgroup label="Reps">
            <option value="reps">reps</option>
            <option value="reps_per_leg">reps/leg</option>
            <option value="reps_total">total reps</option>
          </optgroup>
          <optgroup label="Time">
            <option value="seconds">seconds</option>
            <option value="minutes">minutes</option>
          </optgroup>
          <optgroup label="Distance">
            <option value="miles">miles</option>
            <option value="km">km</option>
            <option value="meters">meters</option>
          </optgroup>
        </select>
      </div>

      {/* Row 4: weight (optional) + notes + remove */}
      <div className="flex gap-2 items-center">
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            value={row.load}
            onChange={(e) => onChange({ load: e.target.value })}
            placeholder="lbs"
            inputMode="decimal"
            step="any"
            className={`w-16 text-center ${fieldCls}`}
          />
          <span className="text-xs text-gray-500 flex-shrink-0">lbs</span>
        </div>
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
