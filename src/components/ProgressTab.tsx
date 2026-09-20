import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { useExerciseAliases } from '../hooks/useExerciseAliases';
import { mapExerciseToMuscles } from '../hooks/useBodyMap';
import type { Muscle } from '../hooks/useBodyMap';
import Autocomplete from './Autocomplete';

const PROGRAM_START_MS = new Date('2025-06-23T00:00:00').getTime();

function getWeek(date: string, week?: number): number {
  if (week != null) return week;
  const d = new Date(date + 'T12:00:00').getTime();
  const days = Math.round((d - PROGRAM_START_MS) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

const UNIT_SHORT: Record<string, string> = {
  seconds: 's', lbs: 'lbs', reps_total: 'reps', reps: 'reps', reps_per_leg: 'r/leg', none: '',
};

type Category = 'All' | 'Push' | 'Pull' | 'Legs' | 'Core' | 'Skills';

const PUSH_MUSCLES: Muscle[] = ['Chest', 'Triceps'];
const PULL_MUSCLES: Muscle[] = ['Lats', 'Upper Back', 'Biceps', 'Rear Delts', 'Traps'];
const LEG_MUSCLES:  Muscle[] = ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Hip Flexors', 'Lower Back'];
const CORE_MUSCLES: Muscle[] = ['Core'];
const SKILL_MUSCLES: Muscle[] = ['Shoulders'];

function classifyMuscles(muscles: Muscle[]): Category {
  if (muscles.some((m) => LEG_MUSCLES.includes(m))) return 'Legs';
  if (muscles.some((m) => SKILL_MUSCLES.includes(m)) && muscles.some((m) => CORE_MUSCLES.includes(m))) return 'Skills';
  if (muscles.some((m) => PUSH_MUSCLES.includes(m)) && !muscles.some((m) => PULL_MUSCLES.includes(m))) return 'Push';
  if (muscles.some((m) => PULL_MUSCLES.includes(m)) && !muscles.some((m) => PUSH_MUSCLES.includes(m))) return 'Pull';
  if (muscles.some((m) => CORE_MUSCLES.includes(m))) return 'Core';
  return 'All';
}

interface WeekPoint { maxValue: number | null; count: number; unit?: string; }

interface ExerciseProgress {
  canonical: string;
  originalNames: string[];
  totalSets: number;
  weeksActive: number;
  weekData: Map<number, WeekPoint>;
  hasValues: boolean;
  unit?: string;
  category: Category;
}

export default function ProgressTab() {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [catFilter, setCatFilter] = useState<Category>('All');
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
      if (!map.has(canonical)) map.set(canonical, { originalNames: new Set(), totalSets: 0, weekData: new Map() });
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
      .map(([canonical, d]) => {
        const muscles = mapExerciseToMuscles(canonical);
        return {
          canonical,
          originalNames: Array.from(d.originalNames).filter((n) => n !== canonical),
          totalSets: d.totalSets,
          weeksActive: d.weekData.size,
          weekData: d.weekData,
          hasValues: Array.from(d.weekData.values()).some((w) => w.maxValue != null),
          unit: Array.from(d.weekData.values()).find((w) => w.unit)?.unit,
          category: classifyMuscles(muscles),
        };
      })
      .sort((a, b) => b.totalSets - a.totalSets);
  }, [allSets, aliases]);

  const allNames = useMemo(() => exercises.map((e) => e.canonical), [exercises]);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      const matchesCat = catFilter === 'All' || e.category === catFilter;
      const matchesFilter = !filter || e.canonical.toLowerCase().includes(filter.toLowerCase()) ||
        e.originalNames.some((n) => n.toLowerCase().includes(filter.toLowerCase()));
      return matchesCat && matchesFilter;
    });
  }, [exercises, catFilter, filter]);

  const selectedEx = selected ? exercises.find((e) => e.canonical === selected) ?? null : null;

  const CATEGORIES: Category[] = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Skills'];

  async function handleAddAlias() {
    const a = aliasInput.trim(), c = canonicalInput.trim();
    if (!a || !c || a.toLowerCase() === c.toLowerCase()) return;
    await addAlias(a, c);
    setAliasInput(''); setCanonicalInput('');
  }

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCatFilter(cat); setSelected(null); }}
            className={`flex-shrink-0 px-3 h-7 rounded-full text-xs font-medium transition-colors ${
              catFilter === cat ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Exercise picker */}
      {selectedEx ? (
        /* Chart view */
        <div>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white mb-3 transition-colors"
          >
            ← All exercises
          </button>
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="text-sm font-semibold text-gray-100 mb-0.5">{selectedEx.canonical}</div>
            {selectedEx.originalNames.length > 0 && (
              <div className="text-xs text-gray-600 mb-3">also: {selectedEx.originalNames.join(', ')}</div>
            )}
            <div className="flex gap-3 mb-3">
              <span className="text-xs text-gray-500">{selectedEx.totalSets} sets total</span>
              <span className="text-xs text-gray-600">{selectedEx.weeksActive} weeks</span>
            </div>
            <ExerciseChart ex={selectedEx} />
          </div>
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search exercises…"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 h-11 text-base text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />

          {filtered.length === 0 ? (
            <p className="text-xs text-gray-600 py-4 text-center">No exercises found.</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((ex) => {
                const entries = Array.from(ex.weekData.entries()).sort((a, b) => a[0] - b[0]);
                const hasValues = ex.hasValues;
                let trendEl: React.ReactNode = null;
                if (hasValues && entries.length >= 2) {
                  const pts = entries.filter(([, d]) => d.maxValue != null);
                  if (pts.length >= 2) {
                    const first = pts[0][1].maxValue!;
                    const last = pts[pts.length - 1][1].maxValue!;
                    const pct = first !== 0 ? Math.round(((last - first) / first) * 100) : null;
                    if (pct != null && pct !== 0) {
                      trendEl = (
                        <span className={`text-xs font-medium ${pct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pct > 0 ? '+' : ''}{pct}%
                        </span>
                      );
                    }
                  }
                }
                return (
                  <button
                    key={ex.canonical}
                    onClick={() => setSelected(ex.canonical)}
                    className="w-full text-left bg-gray-900 hover:bg-gray-800 active:bg-gray-700 rounded-lg px-3 py-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200 font-medium flex-1 truncate">{ex.canonical}</span>
                      {trendEl}
                      <span className="text-xs text-gray-600 flex-shrink-0">{ex.totalSets}×</span>
                      <span className="text-gray-700 text-xs">›</span>
                    </div>
                    {ex.originalNames.length > 0 && (
                      <div className="text-xs text-gray-600 mt-0.5 truncate">also: {ex.originalNames.join(', ')}</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Aliases */}
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
            <p className="text-xs text-gray-600">Mark two names as the same exercise — merged in charts and body map.</p>
            {aliases.length > 0 && (
              <div className="space-y-1">
                {aliases.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-400 truncate flex-1">
                      <span className="text-amber-400">{a.alias}</span>
                      <span className="text-gray-600 mx-2">→</span>
                      <span className="text-gray-300">{a.canonical}</span>
                    </span>
                    <button onClick={() => a.id != null && void removeAlias(a.id)} className="text-gray-600 hover:text-red-400 text-lg leading-none ml-3 flex-shrink-0">×</button>
                  </div>
                ))}
              </div>
            )}
            <Autocomplete value={aliasInput} onChange={setAliasInput} options={allNames} placeholder="Alternate name (e.g. BSS, Dips)" />
            <div className="flex items-center gap-2"><div className="h-px flex-1 bg-gray-800" /><span className="text-xs text-gray-600">means the same as</span><div className="h-px flex-1 bg-gray-800" /></div>
            <Autocomplete value={canonicalInput} onChange={setCanonicalInput} options={allNames} placeholder="Canonical name (e.g. Bulgarian Split Squat)" />
            <button
              onClick={() => void handleAddAlias()}
              disabled={!aliasInput.trim() || !canonicalInput.trim() || aliasInput.trim().toLowerCase() === canonicalInput.trim().toLowerCase()}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl text-sm font-medium text-white transition-colors"
            >
              Save alias
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chart ──────────────────────────────────────────────────────────────────────

function ExerciseChart({ ex }: { ex: ExerciseProgress }) {
  const entries = Array.from(ex.weekData.entries()).sort((a, b) => a[0] - b[0]);
  if (entries.length === 0) return null;

  const W = 280, H = 100;
  const PAD = { top: 12, right: 14, bottom: 24, left: 34 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  if (ex.hasValues) {
    const points = entries.filter(([, d]) => d.maxValue != null).map(([wk, d]) => ({ wk, v: d.maxValue! }));
    const unitLabel = UNIT_SHORT[ex.unit ?? ''] ?? (ex.unit ?? '');

    if (points.length === 1) {
      return <p className="text-xs text-gray-500 py-2">Only 1 data point: {points[0].v}{unitLabel} (week {points[0].wk}). Keep logging to see a trend.</p>;
    }

    const minWk = points[0].wk, maxWk = points[points.length - 1].wk;
    const wkRange = maxWk - minWk || 1;
    const values = points.map((p) => p.v);
    const minV = Math.min(...values), maxV = Math.max(...values);
    const vRange = maxV - minV || 1;
    const toX = (wk: number) => PAD.left + ((wk - minWk) / wkRange) * innerW;
    const toY = (v: number) => PAD.top + innerH - ((v - minV) / vRange) * innerH;
    const polyline = points.map((p) => `${toX(p.wk)},${toY(p.v)}`).join(' ');
    const ticks = [minV, (minV + maxV) / 2, maxV];
    const trend = points[points.length - 1].v - points[0].v;
    const trendPct = points[0].v !== 0 ? Math.round((trend / points[0].v) * 100) : null;

    return (
      <div>
        <div className="flex items-center gap-3 mb-2">
          {trendPct != null && trendPct !== 0 && (
            <span className={`text-sm font-semibold ${trendPct > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trendPct > 0 ? '+' : ''}{trendPct}% overall
            </span>
          )}
          <span className="text-xs text-amber-400 ml-auto">Best: {Math.max(...values)}{unitLabel}</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={PAD.left} x2={W - PAD.right} y1={toY(v)} y2={toY(v)} stroke="#1f2937" />
              <text x={PAD.left - 3} y={toY(v) + 4} textAnchor="end" fill="#4b5563" fontSize={8}>{Math.round(v)}{i === 2 ? unitLabel : ''}</text>
            </g>
          ))}
          <text x={toX(points[0].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>W{points[0].wk}</text>
          <text x={toX(points[points.length - 1].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>W{points[points.length - 1].wk}</text>
          <polyline points={polyline} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p) => (
            <circle key={p.wk} cx={toX(p.wk)} cy={toY(p.v)} r={2.5} fill="#f59e0b">
              <title>W{p.wk}: {p.v}{unitLabel}</title>
            </circle>
          ))}
        </svg>
      </div>
    );
  }

  // Volume bar chart
  const bars = entries.map(([wk, d]) => ({ wk, count: d.count }));
  const maxCount = Math.max(...bars.map((b) => b.count));
  const minWk = bars[0].wk, maxWk = bars[bars.length - 1].wk;
  const wkRange = maxWk - minWk || 1;
  const barW = Math.max(2, Math.min(8, innerW / bars.length - 2));
  const toX = (wk: number) => PAD.left + ((wk - minWk) / wkRange) * innerW;
  const toBarH = (c: number) => (c / maxCount) * innerH;

  return (
    <div>
      <p className="text-xs text-gray-600 mb-2">Sets per week (no numeric value recorded)</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        <text x={toX(bars[0].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>W{bars[0].wk}</text>
        <text x={toX(bars[bars.length - 1].wk)} y={H - 4} textAnchor="middle" fill="#4b5563" fontSize={8}>W{bars[bars.length - 1].wk}</text>
        {bars.map((b) => {
          const bh = toBarH(b.count);
          return <rect key={b.wk} x={toX(b.wk) - barW / 2} y={PAD.top + innerH - bh} width={barW} height={bh} fill="#4b5563" rx={1}><title>W{b.wk}: {b.count} sets</title></rect>;
        })}
      </svg>
    </div>
  );
}
