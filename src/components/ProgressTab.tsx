import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useExerciseAliases } from '../hooks/useExerciseAliases';
import Autocomplete from './Autocomplete';

const PROGRAM_START_MS = new Date('2025-06-23T00:00:00').getTime();

function getWeek(date: string, week?: number): number {
  if (week != null) return week;
  const d = new Date(date + 'T12:00:00').getTime();
  const days = Math.round((d - PROGRAM_START_MS) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

const UNIT_SHORT: Record<string, string> = {
  seconds: 's',
  lbs: 'lbs',
  reps_total: 'reps',
  reps: 'reps',
  reps_per_leg: 'r/leg',
  none: '',
};

interface WeekPoint {
  maxValue: number | null;
  count: number;
  unit?: string;
}

interface ExerciseProgress {
  canonical: string;
  originalNames: string[];
  totalSets: number;
  weeksActive: number;
  weekData: Map<number, WeekPoint>;
  hasValues: boolean;
  unit?: string;
}

export default function ProgressTab() {
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAliases, setShowAliases] = useState(false);
  const [aliasInput, setAliasInput] = useState('');
  const [canonicalInput, setCanonicalInput] = useState('');

  const { aliases, addAlias, removeAlias } = useExerciseAliases();
  const allSets = useLiveQuery(() => db.sets.toArray(), []) ?? [];

  const exercises: ExerciseProgress[] = useMemo(() => {
    const aliasMap = new Map(aliases.map((a) => [a.alias.toLowerCase(), a.canonical]));
    const resolve = (name: string) => aliasMap.get(name.toLowerCase()) ?? name;

    const map = new Map<string, {
      originalNames: Set<string>;
      totalSets: number;
      weekData: Map<number, WeekPoint>;
    }>();

    for (const s of allSets) {
      const canonical = resolve(s.exercise);
      if (!map.has(canonical)) {
        map.set(canonical, { originalNames: new Set(), totalSets: 0, weekData: new Map() });
      }
      const entry = map.get(canonical)!;
      entry.originalNames.add(s.exercise);
      entry.totalSets++;

      const wk = getWeek(s.date, s.week);
      const wd: WeekPoint = entry.weekData.get(wk) ?? { maxValue: null, count: 0 };
      wd.count++;
      if (s.value != null) {
        wd.maxValue = wd.maxValue == null ? s.value : Math.max(wd.maxValue, s.value);
        if (s.unit && !wd.unit) wd.unit = s.unit;
      }
      entry.weekData.set(wk, wd);
    }

    return Array.from(map.entries())
      .map(([canonical, d]) => ({
        canonical,
        originalNames: Array.from(d.originalNames).filter((n) => n !== canonical),
        totalSets: d.totalSets,
        weeksActive: d.weekData.size,
        weekData: d.weekData,
        hasValues: Array.from(d.weekData.values()).some((w) => w.maxValue != null),
        unit: Array.from(d.weekData.values()).find((w) => w.unit)?.unit,
      }))
      .sort((a, b) => b.totalSets - a.totalSets);
  }, [allSets, aliases]);

  const allNames = useMemo(() => exercises.map((e) => e.canonical), [exercises]);

  const filtered = filter
    ? exercises.filter(
        (e) =>
          e.canonical.toLowerCase().includes(filter.toLowerCase()) ||
          e.originalNames.some((n) => n.toLowerCase().includes(filter.toLowerCase())),
      )
    : exercises;

  async function handleAddAlias() {
    const a = aliasInput.trim();
    const c = canonicalInput.trim();
    if (!a || !c || a.toLowerCase() === c.toLowerCase()) return;
    await addAlias(a, c);
    setAliasInput('');
    setCanonicalInput('');
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter exercises…"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 h-11 text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />

      {exercises.length === 0 ? (
        <p className="text-xs text-gray-600 py-4 text-center">No exercises yet. Log a session or import from Notion.</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-gray-600 py-4 text-center">No exercises match "{filter}".</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((ex) => (
            <div key={ex.canonical}>
              <button
                onClick={() => setExpanded(expanded === ex.canonical ? null : ex.canonical)}
                className="w-full text-left bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-2.5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-200 font-medium truncate flex-1 mr-2">{ex.canonical}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">{ex.totalSets}×</span>
                    <span className="text-xs text-gray-600">{ex.weeksActive}w</span>
                    <span
                      className="text-gray-600 text-xs"
                      style={{ display: 'inline-block', transform: expanded === ex.canonical ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                    >
                      ▶
                    </span>
                  </div>
                </div>
                {ex.originalNames.length > 0 && (
                  <div className="text-xs text-gray-600 mt-0.5 truncate">
                    also: {ex.originalNames.join(', ')}
                  </div>
                )}
              </button>

              {expanded === ex.canonical && (
                <div className="bg-gray-900/60 rounded-b-lg px-3 pb-3 -mt-1">
                  <ExerciseChart ex={ex} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Aliases section */}
      <div className="border-t border-gray-800 pt-3">
        <button
          onClick={() => setShowAliases(!showAliases)}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <span style={{ display: 'inline-block', transform: showAliases ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>▶</span>
          Manage aliases ({aliases.length})
        </button>

        {showAliases && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-gray-600">
              Mark two exercise names as the same — they'll be merged when building charts.
            </p>

            {/* Existing aliases */}
            {aliases.length > 0 && (
              <div className="space-y-1">
                {aliases.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 truncate flex-1">
                      <span className="text-amber-400">{a.alias}</span>
                      <span className="text-gray-600 mx-2">→</span>
                      <span className="text-gray-300">{a.canonical}</span>
                    </span>
                    <button
                      onClick={() => a.id != null && void removeAlias(a.id)}
                      className="text-gray-600 hover:text-red-400 text-lg leading-none ml-3 flex-shrink-0"
                      title="Remove alias"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add form */}
            <div className="space-y-2 pt-1">
              <Autocomplete
                value={aliasInput}
                onChange={setAliasInput}
                options={allNames}
                placeholder="Alternate name (e.g. BSS, Dips)"
              />
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-800" />
                <span className="text-xs text-gray-600">means the same as</span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>
              <Autocomplete
                value={canonicalInput}
                onChange={setCanonicalInput}
                options={allNames}
                placeholder="Canonical name (e.g. Bulgarian Split Squat)"
              />
              <button
                onClick={() => void handleAddAlias()}
                disabled={
                  !aliasInput.trim() ||
                  !canonicalInput.trim() ||
                  aliasInput.trim().toLowerCase() === canonicalInput.trim().toLowerCase()
                }
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 rounded-xl text-sm font-medium text-white transition-colors"
              >
                Save alias
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inline chart ──────────────────────────────────────────────────────────────

function ExerciseChart({ ex }: { ex: ExerciseProgress }) {
  const entries = Array.from(ex.weekData.entries()).sort((a, b) => a[0] - b[0]);
  if (entries.length === 0) return null;

  const W = 280;
  const H = 90;
  const PAD = { top: 10, right: 14, bottom: 22, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (ex.hasValues) {
    const points = entries
      .filter(([, d]) => d.maxValue != null)
      .map(([wk, d]) => ({ wk, v: d.maxValue! }));

    const unitLabel = UNIT_SHORT[ex.unit ?? ''] ?? (ex.unit ?? '');

    if (points.length === 1) {
      return (
        <div className="py-3 text-xs text-gray-500">
          Only 1 data point: {points[0].v}{unitLabel} in week {points[0].wk}. Log more to see a trend.
        </div>
      );
    }

    const minWk = points[0].wk;
    const maxWk = points[points.length - 1].wk;
    const wkRange = maxWk - minWk || 1;
    const values = points.map((p) => p.v);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const vRange = maxV - minV || 1;

    const toX = (wk: number) => PAD.left + ((wk - minWk) / wkRange) * innerW;
    const toY = (v: number) => PAD.top + innerH - ((v - minV) / vRange) * innerH;
    const polyline = points.map((p) => `${toX(p.wk)},${toY(p.v)}`).join(' ');

    const ticks = [minV, (minV + maxV) / 2, maxV];

    const trend = points[points.length - 1].v - points[0].v;
    const trendPct = points[0].v !== 0 ? Math.round((trend / points[0].v) * 100) : null;

    return (
      <div>
        <div className="flex items-center gap-2 pt-2 pb-1">
          <span className="text-xs text-gray-600">W{minWk}→W{maxWk}</span>
          {trendPct != null && trendPct !== 0 && (
            <span className={`text-xs font-semibold ${trendPct > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trendPct > 0 ? '+' : ''}{trendPct}%
            </span>
          )}
          <span className="text-xs text-amber-400 ml-auto">
            Best: {Math.max(...values)}{unitLabel}
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
          {ticks.map((v) => (
            <line key={v} x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#1f2937" />
          ))}
          {[minV, maxV].map((v, i) => (
            <text key={i} x={PAD.left - 3} y={toY(v) + 4} textAnchor="end" fill="#4b5563" fontSize={8}>
              {Math.round(v)}{unitLabel}
            </text>
          ))}
          <text x={toX(points[0].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>
            W{points[0].wk}
          </text>
          <text x={toX(points[points.length - 1].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>
            W{points[points.length - 1].wk}
          </text>
          <polyline
            points={polyline}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p) => (
            <circle key={p.wk} cx={toX(p.wk)} cy={toY(p.v)} r={2} fill="#f59e0b">
              <title>W{p.wk}: {p.v}{unitLabel}</title>
            </circle>
          ))}
        </svg>
      </div>
    );
  }

  // Volume chart (no numeric values — show set count per week as bars)
  const bars = entries.map(([wk, d]) => ({ wk, count: d.count }));
  const maxCount = Math.max(...bars.map((b) => b.count));
  const minWk = bars[0].wk;
  const maxWk = bars[bars.length - 1].wk;
  const wkRange = maxWk - minWk || 1;
  const barW = Math.max(2, Math.min(8, innerW / bars.length - 2));

  const toX = (wk: number) => PAD.left + ((wk - minWk) / wkRange) * innerW;
  const toBarH = (c: number) => (c / maxCount) * innerH;

  return (
    <div>
      <div className="text-xs text-gray-600 pt-2 pb-1">
        Volume (sets/week) — no numeric value recorded
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        <text x={toX(bars[0].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>
          W{bars[0].wk}
        </text>
        <text x={toX(bars[bars.length - 1].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>
          W{bars[bars.length - 1].wk}
        </text>
        {bars.map((b) => {
          const bh = toBarH(b.count);
          const bx = toX(b.wk) - barW / 2;
          const by = PAD.top + innerH - bh;
          return (
            <rect key={b.wk} x={bx} y={by} width={barW} height={bh} fill="#4b5563" rx={1}>
              <title>W{b.wk}: {b.count} sets</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}
