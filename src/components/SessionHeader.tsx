export interface SessionValues {
  date: string;
  week: string;
}

interface Props {
  values: SessionValues;
  onChange: (patch: Partial<SessionValues>) => void;
}

const inputCls =
  'bg-gray-800 border border-gray-700 rounded-lg px-3 h-11 text-base text-gray-100 focus:outline-none focus:border-blue-500';

export default function SessionHeader({ values, onChange }: Props) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex gap-3">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Date</label>
        <input
          type="date"
          value={values.date}
          onChange={(e) => onChange({ date: e.target.value })}
          className={`w-full ${inputCls}`}
        />
      </div>
      <div className="w-24 flex-shrink-0">
        <label className="block text-xs text-gray-500 mb-1">Week</label>
        <input
          type="number"
          value={values.week}
          onChange={(e) => onChange({ week: e.target.value })}
          placeholder="—"
          min="1"
          max="100"
          inputMode="numeric"
          className={`w-full text-center ${inputCls}`}
        />
      </div>
    </div>
  );
}
