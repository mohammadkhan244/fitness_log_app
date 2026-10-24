import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { CAPABILITIES, ROLLING_WINDOW_WEEKS, safeExercise, type Capability } from '../config/capabilityConfig';
import { computeStatus, type CapabilityStatus, type CapabilityResult } from './useCapabilities';
import type { ExerciseSet } from '../types';

export type MechanismCase = 'today' | 'status-change' | 'fallback';

export interface TodaysMechanismResult {
  capability: Capability;
  currentResult: CapabilityResult;
  triggerCase: MechanismCase;
  todaySets?: ExerciseSet[];    // case 1
  oldStatus?: CapabilityStatus; // case 2
  changeDate?: string;          // case 2
  changeSets?: ExerciseSet[];   // case 2
  lastDate?: string;            // case 3
  lastExercise?: string;        // case 3
}

const STATUS_SEVERITY: Record<CapabilityStatus, number> = {
  flagged:             4,
  'confirmed-transfer': 3,
  demonstrated:        2,
  building:            1,
  untested:            0,
};

export function useTodaysMechanism(): TodaysMechanismResult | null | undefined {
  return useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const windowStartDate = new Date(
      Date.now() - ROLLING_WINDOW_WEEKS * 7 * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 10);
    const sevenDaysAgoDate = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString().slice(0, 10);

    const [sets, aliasRows] = await Promise.all([
      db.sets.where('date').aboveOrEqual(windowStartDate).toArray(),
      db.exerciseAliases.toArray(),
    ]);

    if (sets.length === 0) return null;

    const aliasMap = new Map(
      aliasRows
        .filter((a) => a.alias && a.canonical)
        .map((a) => [safeExercise(a.alias).toLowerCase(), a.canonical]),
    );
    const resolve = (name: string | null | undefined) => {
      const safe = safeExercise(name);
      return aliasMap.get(safe.toLowerCase()) ?? safe;
    };
    const resolved = sets
      .filter((s) => s.exercise)
      .map((s) => ({ ...s, exercise: resolve(s.exercise) }));

    // Evidence snapshots for the two-run comparison
    const pastSets = resolved.filter((s) => s.date <= sevenDaysAgoDate);

    const currentResults = CAPABILITIES.map((cap) =>
      computeStatus(cap, resolved, windowStartDate),
    );
    const pastResults = CAPABILITIES.map((cap) =>
      computeStatus(cap, pastSets, windowStartDate),
    );

    // ── Case 1: Today's training ────────────────────────────────────────────
    const case1 = currentResults
      .flatMap((result) => {
        const todayDemo = result.demoSets.filter((s) => s.date === today);
        const todayBuild = result.buildSets.filter((s) => s.date === today);
        if (todayDemo.length === 0 && todayBuild.length === 0) return [];
        return [{ result, todayDemo, todayBuild }];
      })
      .sort((a, b) => {
        const totalDiff =
          (b.todayDemo.length + b.todayBuild.length) -
          (a.todayDemo.length + a.todayBuild.length);
        if (totalDiff !== 0) return totalDiff;
        return b.todayDemo.length - a.todayDemo.length; // prefer demonstratedBy
      });

    if (case1.length > 0) {
      const { result, todayDemo, todayBuild } = case1[0];
      return {
        capability: result.capability,
        currentResult: result,
        triggerCase: 'today',
        todaySets: [...todayDemo, ...todayBuild],
      };
    }

    // ── Case 2: Status change in last 7 days ────────────────────────────────
    const case2 = currentResults
      .flatMap((cur, i) => {
        const past = pastResults[i];
        if (cur.status === past.status) return [];
        const allCurrentSets = [...cur.demoSets, ...cur.buildSets];
        const recentSets = allCurrentSets
          .filter((s) => s.date > sevenDaysAgoDate)
          .sort((a, b) => b.date.localeCompare(a.date));
        const allSorted = [...allCurrentSets].sort((a, b) => b.date.localeCompare(a.date));
        const changeDate =
          recentSets.length > 0
            ? recentSets[0].date
            : (allSorted[0]?.date ?? sevenDaysAgoDate);
        const changeSets = (recentSets.length > 0 ? recentSets : allSorted).slice(0, 3);
        return [{ result: cur, oldStatus: past.status, changeDate, changeSets }];
      })
      .sort((a, b) => {
        const dateDiff = b.changeDate.localeCompare(a.changeDate);
        if (dateDiff !== 0) return dateDiff;
        return STATUS_SEVERITY[b.result.status] - STATUS_SEVERITY[a.result.status];
      });

    if (case2.length > 0) {
      const { result, oldStatus, changeDate, changeSets } = case2[0];
      return {
        capability: result.capability,
        currentResult: result,
        triggerCase: 'status-change',
        oldStatus,
        changeDate,
        changeSets,
      };
    }

    // ── Case 3: Fallback — most recently touched capability ─────────────────
    const case3 = currentResults
      .flatMap((result) => {
        const allSets = [...result.demoSets, ...result.buildSets];
        if (allSets.length === 0) return [];
        const latest = [...allSets].sort((a, b) => b.date.localeCompare(a.date))[0];
        return [{ result, lastDate: latest.date, lastExercise: latest.exercise }];
      })
      .sort((a, b) => b.lastDate.localeCompare(a.lastDate));

    if (case3.length > 0) {
      const { result, lastDate, lastExercise } = case3[0];
      return {
        capability: result.capability,
        currentResult: result,
        triggerCase: 'fallback',
        lastDate,
        lastExercise,
      };
    }

    return null;
  }, []);
}
