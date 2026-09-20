import type { WeekSummary } from '../../hooks/useDashboardData';
import type { DayStatus } from '../../types';

interface Props {
  weeks: WeekSummary[];
}

const STATUS_COLORS: Record<DayStatus, string> = {
  Full: '#22c55e',
  Reduced: '#eab308',
  'Chaos-absorption': '#f97316',
  'Rest-on-signal': '#6b7280',
};

export default function FatigueTrends({ weeks }: Props) {
  if (weeks.length === 0) return null;

  const recent = weeks.slice(-20); // last 20 weeks

  const W = 300;
  const H_FATIGUE = 80;
  const H_STATUS = 40;
  const PAD = { top: 10, right: 16, bottom: 20, left: 28 };
  const innerW = W - PAD.left - PAD.right;

  const minWk = recent[0].week;
  const maxWk = recent[recent.length - 1].week;
  const weekRange = maxWk - minWk || 1;

  const toX = (wk: number) => PAD.left + ((wk - minWk) / weekRange) * innerW;

  // ── Fatigue line ──────────────────────────────────────────────────────────
  const fatiguePoints = recent.filter((w) => w.avgFatigue != null);
  const fatiguePolyline = fatiguePoints
    .map((w) => {
      const y = PAD.top + H_FATIGUE - PAD.bottom - ((w.avgFatigue! - 1) / 4) * (H_FATIGUE - PAD.top - PAD.bottom);
      return `${toX(w.week)},${y}`;
    })
    .join(' ');

  // ── Day status stacked bar ────────────────────────────────────────────────
  const STATUS_ORDER: DayStatus[] = ['Full', 'Reduced', 'Chaos-absorption', 'Rest-on-signal'];
  const BAR_W = Math.max(2, innerW / recent.length - 1);

  return (
    <div className="space-y-4">
      {/* Fatigue line */}
      {fatiguePoints.length >= 2 && (
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Avg Fatigue (1–5) · last 20 weeks</div>
          <svg viewBox={`0 0 ${W} ${H_FATIGUE}`} className="w-full" style={{ maxHeight: H_FATIGUE }}>
            {[1, 3, 5].map((v) => {
              const y = PAD.top + H_FATIGUE - PAD.bottom - ((v - 1) / 4) * (H_FATIGUE - PAD.top - PAD.bottom);
              return (
                <g key={v}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#374151" strokeDasharray="3,3" />
                  <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="#6b7280" fontSize={9}>{v}</text>
                </g>
              );
            })}
            <polyline
              points={fatiguePolyline}
              fill="none"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {fatiguePoints.map((w) => {
              const y = PAD.top + H_FATIGUE - PAD.bottom - ((w.avgFatigue! - 1) / 4) * (H_FATIGUE - PAD.top - PAD.bottom);
              return (
                <circle key={w.week} cx={toX(w.week)} cy={y} r={2} fill="#ef4444">
                  <title>{`W${w.week}: fatigue ${w.avgFatigue}`}</title>
                </circle>
              );
            })}
          </svg>
        </div>
      )}

      {/* Day status stacked bars */}
      <div className="bg-gray-900 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-1">Day Status · last 20 weeks</div>
        <svg viewBox={`0 0 ${W} ${H_STATUS + PAD.top + PAD.bottom}`} className="w-full" style={{ maxHeight: H_STATUS + PAD.top + PAD.bottom }}>
          {recent.map((w) => {
            const total = STATUS_ORDER.reduce((s, k) => s + (w.dayStatusCounts[k] ?? 0), 0);
            if (total === 0) return null;
            const x = toX(w.week) - BAR_W / 2;
            let yOff = PAD.top + H_STATUS;
            return (
              <g key={w.week}>
                {STATUS_ORDER.map((status) => {
                  const count = w.dayStatusCounts[status] ?? 0;
                  if (count === 0) return null;
                  const bh = (count / total) * H_STATUS;
                  yOff -= bh;
                  return (
                    <rect
                      key={status}
                      x={x}
                      y={yOff}
                      width={BAR_W}
                      height={bh}
                      fill={STATUS_COLORS[status]}
                      opacity={0.8}
                    >
                      <title>{`W${w.week} · ${status}: ${count}`}</title>
                    </rect>
                  );
                })}
              </g>
            );
          })}
        </svg>
        <div className="flex gap-3 flex-wrap mt-1">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="flex items-center gap-1 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: STATUS_COLORS[s] }} />
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
