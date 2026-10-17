import type { Cause, DayStatus, Domain } from '../types';

export interface SessionValues {
  date: string;
  week: string;
  domain?: Domain;
  dayStatus?: DayStatus;
  cause?: Cause;
}

interface Props {
  values: SessionValues;
  onChange: (patch: Partial<SessionValues>) => void;
}

const DOMAINS: Domain[] = ['Gym', 'Home', 'Hotel', 'Outdoor'];
const DAY_STATUSES: DayStatus[] = ['Full', 'Reduced', 'Chaos-absorption', 'Rest-on-signal'];
const CAUSES: Cause[] = ['Work', 'Sleep', 'Travel', 'Signal', 'Other'];

const inputCls =
  'bg-gray-800 border border-gray-700 rounded-lg px-3 h-11 text-base text-gray-100 focus:outline-none focus:border-blue-500';
const selectCls =
  'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 h-11 text-sm text-gray-100 focus:outline-none focus:border-blue-500';

export default function SessionHeader({ values, onChange }: Props) {
  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-3 space-y-2">
      {/* Row 1: Date + Week */}
      <div className="flex gap-3">
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

      {/* Row 2: Domain + Day Status */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Domain</label>
          <select
            value={values.domain ?? ''}
            onChange={(e) => onChange({ domain: (e.target.value as Domain) || undefined })}
            className={selectCls}
          >
            <option value="">—</option>
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">Day Status</label>
          <select
            value={values.dayStatus ?? ''}
            onChange={(e) => {
              const ds = (e.target.value as DayStatus) || undefined;
              // clear cause when switching back to Full
              onChange({ dayStatus: ds, cause: ds && ds !== 'Full' ? values.cause : undefined });
            }}
            className={selectCls}
          >
            <option value="">—</option>
            {DAY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Row 3: Cause — only when day is not Full */}
      {values.dayStatus && values.dayStatus !== 'Full' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Cause</label>
          <select
            value={values.cause ?? ''}
            onChange={(e) => onChange({ cause: (e.target.value as Cause) || undefined })}
            className={selectCls}
          >
            <option value="">—</option>
            {CAUSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
