import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

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

export function mapExerciseToMuscles(exerciseName: string): Muscle[] {
  const lower = exerciseName.toLowerCase();
  const matched = new Set<Muscle>();
  for (const { kw, muscles } of KEYWORD_MUSCLE) {
    if (kw.some((k) => lower.includes(k))) {
      for (const m of muscles) matched.add(m as Muscle);
    }
  }
  return Array.from(matched);
}

export interface BodyMapData {
  muscleSets: Map<Muscle, number>;
  muscleExercises: Map<Muscle, string[]>;
  unmapped: string[];
}

export function useBodyMap(): BodyMapData {
  const result = useLiveQuery(async () => {
    const [sets, aliasRows] = await Promise.all([
      db.sets.toArray(),
      db.exerciseAliases.toArray(),
    ]);

    const aliasMap = new Map(aliasRows.map((a) => [a.alias.toLowerCase(), a.canonical]));
    const resolve = (name: string) => aliasMap.get(name.toLowerCase()) ?? name;

    const muscleSets = new Map<Muscle, number>();
    const muscleExercises = new Map<Muscle, Set<string>>();
    const unmappedSet = new Set<string>();

    for (const s of sets) {
      const resolved = resolve(s.exercise);
      const muscles = mapExerciseToMuscles(resolved);
      if (muscles.length === 0) {
        unmappedSet.add(resolved);
      } else {
        for (const m of muscles) {
          muscleSets.set(m, (muscleSets.get(m) ?? 0) + 1);
          const exSet = muscleExercises.get(m) ?? new Set<string>();
          exSet.add(resolved);
          muscleExercises.set(m, exSet);
        }
      }
    }

    const muscleExList = new Map<Muscle, string[]>();
    for (const [m, exSet] of muscleExercises) {
      muscleExList.set(m, Array.from(exSet).sort());
    }

    return { muscleSets, muscleExercises: muscleExList, unmapped: Array.from(unmappedSet).sort() };
  }, []);

  return result ?? { muscleSets: new Map(), muscleExercises: new Map(), unmapped: [] };
}
