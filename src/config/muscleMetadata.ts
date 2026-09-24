import type { Muscle } from '../hooks/useBodyMap';

export type MuscleRole = 'stabilizer' | 'mover';
export type AlterEgo = 'Scientist' | 'Spider' | 'Guardian' | 'Primal Engine';

export interface MuscleInfo {
  role: MuscleRole;
  /** Stabilizer: what joint/complex it guards. Mover: movement pattern it drives. */
  fn: string;
  /** Stabilizer only: where the weakness surfaces upstream before the muscle itself feels weak. */
  upstreamEffect?: string;
  /** Only for well-documented injury pairs — do not add without an established clinical association. */
  injuryRisk?: string;
  alterEgo: AlterEgo;
  exercises: string[];
}

export const MUSCLE_META: Record<Muscle, MuscleInfo> = {
  'Rear Delts': {
    role: 'stabilizer',
    fn: "the shoulder's posterior capsule and rotator cuff",
    upstreamEffect: 'upper trap dominance and shoulder impingement',
    injuryRisk: 'shoulder impingement',
    alterEgo: 'Scientist',
    exercises: ['Face pulls', 'Reverse fly', 'Band pull-aparts', 'Wall angels'],
  },
  'Lower Back': {
    role: 'stabilizer',
    fn: 'the lumbar spine under load',
    upstreamEffect: 'lumbar instability and disc compression during hip hinge movements',
    injuryRisk: 'lumbar disc injury',
    alterEgo: 'Scientist',
    exercises: ['Jefferson curls', 'Good mornings', 'Hyperextensions', 'Back extensions'],
  },
  Hamstrings: {
    role: 'mover',
    fn: 'hip hinge, knee flexion, and sprint deceleration',
    alterEgo: 'Primal Engine',
    exercises: ['Nordic curls', 'Romanian deadlift', 'Good mornings', 'Leg curl'],
  },
  'Hip Flexors': {
    role: 'stabilizer',
    fn: 'the lumbar-hip complex and anterior pelvic alignment under load',
    upstreamEffect: 'anterior pelvic tilt and lower-back compensation under load',
    injuryRisk: 'lumbar instability',
    alterEgo: 'Guardian',
    exercises: ['Hanging leg raises', 'Dead bugs', 'Flutter kicks', 'Dragon flags'],
  },
  Traps: {
    role: 'stabilizer',
    fn: 'scapular elevation and cervical-thoracic load transfer',
    upstreamEffect: 'scapular winging and reduced force transfer in overhead pressing',
    alterEgo: 'Scientist',
    exercises: ['Shrugs', 'Upright rows', 'Face pulls', 'Farmer carries'],
  },
  Calves: {
    role: 'mover',
    fn: 'ankle plantarflexion, jump takeoff, and reactive ground contact',
    alterEgo: 'Spider',
    exercises: ['Single-leg calf raises', 'Jump rope', 'Explosive calf press'],
  },
  Forearms: {
    role: 'stabilizer',
    fn: 'wrist stability and grip under sustained load',
    upstreamEffect: 'grip failure before pulling strength — the chain breaks at the wrist, not the lats',
    injuryRisk: 'wrist and elbow tendinopathy',
    alterEgo: 'Spider',
    exercises: ['Dead hangs', 'Farmer carries', 'Wrist curls', 'Rice bucket'],
  },
  Shoulders: {
    role: 'mover',
    fn: 'overhead pressing and vertical force production',
    alterEgo: 'Spider',
    exercises: ['Handstand practice', 'Pike push-ups', 'OHP / Sandbag military press'],
  },
  Chest: {
    role: 'mover',
    fn: 'horizontal pushing and forward force production',
    alterEgo: 'Spider',
    exercises: ['Dips', 'Push-up variations', 'Slow dips'],
  },
  Triceps: {
    role: 'mover',
    fn: 'elbow extension in all pressing patterns',
    alterEgo: 'Scientist',
    exercises: ['Dip bar tricep extensions', 'Tricep pushdowns', 'Diamond push-ups'],
  },
  Biceps: {
    role: 'mover',
    fn: 'elbow flexion and supination in pulling patterns',
    alterEgo: 'Spider',
    exercises: ['Pull-ups', 'Chinups', 'TRX / ring rows'],
  },
  Core: {
    role: 'stabilizer',
    fn: 'spinal stiffness and force transfer between upper and lower body',
    upstreamEffect: 'power leakage between the upper and lower chain — force generated at the limbs dissipates through an unstable midsection',
    alterEgo: 'Scientist',
    exercises: ['Hollow body holds', 'L-sit hold', 'Planks', 'Russian twists'],
  },
  Lats: {
    role: 'mover',
    fn: 'vertical pulling and scapular depression',
    alterEgo: 'Spider',
    exercises: ['Pull-ups (weighted)', 'Lat pulldowns', 'Ring rows'],
  },
  'Upper Back': {
    role: 'mover',
    fn: 'horizontal pulling and scapular retraction',
    alterEgo: 'Guardian',
    exercises: ['Full body inverted rows', 'Cable rows', 'TRX rows'],
  },
  Glutes: {
    role: 'mover',
    fn: 'hip extension, jumping output, and posterior chain power',
    alterEgo: 'Primal Engine',
    exercises: ['Single-leg glute bridges', 'Bulgarian split squats', 'Hip thrusts'],
  },
  Quads: {
    role: 'mover',
    fn: 'knee extension, squat strength, and deceleration on landing',
    alterEgo: 'Primal Engine',
    exercises: ['Squats', 'Bulgarian split squats', 'Sissy squats', 'Lunges'],
  },
};

// Ordered by structural vulnerability — first match with < 8% becomes the focus
export const STRUCTURAL_ORDER: Muscle[] = [
  'Rear Delts', 'Lower Back', 'Hamstrings', 'Hip Flexors',
  'Traps', 'Calves', 'Forearms',
];

export interface PhaseInfo {
  name: AlterEgo | 'Integration';
  desc: string;
}

export function programPhase(week: number): PhaseInfo {
  if (week <= 13) return { name: 'Scientist', desc: 'structural adaptation — tendons lag 8–12 weeks behind muscle' };
  if (week <= 26) return { name: 'Spider', desc: 'reactive output building on structural base' };
  if (week <= 39) return { name: 'Guardian', desc: 'mobility and resilience under load' };
  if (week <= 52) return { name: 'Primal Engine', desc: 'raw power through full range' };
  return { name: 'Integration', desc: 'consolidating all five alter-egos into unified movement' };
}
