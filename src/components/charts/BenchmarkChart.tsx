import type { BenchmarkSeries } from '../../hooks/useDashboardData';

interface Props {
  series: BenchmarkSeries;
  height?: number;
}

const UNIT_LABELS: Record<string, string> = {
  seconds: 's',
  lbs: 'lbs',
  reps_total: 'reps',
  reps: 'reps',
  reps_per_leg: 'reps/leg',
  none: '',
};

export default function BenchmarkChart({ series, height = 120 }: Props) {
  const { exercise, unit, points } = series;
  if (points.length < 2) return null;

  const W = 300;
  const H = height;
  const PAD = { top: 12, right: 16, bottom: 24, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const values = points.map((p) => p.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const minW = points[0].week;
  const maxW = points[points.length - 1].week;
  const weekRange = maxW - minW || 1;

  const toX = (wk: number) => PAD.left + ((wk - minW) / weekRange) * innerW;
  const toY = (v: number) => PAD.top + innerH - ((v - minV) / range) * innerH;

  const polyline = points.map((p) => `${toX(p.week)},${toY(p.value)}`).join(' ');

  // y-axis ticks: min, mid, max
  const ticks = [minV, (minV + maxV) / 2, maxV];

  // x-axis: first and last week labels
  const xLabels = [points[0], points[points.length - 1]];

  const unitLabel = UNIT_LABELS[unit] ?? unit;

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <div className="text-xs text-gray-300 font-medium mb-1 truncate">{exercise}</div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: height }}
      >
        {/* Grid lines */}
        {ticks.map((v) => (
          <line
            key={v}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={toY(v)}
            y2={toY(v)}
            stroke="#374151"
            strokeDasharray="3,3"
          />
        ))}

        {/* Y-axis labels */}
        {ticks.map((v, i) => (
          <text
            key={i}
            x={PAD.left - 4}
            y={toY(v) + 4}
            textAnchor="end"
            fill="#6b7280"
            fontSize={9}
          >
            {Math.round(v)}{i === 2 && unitLabel ? unitLabel : ''}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((p) => (
          <text
            key={p.week}
            x={toX(p.week)}
            y={H - 4}
            textAnchor="middle"
            fill="#6b7280"
            fontSize={9}
          >
            W{p.week}
          </text>
        ))}

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {points.map((p) => (
          <circle
            key={`${p.week}-${p.value}`}
            cx={toX(p.week)}
            cy={toY(p.value)}
            r={2.5}
            fill="#f59e0b"
          >
            <title>{`W${p.week} · ${p.date}: ${p.value}${unitLabel}`}</title>
          </circle>
        ))}

        {/* Latest value callout */}
        <text
          x={toX(points[points.length - 1].week) + 5}
          y={toY(points[points.length - 1].value) + 4}
          fill="#fbbf24"
          fontSize={9}
          fontWeight="bold"
        >
          {points[points.length - 1].value}{unitLabel}
        </text>
      </svg>
    </div>
  );
}
