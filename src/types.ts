export type Domain = 'Gym' | 'Home' | 'Hotel' | 'Outdoor';
export type Equipment =
  | 'Bodyweight'
  | 'Dumbbell'
  | 'Kettlebell'
  | 'Sandbag'
  | 'Weighted Backpack'
  | 'Machine/Cable'
  | 'Barbell'
  | 'None';
export type DayStatus =
  | 'Full'
  | 'Reduced'
  | 'Chaos-absorption'
  | 'Rest-on-signal';
export type Cause = 'Work' | 'Sleep' | 'Travel' | 'Signal' | 'Other';
export type Category =
  | 'Fast Tempo'
  | 'Slow Tempo'
  | 'Skills'
  | 'Guardian'
  | 'Benchmark'
  | 'Rest/Chaos'
  | 'General';
export type Unit =
  | 'seconds'
  | 'lbs'
  | 'reps_total'
  | 'reps'
  | 'reps_per_leg'
  | 'none';

export type EntrySource = 'local' | 'notion';

export interface ExerciseSet {
  id?: number;
  clientId: string;
  syncedAt: number;       // 0 = pending sync, timestamp = synced
  notionPageId?: string;
  source?: EntrySource;   // 'local' = logged in app, 'notion' = imported from history

  date: string;           // YYYY-MM-DD
  week?: number;
  domain?: Domain;        // optional: historical rows may not have this
  equipment?: Equipment;  // optional: historical rows may not have this
  dayStatus?: DayStatus;  // optional: historical rows may not have this
  cause?: Cause;
  fatigue?: number;       // 1–5

  exercise: string;
  category: Category;
  set?: number;
  value?: number;
  unit?: Unit;
  detail?: string;        // raw Notion Detail field, e.g. "2x8" — historical rows only
  notes?: string;
}

export interface CachedExercise {
  id?: number;
  name: string;
}

export interface Meta {
  key: string;
  value: string;
}

export interface ExerciseAlias {
  id?: number;
  alias: string;      // alternate name, e.g. "BSS" or "Dips"
  canonical: string;  // preferred name, e.g. "Bulgarian Split Squat" or "Tricep Dips"
}

export type InboxType = 'Thought' | 'Link' | 'Quote';

export interface InboxEntry {
  id?: number;
  clientId: string;
  syncedAt: number;       // 0 = pending sync
  notionPageId?: string;
  type: InboxType;
  content: string;
  url?: string;
  date: string;           // YYYY-MM-DD
  week: number;
  createdAt: number;      // Date.now()
}
