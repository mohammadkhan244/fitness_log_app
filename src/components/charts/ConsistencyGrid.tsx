import type { WeekSummary } from '../../hooks/useDashboardData';
import type { Domain } from '../../types';

interface Props {
  weeks: WeekSummary[];
  totalWeeks?: number;
}

const DOMAIN_COLORS: Record<Domain, string> = {
  Gym: '#3b82f6',       // blue
  Home: '#22c55e',      // green
  Hotel: '#a855f7',     // purple
  Outdoor: '#14b8a6',   // teal
};

const DOMAIN_ORDER: Domain[] = ['Gym', 'Home', 'Hotel', 'Outdoor'];

export default function ConsistencyGrid({ weeks, totalWeeks = 65 }: Props) {
  // Build a map from week number to summary
  const weekMap = new Map(weeks.map((w) => [w.week, w]));

  // We show weeks 1..totalWeeks in a grid
  const cells = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  // Grid: 13 columns × 5 rows = 65 weeks
  const COLS = 13;

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 flex-wrap">
        {DOMAIN_ORDER.map((d) => (
          <span key={d} className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: DOMAIN_COLORS[d] }} />
            {d}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: '#4b5563' }} />
          Mixed/unknown
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-3 h-3 rounded-sm inline-block bg-gray-800 border border-gray-700" />
          No data
        </span>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {cells.map((wk) => {
          const w = weekMap.get(wk);
          const color = w ? getDominantColor(w) : null;
          const intensity = w ? Math.min(1, w.totalSets / 20) : 0;

          return (
            <div
              key={wk}
              title={w ? buildTooltip(wk, w) : `Week ${wk}: no data`}
              className="aspect-square rounded-sm"
              style={
                w
                  ? { backgroundColor: color ?? '#4b5563', opacity: 0.3 + intensity * 0.7 }
                  : { backgroundColor: '#1f2937' }
              }
            />
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>Wk 1</span>
        <span>Wk 65</span>
      </div>
    </div>
  );
}

function getDominantColor(w: WeekSummary): string {
  let dominant: Domain | null = null;
  let max = 0;
  for (const d of DOMAIN_ORDER) {
    const count = w.domainCounts[d] ?? 0;
    if (count > max) {
      max = count;
      dominant = d;
    }
  }
  return dominant ? DOMAIN_COLORS[dominant] : '#6b7280';
}

function buildTooltip(wk: number, w: WeekSummary): string {
  const parts = [`Week ${wk} · ${w.totalSets} sets`];
  for (const d of DOMAIN_ORDER) {
    const c = w.domainCounts[d];
    if (c) parts.push(`${d}: ${c}`);
  }
  if (w.avgFatigue != null) parts.push(`Fatigue avg: ${w.avgFatigue}`);
  return parts.join('\n');
}
