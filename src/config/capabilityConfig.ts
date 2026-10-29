import type { Category } from '../types';

export type NameMatcher = { nameContains: string };
export type CategoryMatcher = { nameContains?: string; category: Category };
export type ExerciseMatcher = NameMatcher | CategoryMatcher;

/**
 * Runtime safety net: ExerciseSet.exercise is typed string but legacy Notion rows
 * can arrive as null when the Exercise title property was blank or missing.
 * Use this everywhere an exercise name is lowercased, compared, or used as a key —
 * never raw `s.exercise.toLowerCase()`. Returns '' for null / undefined.
 */
export function safeExercise(name: string | null | undefined): string {
  return name ?? '';
}

export type SourceTier = 'peer-reviewed' | 'practitioner' | 'learnings';

export interface CapabilitySource {
  tier: SourceTier;
  title: string;
  url?: string;
  caveat?: string;
  writeup: string;
}

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
  /** 2–4 sentence inline mechanism note shown on the expanded capability card. */
  science?: string;
  /** Sourced write-ups for the Science tab. Capabilities without sources have no Science tab entry. */
  sources?: CapabilitySource[];
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
    science:
      'Handstand loading asks the wrist for roughly 90° of extension, more than double the ~40° most daily tasks use. Loading deliberately in that end-range — not just stretching into it — is what trains the wrist flexors, extensors, and anterior capsule to tolerate sustained compression under bodyweight.',
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
      { nameContains: 'Pull-up', category: 'Fast Tempo' }, // 'Pull-up', 'Pull-ups', 'Weighted pull-ups' — Fast Tempo only
      { nameContains: 'Pullup',  category: 'Fast Tempo' }, // 'Pullups', 'Ring pullups', 'Weighted pullups' — Fast Tempo only
      { nameContains: 'Lat pulldown', category: 'Fast Tempo' }, // any Lat pulldown variant logged as Fast Tempo
    ],
    fastTempoFallback: true, // also catches other Fast Tempo pulling exercises
    builtBy: [
      { nameContains: 'Lat pulldown', category: 'Slow Tempo' }, // 'Lat pulldown', 'Lat pulldowns', 'One-arm lat pulldown', etc.
    ],
    science:
      'Fast tempo expresses what slow tempo built. Tendon tissue is far less elastic than muscle and adapts mainly to how long it sits under load per rep, not how fast the rep moves — which is the likely mechanism behind why fast-tempo pull-ups start to feel easier after a block of slow-tempo work.',
    sources: [
      {
        tier: 'peer-reviewed',
        title: 'Eccentric exercise tempo and patellar tendon adaptation (single-leg decline squat, 6-week protocol)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9367933',
        caveat:
          'Small study (≤18 per group), tested a decline squat, not a pulling movement, and the two tempos compared were 3s vs 6s eccentrics — not a direct "fast vs slow" test. The authors did find that longer eccentric execution time shifted where tendon thickness increased, and cite prior work suggesting slower eccentric tempo favors tendon structural/stiffness adaptation while faster eccentric tempo favors muscle strength and hypertrophy more. Treat this as the best available mechanism evidence, not a pull-up-specific finding.',
        writeup:
          "The rubber-band theory — that slow-tempo work builds a tendon foundation fast-tempo work then draws on — isn't fully proven for pull-ups specifically, but it's consistent with current tendon-adaptation research. Tendons adapt to load duration and magnitude more than to speed. A 2022 study comparing 3-second vs 6-second eccentric tempos in a single-leg decline squat found the slower tempo produced different (and in some measures larger) tendon-thickness and stiffness changes, while prior literature the authors cite associates faster eccentric tempo more with muscle-side strength and hypertrophy gains. The practical read: slow-tempo pulling work is plausibly doing more to the tendon than the muscle, which is exactly the role LEARNINGS.md assigns it — and why fast-tempo output is treated as the thing that gets expressed, not built, by that work.",
      },
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
    science:
      "A handstand needs the shoulder to reach roughly 180° of flexion overhead without the ribs or pelvis compensating for a lat that's too short to allow it. Jefferson curl and cable rows load the lat-to-thoracolumbar fascia line at a long muscle length under real resistance, which trains that range more effectively than passive stretching.",
    sources: [
      {
        tier: 'practitioner',
        title: 'Understanding shoulder flexion in handstands',
        url: 'https://handstandacademy.substack.com/p/understanding-shoulder-flexion-in',
        writeup:
          "Handstand coaching describes the overhead reach as \"shoulder opening\" — full shoulder flexion is what brings the center of mass over the hands, and someone who can't reach it is described as having \"closed shoulders.\" That source doesn't name the lats specifically as the limiter — that identification comes from LEARNINGS.md, based on Mohammad's own logged handstand-hold ceiling. The training logic — that loaded end-range work (Jefferson curl, cable rows) builds the range that handstand practice then demonstrates — follows the same rubber-band mechanism as capability 3, applied to length instead of tendon stiffness.",
      },
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
    science:
      "Good mornings load the hamstrings and spinal erectors at a long muscle length with the knees nearly straight, while the erectors brace isometrically to keep the torso rigid — a different demand than a deadlift, which lets the knees bend and shortens the hamstring's role in the lift. Building strength at that long length is what raises how far the hips can hinge before the lower back takes over.",
    sources: [
      {
        tier: 'practitioner',
        title: 'Good morning biomechanics — hip hinge range and muscle roles',
        url: 'https://dk.repfitness.com/blogs/training/good-mornings',
        writeup:
          "A good morning takes the hip hinge to roughly 15–45° of torso angle from parallel (mobility-dependent), stopping where a neutral spine can be held — \"quality beats depth.\" Through that range, the hamstrings stay lengthened and loaded (an eccentric-dominant demand on the lower), the erectors brace isometrically rather than moving, and the glutes drive the concentric finish. Because the knees stay nearly straight, the hamstrings carry more of the length-under-tension demand than in a deadlift, where knee bend takes some of that role — which is why Jefferson curl and good mornings are treated as end-range posterior-chain work a deadlift alone doesn't fully substitute for.",
      },
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
      { nameContains: 'HSPU', category: 'Overcoming Isometric' },
      // A near-lockout or sticking-point overcoming isometric logged as 'HSPU ...' is direct evidence
      // of pressing strength at the specific HSPU angle, counted only if named with 'HSPU'.
    ],
    builtBy: [
      { nameContains: 'Pike push' },   // 'Pike push-ups', 'Pike Push-ups (stair edge)', 'Pike pushup progressions', 'Single-leg pike pushups'
      { nameContains: 'Pike pushup' }, // redundant with above but explicit for no-space variants
    ],
    science:
      "LEARNINGS.md identifies lats — not shoulder-press strength — as the current ceiling on handstand push-ups. Pike push-ups rehearse the same forward-lean shoulder-flexion path as an HSPU without full inversion, training the pressing pattern while capability 4's lat-length work addresses the actual limiter.",
    sources: [
      {
        tier: 'learnings',
        title: 'Lats identified as HSPU limiter (logged training conclusion)',
        writeup:
          "This is Mohammad's own finding, not an external study: HSPU progress stalled on the lat-length/overhead-range side (capability 4), not on pressing strength. Pike push-ups are a standard gymnastics progression toward HSPU precisely because they train the same joint path (shoulder flexion, elbow extension, pressing the torso up and over the hands) in a position that doesn't yet require full handstand balance or inversion — so treating pike push-up volume as HSPU builtBy evidence, while the real ceiling gets addressed through capability 4, follows directly from that logged conclusion.",
      },
    ],
    basis:
      'LEARNINGS.md — "Handstand ceiling: lats (not shoulders or pressing strength) are the current HSPU limiter." Pike push-up variants build the forward-lean shoulder-press strength that is the standard progression toward HSPU. HSPU overcoming isometric matcher added per LEARNINGS.md entry on joint-angle-specific strength transfer — a near-lockout or sticking-point hold logged with "HSPU" in the name is evidence of pressing capacity at that specific angle.',
  },
  {
    id: 'planche-strength',
    name: 'Planche strength',
    demonstratedBy: [
      { nameContains: 'Planche', category: 'Overcoming Isometric' },
      // An overcoming isometric at planche-lean angle is direct evidence of static strength at that position —
      // the first thing that can flip this capability off "Building" before a full planche hold is achievable.
    ],
    builtBy: [
      { nameContains: 'Planche lean' },
      { nameContains: 'Pseudo planche' },
    ],
    buildingNote: 'Active investment this window — no planche hold logged yet.',
    emptyDemoNote:
      'No demonstrating exercise logged yet. Add a tuck planche hold, full planche hold, or a planche-angle overcoming isometric to confirm this capability.',
    science:
      'A planche is a straight-arm, protracted-scapula hold — structurally different from a bent-arm push, because the serratus anterior (not the triceps) has to lock the shoulder blades flat against the ribcage to keep the body from folding. Planche lean and pseudo-planche push-ups train that scapular-protraction demand at progressively higher bodyweight-percentage before a full hold is attempted.',
    sources: [
      {
        tier: 'practitioner',
        title: 'Planche progression and scapular protraction demand',
        url: 'https://bullbarfit.com/blogs/updates/the-one-thing-nobody-tells-you-about-planche-training-its-not-what-you-think',
        caveat:
          'Calisthenics-coaching source, not peer-reviewed literature — published strength research on planche-specific scapular mechanics is thin, so this is practitioner consensus rather than controlled evidence.',
        writeup:
          "Planche training literature in the calisthenics/gymnastics coaching world consistently frames the planche as a scapular-stability skill as much as a strength one: holding the shoulder blades protracted and depressed against the ribcage under a forward-shifted bodyweight load is the specific demand that separates it from a standard push-up or plank. Planche lean and pseudo-planche push-ups progressively load that same protracted-scapula position at increasing lean angle/bodyweight percentage, which is why they're treated as real builtBy evidence even with no planche hold logged yet — they train the limiting mechanism directly, just not at full demand.",
      },
    ],
    basis:
      'LEARNINGS.md — no specific entry for planche; overcoming isometric matcher added per LEARNINGS.md entry on joint-angle-specific strength transfer. Planche lean (GTG) and pseudo planche push-ups are logged progression work. An overcoming isometric at planche-lean angle provides the first demonstratedBy evidence before a full planche hold is achievable — static strength at that protraction angle is a real prerequisite.',
  },
  {
    id: 'muscle-up-transition',
    name: 'Muscle-up transition',
    demonstratedBy: [
      { nameContains: 'False grip', category: 'Overcoming Isometric' },
      // A false-grip overcoming isometric trains the specific wrist-position skill under near-max load —
      // direct evidence of the transition demand, unlike general pull-up/dip volume.
      { nameContains: 'Transition', category: 'Overcoming Isometric' },
      // An overcoming isometric in the transition position (pull-to-dip pivot) is the most direct
      // possible evidence of static strength at the exact sticking point.
    ],
    builtBy: [
      { nameContains: 'Pull-up' },
      { nameContains: 'Pullup' },
      { nameContains: 'Dip' },
    ],
    buildingNote: 'General prerequisite strength present — transition skill not yet trained.',
    emptyDemoNote:
      'No muscle-up-specific exercise logged yet. The transition (false grip, pull-to-dip pivot) is a distinct skill from general pulling/dipping strength. Add a false grip hang, muscle-up negative, or assisted muscle-up once ready.',
    science:
      "The false grip shortens the effective lever arm during the pull-to-dip pivot, cutting the distance the arms have to travel to flip over the bar or rings — which is why raw pull-up and dip strength doesn't automatically transfer. It's a grip/wrist-position skill layered on top of strength, not a strength deficit by itself.",
    sources: [
      {
        tier: 'practitioner',
        title: 'The false grip on the muscle-up',
        url: 'https://boxlifemagazine.com/false-grip-on-the-muscle-up-to-use-or-not-to-use/',
        writeup:
          "The false grip — knuckles over the bar/rings, thumbs on top, wrist flexed — shortens the lever by decreasing the distance the arms travel during the transition, and lets the forearms carry load that would otherwise fall on the shoulders. Holding that wrist position under load is a distinct trained skill from general pulling or dipping strength, which is exactly why this capability stays at \"Building\" — general prerequisite strength present, transition skill not yet trained — until a muscle-up-specific exercise (false grip hang, muscle-up negative, assisted muscle-up) is actually logged.",
      },
    ],
    basis:
      'LEARNINGS.md — no specific entry for muscle-up; overcoming isometric matchers added per LEARNINGS.md entry on joint-angle-specific strength transfer. Pull-ups and dips are genuine prerequisites but the transition skill neither proves. False-grip and transition-position overcoming isometrics are the first exercises that can demonstrate this capability — they train the specific wrist position and sticking-point strength directly.',
  },
];
