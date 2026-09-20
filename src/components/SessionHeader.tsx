import type { Cause, DayStatus, Domain, Equipment } from '../types';

export interface SessionValues {
  date: string;
  week: string;
  domain: Domain;
  equipment: Equipment;
  dayStatus: DayStatus;
  cause: Cause | '';
  fatigue: string;
}

interface Props {
  values: SessionValues;
  onChange: (patch: Partial<SessionValues>) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const DOMAINS: Domain[] = ['Gym', 'Home', 'Hotel', 'Outdoor'];
const EQUIPMENTS: Equipment[] = [
  'Bodyweight', 'Dumbbell/KB', 'Machine/Cable', 'Barbell', 'Sandbag/Improvised', 'None',
];
const DAY_STATUSES: DayStatus[] = ['Full', 'Reduced', 'Chaos-absorption', 'Rest-on-signal'];
const CAUSES: Cause[] = ['Work', 'Sleep', 'Travel', 'Signal', 'Other'];

const STATUS_LABEL: Record<DayStatus, string> = {
  Full: 'Full',
  Reduced: 'Reduced',
  'Chaos-absorption': 'Chaos',
  'Rest-on-signal': 'Rest',
};

const selectCls =
  'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

const inputCls =
  'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

export default function SessionHeader({ values, onChange, collapsed, onToggle }: Props) {
  return (
    <div className="bg-gray-900 border-b border-gray-800">
      {/* Collapsed summary row — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-gray-400">{values.date}</span>
          <span className="text-gray-700">·</span>
          <span className="text-gray-200">{values.domain}</span>
          <span className="text-gray-700">·</span>
          <span className="text-gray-400">{values.equipment}</span>
          {values.week && (
            <>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500">Wk {values.week}</span>
            </>
          )}
          {values.dayStatus !== 'Full' && (
            <span className="text-yellow-500 text-xs ml-1">{values.dayStatus}</span>
          )}
          {values.fatigue && (
            <span className="text-gray-500 text-xs">fatigue {values.fatigue}</span>
          )}
        </div>
        <span className="text-gray-600 text-xs ml-2 flex-shrink-0">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Expanded form */}
      {!collapsed && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={values.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Week</label>
            <input
              type="number"
              value={values.week}
              onChange={(e) => onChange({ week: e.target.value })}
              placeholder="—"
              min="1"
              max="100"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Domain</label>
            <select
              value={values.domain}
              onChange={(e) => onChange({ domain: e.target.value as Domain })}
              className={selectCls}
            >
              {DOMAINS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Equipment</label>
            <select
              value={values.equipment}
              onChange={(e) => onChange({ equipment: e.target.value as Equipment })}
              className={selectCls}
            >
              {EQUIPMENTS.map((eq) => (
                <option key={eq}>{eq}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Day Status</label>
            <div className="flex gap-2">
              {DAY_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() =>
                    onChange({ dayStatus: s, ...(s === 'Full' && { cause: '' }) })
                  }
                  className={`flex-1 py-1.5 rounded text-xs transition-colors ${
                    values.dayStatus === s
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {values.dayStatus !== 'Full' && (
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Cause</label>
              <div className="flex gap-2 flex-wrap">
                {CAUSES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ cause: values.cause === c ? '' : c })}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      values.cause === c
                        ? 'bg-blue-700 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Fatigue (optional)</label>
            <div className="flex gap-2 items-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    onChange({ fatigue: values.fatigue === String(n) ? '' : String(n) })
                  }
                  className={`w-9 h-9 rounded text-sm transition-colors ${
                    values.fatigue === String(n)
                      ? 'bg-blue-700 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {n}
                </button>
              ))}
              {values.fatigue && (
                <button
                  type="button"
                  onClick={() => onChange({ fatigue: '' })}
                  className="text-xs text-gray-600 hover:text-gray-400 ml-1"
                >
                  clear
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
