import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

// ─── Keyword → muscle maps ────────────────────────────────────────────────────

const KEYWORD_MUSCLE: Array<{ kw: string[]; muscles: string[] }> = [
  // ── Pull / Back ───────────────────────────────────────────────────────────────
  {
    kw: ['pull-up', 'pullup', 'pull up', 'chinup', 'chin-up', 'chin up', 'chest-to-bar',
         'chest to bar', 'lat pull', 'pulldown', 'seated pull', 'l-sit pull', 'explosive pull'],
    muscles: ['Lats', 'Biceps', 'Upper Back'],
  },
  {
    kw: ['row', 'cable row', 'bent over', 'one arm', 't-bar', 'inverted row', 'trx row',
         'ring row', 'full body row'],
    muscles: ['Upper Back', 'Lats', 'Biceps'],
  },

  // ── Push / Chest ──────────────────────────────────────────────────────────────
  {
    kw: ['push-up', 'pushup', 'push up', 'bench press', 'chest press', 'incline push',
         'decline push', 'fly', 'pec', 'clapping push', 'diamond push', 'rotational push',
         'deficit push', 'slow push', 'explosive push', 'incline pushup'],
    muscles: ['Chest', 'Triceps', 'Shoulders'],
  },
  {
    kw: ['dip', 'tricep dip', 'chest dip', 'bar dip', 'bench dip', 'ring dip', 'slow dip'],
    muscles: ['Chest', 'Triceps', 'Shoulders'],
  },

  // ── Overhead / Shoulder press ─────────────────────────────────────────────────
  {
    kw: ['handstand', 'hspu', 'pike push', 'overhead press', 'shoulder press', 'ohp',
         'military press', 'sandbag military', 'clean and press', 'jerk', 'snatch',
         'wall hspu', 'wall handstand', 'freestanding handstand'],
    muscles: ['Shoulders', 'Triceps', 'Core'],
  },

  // ── Lateral / Rear Delt ───────────────────────────────────────────────────────
  {
    kw: ['lateral raise', 'front raise', 'arnold', 'reverse fly', 'reverse flys',
         'shadow box', 'shadow boxing'],
    muscles: ['Shoulders', 'Rear Delts'],
  },
  {
    kw: ['upright row', 'face pull', 'band pull apart', 'rear delt', 'shrug', 'trap bar',
         'external rot', 'wall angel'],
    muscles: ['Traps', 'Rear Delts', 'Upper Back'],
  },

  // ── Gymnastics / Skills ───────────────────────────────────────────────────────
  {
    kw: ['muscle-up', 'muscle up', 'front lever', 'back lever', 'ring pull'],
    muscles: ['Lats', 'Chest', 'Core', 'Biceps'],
  },
  {
    kw: ['pseudo-planche', 'pseudo planche', 'planche', 'crow hold', 'crow pose', 'crow stand',
         'crow crawl'],
    muscles: ['Shoulders', 'Chest', 'Core', 'Triceps'],
  },

  // ── Squat / Quads ─────────────────────────────────────────────────────────────
  {
    kw: ['squat', 'leg press', 'lunge', 'split squat', 'goblet', 'step-up', 'step up',
         'pistol', 'sissy', 'cossack', 'duck walk', 'wall sit', 'leg extension'],
    muscles: ['Quads', 'Glutes'],
  },

  // ── Hinge / Posterior chain ───────────────────────────────────────────────────
  {
    kw: ['deadlift', 'rdl', 'romanian', 'good morning', 'sumo deadlift', 'hinge', 'suitcase',
         'jefferson curl', 'jefferson'],
    muscles: ['Lower Back', 'Hamstrings', 'Glutes'],
  },

  // ── Hamstrings ────────────────────────────────────────────────────────────────
  {
    kw: ['hamstring', 'nordic', 'leg curl', 'lying curl', 'single leg rdl', 'band leg curl',
         'flutter hamstring', 'hamstring kick', 'hamstring crunch'],
    muscles: ['Hamstrings'],
  },

  // ── Glutes ────────────────────────────────────────────────────────────────────
  {
    kw: ['glute bridge', 'hip thrust', 'single-leg glute', 'glute kickback', 'glute bridge',
         'hip abduct', 'clamshell', 'frog pump'],
    muscles: ['Glutes'],
  },

  // ── Calves / Plyometrics ──────────────────────────────────────────────────────
  {
    kw: ['calf raise', 'calf', 'jump rope', 'box jump', 'broad jump', 'stair jump',
         'stair run', 'sprint', 'football run', 'scissor drill'],
    muscles: ['Calves', 'Quads'],
  },

  // ── Hip Flexors ───────────────────────────────────────────────────────────────
  {
    kw: ['hip flexor', 'mountain climber', 'knee raise', 'leg raise', 'psoas', 'scissor',
         'flutter kick', 'high knee'],
    muscles: ['Hip Flexors', 'Core'],
  },

  // ── Core ──────────────────────────────────────────────────────────────────────
  {
    kw: ['plank', 'side plank', 'hollow body', 'hollow hold', 'hollow rock', 'ab ', 'abs',
         'core', 'crunch', 'sit-up', 'situp', 'l-sit', 'l sit', 'dragon flag', 'tuck hold',
         'russian twist', 'v-up', 'rollout', 'anti-rotation', 'overcoming isometric',
         'isometric hold', 'ab wheel', 'moving plank'],
    muscles: ['Core'],
  },

  // ── Biceps ────────────────────────────────────────────────────────────────────
  {
    kw: ['bicep curl', 'bicep', 'hammer curl', 'zottman', 'concentration curl', 'arm curl',
         'sandbag curl', 'rice bag curl', 'preacher curl'],
    muscles: ['Biceps', 'Forearms'],
  },

  // ── Triceps ───────────────────────────────────────────────────────────────────
  {
    kw: ['tricep extension', 'tricep pushdown', 'skull crusher', 'dip bar tricep',
         'overhead tricep', 'pushdown', 'pressdown', 'close grip press'],
    muscles: ['Triceps'],
  },

  // ── Forearms / Grip ───────────────────────────────────────────────────────────
  {
    kw: ['forearm', 'wrist curl', 'grip', 'farmer walk', 'farmers', 'carry', 'dead hang',
         'hang hold'],
    muscles: ['Forearms'],
  },

  // ── Lower Back ────────────────────────────────────────────────────────────────
  {
    kw: ['back extension', 'superman hold', 'superman', 'reverse hyper', 'bird dog',
         'lower back'],
    muscles: ['Lower Back', 'Glutes'],
  },

  // ── Full body / Sandbag flows ─────────────────────────────────────────────────
  {
    kw: ['sandbag flow', 'sandbag clean', 'sandbag bear', 'bear crawl', 'turkish get up',
         'tgu', 'windmill', 'renegade row', 'rice bag clean', 'sandbag get-up',
         'sandbag carry'],
    muscles: ['Core', 'Shoulders', 'Lats'],
  },

  // ── Lateral band work ─────────────────────────────────────────────────────────
  {
    kw: ['monster walk', 'side step', 'lateral walk', 'band walk'],
    muscles: ['Glutes', 'Hip Flexors'],
  },

  // ── Cardio / Sport ────────────────────────────────────────────────────────────
  {
    kw: ['run', 'jog', 'running', 'jogging', 'treadmill'],
    muscles: ['Quads', 'Hamstrings', 'Calves', 'Hip Flexors'],
  },
  {
    kw: ['cycling', 'bike', 'biking', 'spin class', 'stationary bike'],
    muscles: ['Quads', 'Hamstrings', 'Calves', 'Glutes'],
  },
  {
    kw: ['swim', 'freestyle', 'breaststroke', 'backstroke'],
    muscles: ['Shoulders', 'Lats', 'Triceps', 'Core'],
  },
  {
    kw: ['football', 'soccer', 'basketball', 'lacrosse', 'rugby'],
    muscles: ['Quads', 'Hamstrings', 'Calves', 'Glutes', 'Hip Flexors'],
  },
  {
    kw: ['hiking', 'hike', 'trail'],
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
  },
  {
    kw: ['rowing machine', 'row erg', 'concept2'],
    muscles: ['Lats', 'Upper Back', 'Biceps', 'Core', 'Quads'],
  },
];

// Exercises that are primarily stretches/mobility — not in the strength map.
// Used when a set is timed (seconds/minutes) with no load.
const MOBILITY_KEYWORD_MUSCLE: Array<{ kw: string[]; muscles: string[] }> = [
  { kw: ['pancake', 'straddle', 'groin stretch', 'butterfly stretch', 'frog stretch'],
    muscles: ['Hip Flexors', 'Hamstrings'] },
  { kw: ['pigeon', 'figure four', 'figure-four', 'piriformis'],
    muscles: ['Glutes', 'Hip Flexors'] },
  { kw: ['90/90', '90 90'],
    muscles: ['Glutes', 'Hip Flexors'] },
  { kw: ['couch stretch', 'hip flexor stretch', 'kneeling lunge stretch', 'lunge stretch',
         'hip opener', 'psoas stretch'],
    muscles: ['Hip Flexors', 'Quads'] },
  { kw: ['hamstring stretch', 'seated hamstring', 'standing hamstring', 'lying hamstring',
         'toe touch', 'forward fold', 'standing fold'],
    muscles: ['Hamstrings', 'Lower Back'] },
  { kw: ["child's pose", 'childs pose', 'child pose', 'happy baby'],
    muscles: ['Lower Back', 'Lats'] },
  { kw: ['cat cow', 'cat-cow', 'spinal wave'],
    muscles: ['Lower Back', 'Core'] },
  { kw: ['thread the needle', 'thoracic rotation', 'thoracic mobility', 'thoracic',
         't-spine', 'book opening'],
    muscles: ['Upper Back', 'Shoulders'] },
  { kw: ['chest stretch', 'pec stretch', 'doorway stretch', 'chest opener'],
    muscles: ['Chest', 'Shoulders'] },
  { kw: ['lat stretch', 'side stretch', 'overhead stretch', 'side bend'],
    muscles: ['Lats', 'Core'] },
  { kw: ['shoulder stretch', 'cross body', 'posterior shoulder', 'arm cross stretch'],
    muscles: ['Shoulders', 'Rear Delts'] },
  { kw: ['calf stretch', 'ankle mobility', 'ankle circle', 'ankle stretch',
         'achilles stretch', 'standing calf stretch'],
    muscles: ['Calves'] },
  { kw: ['quad stretch', 'standing quad', 'lying quad', 'rectus femoris stretch'],
    muscles: ['Quads', 'Hip Flexors'] },
  { kw: ['wrist stretch', 'wrist mobility', 'wrist circle', 'wrist rotation', 'finger stretch'],
    muscles: ['Forearms'] },
  { kw: ['neck stretch', 'neck mobility', 'neck rotation', 'neck circle', 'levator stretch'],
    muscles: ['Traps'] },
  { kw: ['downward dog', 'down dog', 'inchworm'],
    muscles: ['Hamstrings', 'Calves', 'Shoulders', 'Lats'] },
  { kw: ['hip circle', 'hip rotation', 'hip mobility', 'hip swing'],
    muscles: ['Hip Flexors', 'Glutes'] },
];

export const MUSCLE_LIST = [
  'Shoulders', 'Chest', 'Triceps', 'Biceps', 'Forearms', 'Core',
  'Lats', 'Upper Back', 'Traps', 'Rear Delts', 'Lower Back',
  'Hip Flexors', 'Glutes', 'Quads', 'Hamstrings', 'Calves',
] as const;

export type Muscle = (typeof MUSCLE_LIST)[number];

const MUSCLE_VIEW: Record<Muscle, 'front' | 'back' | 'both'> = {
  Shoulders: 'both',
  Chest: 'front',
  Triceps: 'back',
  Biceps: 'front',
  Forearms: 'both',
  Core: 'front',
  Lats: 'back',
  'Upper Back': 'back',
  Traps: 'back',
  'Rear Delts': 'back',
  'Lower Back': 'back',
  'Hip Flexors': 'front',
  Glutes: 'back',
  Quads: 'front',
  Hamstrings: 'back',
  Calves: 'both',
};

export { MUSCLE_VIEW };

export function mapExerciseToMuscles(exerciseName: string | null | undefined): Muscle[] {
  if (!exerciseName) return [];
  const lower = exerciseName.toLowerCase();
  const matched = new Set<Muscle>();
  for (const { kw, muscles } of KEYWORD_MUSCLE) {
    if (kw.some((k) => lower.includes(k))) {
      for (const m of muscles) matched.add(m as Muscle);
    }
  }
  return Array.from(matched);
}

// For timed no-load sets: check mobility keywords first, fall back to strength keywords.
function mapExerciseToMobilityMuscles(exerciseName: string | null | undefined): Muscle[] {
  if (!exerciseName) return [];
  const lower = exerciseName.toLowerCase();
  const matched = new Set<Muscle>();
  for (const { kw, muscles } of MOBILITY_KEYWORD_MUSCLE) {
    if (kw.some((k) => lower.includes(k))) {
      for (const m of muscles) matched.add(m as Muscle);
    }
  }
  // Fall back to strength keyword map for exercises that appear in both contexts
  if (matched.size === 0) {
    for (const m of mapExerciseToMuscles(exerciseName)) matched.add(m);
  }
  return Array.from(matched);
}

function isMobilitySet(s: { unit?: string; load?: number; category?: string }): boolean {
  if (s.category === 'Cardio') return false;
  if (s.category === 'Overcoming Isometric') return false; // strength stimulus, not endurance/mobility
  return (s.unit === 'seconds' || s.unit === 'minutes') && s.load == null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BodyMapData {
  muscleSets: Map<Muscle, number>;
  muscleExercises: Map<Muscle, string[]>;
  unmapped: string[];
}

export interface BodyMapViews {
  strength: BodyMapData;
  mobility: BodyMapData;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBodyMap(): BodyMapViews {
  const result = useLiveQuery(async () => {
    const [sets, aliasRows] = await Promise.all([
      db.sets.toArray(),
      db.exerciseAliases.toArray(),
    ]);

    const aliasMap = new Map(
      aliasRows
        .filter((a) => a.alias && a.canonical)
        .map((a) => [a.alias.toLowerCase(), a.canonical]),
    );
    const resolve = (name: string | null | undefined) => {
      if (!name) return '';
      return aliasMap.get(name.toLowerCase()) ?? name;
    };

    const sMuscleSets = new Map<Muscle, number>();
    const sMuscleExercises = new Map<Muscle, Set<string>>();
    const sUnmapped = new Set<string>();

    const mMuscleSets = new Map<Muscle, number>();
    const mMuscleExercises = new Map<Muscle, Set<string>>();
    const mUnmapped = new Set<string>();

    for (const s of sets) {
      if (!s.exercise) continue;
      const resolved = resolve(s.exercise);

      if (isMobilitySet(s)) {
        const muscles = mapExerciseToMobilityMuscles(resolved);
        if (muscles.length === 0) {
          mUnmapped.add(resolved);
        } else {
          for (const m of muscles) {
            mMuscleSets.set(m, (mMuscleSets.get(m) ?? 0) + 1);
            const exSet = mMuscleExercises.get(m) ?? new Set<string>();
            exSet.add(resolved);
            mMuscleExercises.set(m, exSet);
          }
        }
      } else {
        const muscles = mapExerciseToMuscles(resolved);
        if (muscles.length === 0) {
          sUnmapped.add(resolved);
        } else {
          for (const m of muscles) {
            sMuscleSets.set(m, (sMuscleSets.get(m) ?? 0) + 1);
            const exSet = sMuscleExercises.get(m) ?? new Set<string>();
            exSet.add(resolved);
            sMuscleExercises.set(m, exSet);
          }
        }
      }
    }

    function toList(map: Map<Muscle, Set<string>>): Map<Muscle, string[]> {
      const out = new Map<Muscle, string[]>();
      for (const [m, exSet] of map) out.set(m, Array.from(exSet).sort());
      return out;
    }

    return {
      strength: {
        muscleSets: sMuscleSets,
        muscleExercises: toList(sMuscleExercises),
        unmapped: Array.from(sUnmapped).sort(),
      },
      mobility: {
        muscleSets: mMuscleSets,
        muscleExercises: toList(mMuscleExercises),
        unmapped: Array.from(mUnmapped).sort(),
      },
    };
  }, []);

  const empty: BodyMapData = { muscleSets: new Map(), muscleExercises: new Map(), unmapped: [] };
  return result ?? { strength: empty, mobility: empty };
}
