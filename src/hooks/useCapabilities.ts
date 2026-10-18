import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import type { ExerciseSet } from '../types';
import {
  CAPABILITIES,
  NEGATIVE_SIGNAL_KEYWORDS,
  ROLLING_WINDOW_WEEKS,
  FAST_TEMPO_PULLING_KEYWORDS,
  type Capability,
  type ExerciseMatcher,
  type CategoryMatcher,
} from '../config/capabilityConfig';

export type CapabilityStatus =
  | 'demonstrated'
  | 'building'
  | 'confirmed-transfer'
  | 'flagged'
  | 'untested';

export interface CapabilityResult {
  capability: Capability;
  status: CapabilityStatus;
  lastCleanDate?: string;
  flagDetail?: string;
  flagSet?: ExerciseSet;   // the specific set that triggered the flag
  transferDetail?: string;
  demoSets: ExerciseSet[]; // all demonstrated_by sets in the window (for expanded view)
  buildSets: ExerciseSet[]; // all built_by sets in the window (for expanded view)
}

function isCategoryMatcher(m: ExerciseMatcher): m is CategoryMatcher {
  return 'category' in m;
}

function matchesMatcher(set: ExerciseSet, matcher: ExerciseMatcher): boolean {
  if (isCategoryMatcher(matcher)) {
    if (set.category !== matcher.category) return false;
    if (matcher.nameContains) {
      return set.exercise.toLowerCase().includes(matcher.nameContains.toLowerCase());
    }
    return true;
  }
  return set.exercise.toLowerCase().includes(matcher.nameContains.toLowerCase());
}

function isPullingFastTempo(set: ExerciseSet): boolean {
  if (set.category !== 'Fast Tempo') return false;
  const name = set.exercise.toLowerCase();
  return (
    FAST_TEMPO_PULLING_KEYWORDS.some((kw) => name.includes(kw)) ||
    (name.includes('pull') && !name.includes('pulldown'))
  );
}

function hasNegativeKeyword(set: ExerciseSet): string | null {
  const text = ((set.notes ?? '') + ' ' + (set.detail ?? '')).toLowerCase();
  return NEGATIVE_SIGNAL_KEYWORDS.find((kw) => text.includes(kw)) ?? null;
}

const EXEMPT_DAY_STATUS = new Set<string>(['Chaos-absorption', 'Rest-on-signal']);

export function computeStatus(
  capability: Capability,
  windowSets: ExerciseSet[],
  windowStartDate: string,
): CapabilityResult {
  const demoSets: ExerciseSet[] = [];
  const buildSets: ExerciseSet[] = [];

  for (const s of windowSets) {
    if (capability.demonstratedBy.some((m) => matchesMatcher(s, m))) {
      demoSets.push(s);
    } else if (capability.fastTempoFallback && isPullingFastTempo(s)) {
      demoSets.push(s);
    } else if (capability.builtBy.some((m) => matchesMatcher(s, m))) {
      buildSets.push(s);
    }
  }

  // Check for keyword negative signals on demo sets
  for (const s of demoSets) {
    const kw = hasNegativeKeyword(s);
    if (kw) {
      return {
        capability,
        status: 'flagged',
        flagDetail: `${s.exercise} showed "${kw}" signal on ${s.date}.`,
        flagSet: s,
        demoSets,
        buildSets,
      };
    }
  }

  // Disappearance stall: present in first half (days 1-42), absent in second half (days 43-84),
  // with no exempt day status in the second half.
  if (demoSets.length > 0) {
    const windowStartMs = new Date(windowStartDate + 'T12:00:00').getTime();
    const midPointMs = windowStartMs + 42 * 24 * 60 * 60 * 1000;

    const firstHalf = demoSets.filter(
      (s) => new Date(s.date + 'T12:00:00').getTime() < midPointMs,
    );
    const secondHalf = demoSets.filter(
      (s) => new Date(s.date + 'T12:00:00').getTime() >= midPointMs,
    );

    if (firstHalf.length > 0 && secondHalf.length === 0) {
      const secondHalfExempt = windowSets.some(
        (s) =>
          new Date(s.date + 'T12:00:00').getTime() >= midPointMs &&
          s.dayStatus != null &&
          EXEMPT_DAY_STATUS.has(s.dayStatus),
      );
      if (!secondHalfExempt) {
        const lastSet = [...firstHalf].sort((a, b) => b.date.localeCompare(a.date))[0];
        return {
          capability,
          status: 'flagged',
          flagDetail: `${lastSet.exercise} last logged ${lastSet.date} — absent from the last 6 weeks.`,
          flagSet: lastSet,
          demoSets,
          buildSets,
        };
      }
    }
  }

  // Positive status
  const sortedDemo = [...demoSets].sort((a, b) => b.date.localeCompare(a.date));
  const sortedBuild = [...buildSets].sort((a, b) => b.date.localeCompare(a.date));

  if (sortedDemo.length > 0 && sortedBuild.length > 0) {
    return {
      capability,
      status: 'confirmed-transfer',
      lastCleanDate: sortedDemo[0].date,
      transferDetail: `${sortedBuild[0].exercise} → ${sortedDemo[0].exercise}, transfer confirmed.`,
      demoSets,
      buildSets,
    };
  }

  if (sortedDemo.length > 0) {
    return {
      capability,
      status: 'demonstrated',
      lastCleanDate: sortedDemo[0].date,
      demoSets,
      buildSets,
    };
  }

  if (sortedBuild.length > 0) {
    return { capability, status: 'building', demoSets, buildSets };
  }

  return { capability, status: 'untested', demoSets: [], buildSets: [] };
}

export function useCapabilities(): CapabilityResult[] {
  const result = useLiveQuery(async () => {
    const windowStartDate = new Date(Date.now() - ROLLING_WINDOW_WEEKS * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [sets, aliasRows] = await Promise.all([
      db.sets.where('date').aboveOrEqual(windowStartDate).toArray(),
      db.exerciseAliases.toArray(),
    ]);

    const aliasMap = new Map(aliasRows.map((a) => [a.alias.toLowerCase(), a.canonical]));
    const resolve = (name: string) => aliasMap.get(name.toLowerCase()) ?? name;

    const resolved = sets.map((s) => ({ ...s, exercise: resolve(s.exercise) }));

    return CAPABILITIES.map((cap) => computeStatus(cap, resolved, windowStartDate));
  }, []);

  return result ?? CAPABILITIES.map((cap) => ({
    capability: cap,
    status: 'untested' as const,
    demoSets: [],
    buildSets: [],
  }));
}
