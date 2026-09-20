export type Domain = 'Gym' | 'Home' | 'Hotel' | 'Outdoor';
export type Equipment =
  | 'Bodyweight'
  | 'Dumbbell/KB'
  | 'Machine/Cable'
  | 'Barbell'
  | 'Sandbag/Improvised'
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

export interface ExerciseSet {
  id?: number;
  clientId: string;
  syncedAt: number;     // 0 = pending sync, timestamp = synced
  notionPageId?: string;

  date: string;         // YYYY-MM-DD
  week?: number;
  domain: Domain;
  equipment: Equipment;
  dayStatus: DayStatus;
  cause?: Cause;
  fatigue?: number;     // 1–5

  exercise: string;
  category: Category;
  set?: number;
  value?: number;
  unit?: Unit;
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
