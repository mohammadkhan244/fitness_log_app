import type { Category } from '../types';

export type NameMatcher = { nameContains: string };
export type CategoryMatcher = { nameContains?: string; category: Category };
export type ExerciseMatcher = NameMatcher | CategoryMatcher;

export interface Capability {
  id: string;
  name: string;
  demonstratedBy: ExerciseMatcher[];
  builtBy: ExerciseMatcher[];
  /** When true, any Fast Tempo set whose name matches FAST_TEMPO_PULLING_HEURISTIC also counts as demonstrated_by. */
  fastTempoFallback?: boolean;
  basis: string;
}

export const NEGATIVE_SIGNAL_KEYWORDS: string[] = [
  'pain', 'hurt', 'ache', 'sharp', 'sore joint', 'breakdown', "couldn't", 'failed form',
];

export const ROLLING_WINDOW_WEEKS = 12;

/**
 * For fastTempoFallback: catches any Fast Tempo pulling exercise not explicitly named above.
 * 'pull' is intentionally excluded from this list and handled separately to avoid matching
 * 'Tricep Pulldowns' (a pushing movement). The hook checks: contains('pull') && !contains('pulldown').
 */
export const FAST_TEMPO_PULLING_KEYWORDS: string[] = ['row', 'chin'];

export const CAPABILITIES: Capability[] = [
  {
    id: 'wrist-extension',
    name: 'Wrist extension (handstand-loaded)',
    demonstratedBy: [
      { nameContains: 'Handstand' },
      // Catches all variants: 'Handstand', 'Handstand hold', 'Handstand wall hold',
      // 'Handstand freestanding', 'Handstand continuous hold', 'Handstand practice',
      // 'Handstand tucks', 'Handstand pushup negatives'
    ],
    builtBy: [],
    basis:
      'Handstand loading is the highest-demand wrist extension position in the log. Any clean handstand entry proves this range is available.',
  },
  {
    id: 'ankle-dorsiflexion',
    name: 'Ankle dorsiflexion (deep/single-leg squat)',
    demonstratedBy: [
      { nameContains: 'Pistol squat' },
      { nameContains: 'Single leg squat' },
      { nameContains: 'Single-leg squat' },
      { nameContains: 'Cossack squat' },
      { nameContains: 'Over-shoulder Cossack' },
      // EXCLUDED (depth not logged, cannot prove range): Back squat, Front squat,
      // Goblet squat, Bulgarian split squat, Zercher squat.
      // Add only if full-depth is confirmed.
    ],
    builtBy: [],
    basis:
      'Single-leg and Cossack-depth movements prove full dorsiflexion range under load.',
  },
  {
    id: 'pulling-tendon-capacity',
    name: 'Pulling tendon capacity (fast-tempo transfer)',
    demonstratedBy: [
      { nameContains: 'Pull-up' },                              // 'Pull-up', 'Pull-ups', 'Weighted pull-ups'
      { nameContains: 'Pullup' },                               // 'Pullups', 'Ring pullups', 'Weighted pullups'
      { nameContains: 'Lat pulldown', category: 'Fast Tempo' }, // any Lat pulldown variant logged as Fast Tempo
    ],
    fastTempoFallback: true, // also catches other Fast Tempo pulling exercises
    builtBy: [
      { nameContains: 'Lat pulldown', category: 'Slow Tempo' }, // 'Lat pulldown', 'Lat pulldowns', 'One-arm lat pulldown', etc.
    ],
    basis:
      'Rubber-band theory confirmed: slow lat pulldown builds tendon base; fast-tempo pull output confirms the transfer.',
  },
  {
    id: 'lat-handstand-capacity',
    name: 'Lat/posterior-chain capacity for handstand',
    demonstratedBy: [
      { nameContains: 'Handstand' },
    ],
    builtBy: [
      { nameContains: 'Cable row' },
      { nameContains: 'Jefferson curl' },
    ],
    basis:
      'Lats identified as current HSPU limiter. Cable rows and Jefferson curl directly feed lat/posterior-chain capacity for handstand progression.',
  },
  {
    id: 'posterior-chain-length',
    name: 'Posterior chain length',
    demonstratedBy: [
      { nameContains: 'Deadlift', category: 'Slow Tempo' }, // 'Deadlift'/'Deadlifts' logged as Slow Tempo
      { nameContains: 'Good morning' },                     // 'Good mornings', 'Good morning'
    ],
    builtBy: [
      { nameContains: 'Jefferson curl' },
    ],
    basis:
      'Jefferson curl covers the lengthened end-range; Slow Tempo deadlift demonstrates working at length under load.',
  },
];
