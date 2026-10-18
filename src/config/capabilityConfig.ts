import type { Category } from '../types';

export type NameMatcher = { nameContains: string };
export type CategoryMatcher = { nameContains?: string; category: Category };
export type ExerciseMatcher = NameMatcher | CategoryMatcher;

export interface Capability {
  id: string;
  name: string;
  demonstratedBy: ExerciseMatcher[];
  builtBy: ExerciseMatcher[];
  /** When true, any Fast Tempo set whose name matches the pulling heuristic also counts as demonstrated_by. */
  fastTempoFallback?: boolean;
  /** Custom detail line for the Building status badge (overrides default). */
  buildingNote?: string;
  /** Shown in expanded view when demonstratedBy is empty and no demo sets are logged. */
  emptyDemoNote?: string;
  /** Optional "General reference" block shown in expanded view, clearly labeled as external info. */
  referenceStandard?: string;
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
    referenceStandard:
      'Coaching and PT sources commonly cite roughly 90° of wrist extension as the threshold for safe handstand loading — most daily tasks only use the wrist to about 40°, so this range is usually built deliberately, not assumed. General reference information, not a personal measurement — the app tracks training evidence, not your actual degrees of motion.',
    basis:
      'LEARNINGS.md — no specific entry. Structural logic: handstand is the highest-demand wrist extension test in the log; any clean logged set proves this range is available under load.',
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
    referenceStandard:
      'Research on functional range-of-motion puts deep-squat ankle dorsiflexion needs at roughly 30–35°, with the pistol squat demanding more than a two-legged squat. The standard field test: kneel with your big toe 5 inches from a wall, drive your knee forward to touch it without your heel lifting — reaching it indicates adequate range. General reference information, not a personal measurement.',
    basis:
      'LEARNINGS.md — no specific entry. Structural logic: single-leg and Cossack-depth squat patterns require full dorsiflexion range; any clean logged set proves the range is available under load.',
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
      'LEARNINGS.md — "Rubber band theory confirmed in practice: slow tempo work at submaximal load builds a tendon foundation that makes fast tempo at higher loads feel manageable — observed directly with lat pulldown → fast tempo transfer."',
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
      'LEARNINGS.md — "Handstand ceiling: lats (not shoulders or pressing strength) are the current HSPU limiter — cable rows and inverted rows directly feed HSPU capacity."',
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
      'LEARNINGS.md — "Jefferson curl: a permanent program tool, not just recovery — it covers the posterior chain at an end-range lengthened position that cable rows do not; together they span the full posterior chain tension spectrum."',
  },
  {
    id: 'hspu-capacity',
    name: 'HSPU capacity',
    demonstratedBy: [
      { nameContains: 'HSPU' },                       // 'HSPU', 'Wall HSPU', 'HSPU negatives'
      { nameContains: 'Handstand pushup negatives' }, // explicit match; 'Handstand pushup negatives' ⊂ 'Handstand' catches it in caps 1 & 4 too — correct, one set is evidence for multiple capabilities
    ],
    builtBy: [
      { nameContains: 'Pike push' },   // 'Pike push-ups', 'Pike Push-ups (stair edge)', 'Pike pushup progressions', 'Single-leg pike pushups'
      { nameContains: 'Pike pushup' }, // redundant with above but explicit for no-space variants
    ],
    basis:
      'LEARNINGS.md — "Handstand ceiling: lats (not shoulders or pressing strength) are the current HSPU limiter." Pike push-up variants build the forward-lean shoulder-press strength that is the standard progression toward HSPU.',
  },
  {
    id: 'planche-strength',
    name: 'Planche strength',
    demonstratedBy: [],
    builtBy: [
      { nameContains: 'Planche lean' },
      { nameContains: 'Pseudo planche' },
    ],
    buildingNote: 'Active investment this window — no planche hold logged yet.',
    emptyDemoNote:
      'No demonstrating exercise logged yet. Add a tuck planche hold or full planche hold once achievable to confirm this capability.',
    basis:
      'LEARNINGS.md — no specific entry. Planche lean (GTG) and pseudo planche push-ups are logged progression work. demonstratedBy intentionally empty — stays at Building while builtBy work exists, never Demonstrated or Confirmed transfer until a planche hold is logged.',
  },
  {
    id: 'muscle-up-transition',
    name: 'Muscle-up transition',
    demonstratedBy: [],
    builtBy: [
      { nameContains: 'Pull-up' },
      { nameContains: 'Pullup' },
      { nameContains: 'Dip' },
    ],
    buildingNote: 'General prerequisite strength present — transition skill not yet trained.',
    emptyDemoNote:
      'No muscle-up-specific exercise logged yet. The transition (false grip, pull-to-dip pivot) is a distinct skill from general pulling/dipping strength. Add a false grip hang, muscle-up negative, or assisted muscle-up once ready.',
    basis:
      'LEARNINGS.md — no specific entry. Pull-ups and dips are genuine prerequisites for a muscle-up, but the transition itself is a distinct skill neither proves. demonstratedBy intentionally empty — add only once a muscle-up-specific exercise is logged.',
  },
];
