import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { Category, DayStatus, Domain, ExerciseSet } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeekSummary {
  week: number;
  domainCounts: Partial<Record<Domain, number>>;
  dayStatusCounts: Partial<Record<DayStatus, number>>;
  avgFatigue: number | null;
  totalSets: number;
}

export interface BenchmarkSeries {
  exercise: string;
  unit: string;
  points: Array<{ week: number; date: string; value: number }>;
}

export interface DashboardData {
  weeks: WeekSummary[];
  benchmarks: BenchmarkSeries[];
  allExercises: string[];
  totalSets: number;
  maxWeek: number;
  loading: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardData(): DashboardData {
  const result = useLiveQuery(async () => {
    const sets = await db.sets.toArray();
    return computeDashboard(sets);
  }, []);

  if (!result) {
    return { weeks: [], benchmarks: [], allExercises: [], totalSets: 0, maxWeek: 65, loading: true };
  }
  return { ...result, loading: false };
}

// ─── Aggregation (pure) ───────────────────────────────────────────────────────

function computeDashboard(sets: ExerciseSet[]) {
  const weekMap = new Map<number, WeekSummary>();

  // Week 1 = June 23, 2025 — must match the LogScreen constant
  const PROGRAM_START_MS = new Date('2025-06-23T00:00:00').getTime();

  // derive a week number from date string if week field missing
  const getWeek = (s: ExerciseSet): number => {
    if (s.week != null) return s.week;
    const d = new Date(s.date + 'T12:00:00').getTime();
    const days = Math.round((d - PROGRAM_START_MS) / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.floor(days / 7) + 1);
  };

  for (const s of sets) {
    const wk = getWeek(s);
    if (!weekMap.has(wk)) {
      weekMap.set(wk, {
        week: wk,
        domainCounts: {},
        dayStatusCounts: {},
        avgFatigue: null,
        totalSets: 0,
      });
    }
    const w = weekMap.get(wk)!;
    w.totalSets++;

    if (s.domain) {
      w.domainCounts[s.domain] = (w.domainCounts[s.domain] ?? 0) + 1;
    }
    if (s.dayStatus) {
      w.dayStatusCounts[s.dayStatus] = (w.dayStatusCounts[s.dayStatus] ?? 0) + 1;
    }
  }

  // compute avgFatigue per week (separate pass to average properly)
  const fatigueSums = new Map<number, { sum: number; count: number }>();
  for (const s of sets) {
    if (s.fatigue == null) continue;
    const wk = getWeek(s);
    const acc = fatigueSums.get(wk) ?? { sum: 0, count: 0 };
    acc.sum += s.fatigue;
    acc.count++;
    fatigueSums.set(wk, acc);
  }
  for (const [wk, { sum, count }] of fatigueSums) {
    const w = weekMap.get(wk);
    if (w) w.avgFatigue = Math.round((sum / count) * 10) / 10;
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.week - b.week);
  const maxWeek = weeks.length > 0 ? Math.max(...weeks.map((w) => w.week)) : 65;

  // ── Benchmark series ──────────────────────────────────────────────────────
  const benchmarkCategories: Category[] = ['Benchmark'];
  const benchmarkSets = sets.filter((s) => benchmarkCategories.includes(s.category) && s.value != null);

  const seriesMap = new Map<string, Map<number, { value: number; date: string }>>();
  const unitMap = new Map<string, string>();

  for (const s of benchmarkSets) {
    if (s.value == null) continue;
    const key = s.exercise;
    if (!seriesMap.has(key)) seriesMap.set(key, new Map());
    const wk = getWeek(s);
    const existing = seriesMap.get(key)!.get(wk);
    // keep max value per week
    if (!existing || s.value > existing.value) {
      seriesMap.get(key)!.set(wk, { value: s.value, date: s.date });
    }
    if (!unitMap.has(key) && s.unit) unitMap.set(key, s.unit);
  }

  const benchmarks: BenchmarkSeries[] = Array.from(seriesMap.entries())
    .filter(([, pts]) => pts.size >= 2) // only show exercises with at least 2 data points
    .map(([exercise, ptMap]) => ({
      exercise,
      unit: unitMap.get(exercise) ?? '',
      points: Array.from(ptMap.entries())
        .map(([week, { value, date }]) => ({ week, date, value }))
        .sort((a, b) => a.week - b.week),
    }))
    .sort((a, b) => b.points.length - a.points.length); // most data first

  const allExercises = [...new Set(sets.map((s) => s.exercise))].sort();

  return {
    weeks,
    benchmarks,
    allExercises,
    totalSets: sets.length,
    maxWeek,
  };
}
