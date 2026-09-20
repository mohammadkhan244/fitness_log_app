import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';

// Keyword → muscle group mapping (case-insensitive substring)
const KEYWORD_MUSCLE: Array<{ kw: string[]; muscles: string[] }> = [
  { kw: ['pull-up', 'pullup', 'pull up', 'chin', 'lat pull', 'pulldown'], muscles: ['Lats', 'Biceps', 'Upper Back'] },
  { kw: ['row', 'cable row', 'bent over', 'one arm', 't-bar'], muscles: ['Upper Back', 'Lats', 'Biceps'] },
  { kw: ['push-up', 'pushup', 'push up', 'bench press', 'chest press', 'incline', 'decline', 'fly', 'pec'], muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { kw: ['dip', 'chest dip', 'tricep dip'], muscles: ['Chest', 'Triceps', 'Shoulders'] },
  { kw: ['squat', 'leg press', 'lunge', 'split squat', 'goblet', 'step-up', 'step up', 'pistol'], muscles: ['Quads', 'Glutes'] },
  { kw: ['deadlift', 'rdl', 'romanian', 'good morning', 'sumo', 'hinge', 'suitcase'], muscles: ['Lower Back', 'Hamstrings', 'Glutes'] },
  { kw: ['plank', 'hollow body', 'hollow hold', 'ab ', 'abs', 'core', 'crunch', 'sit-up', 'situp', 'l-sit', 'l sit', 'dragon flag', 'tuck'], muscles: ['Core'] },
  { kw: ['handstand', 'hspu', 'pike push', 'overhead press', 'shoulder press', 'ohp', 'military', 'clean', 'jerk', 'snatch'], muscles: ['Shoulders', 'Triceps', 'Core'] },
  { kw: ['lateral raise', 'front raise', 'arnold', 'upright row'], muscles: ['Shoulders'] },
  { kw: ['bicep curl', 'curl', 'hammer curl', 'zottman', 'concentration curl'], muscles: ['Biceps', 'Forearms'] },
  { kw: ['tricep', 'skull crusher', 'extension', 'close grip', 'overhead tri', 'pushdown', 'pressdown'], muscles: ['Triceps'] },
  { kw: ['calf raise', 'calf', 'jump rope', 'box jump', 'broad jump', 'hop', 'sprint'], muscles: ['Calves'] },
  { kw: ['glute bridge', 'hip thrust', 'glute', 'kickback', 'hip abduct', 'clamshell', 'frog'], muscles: ['Glutes'] },
  { kw: ['hamstring', 'nordic', 'leg curl', 'lying curl', 'single leg rdl'], muscles: ['Hamstrings'] },
  { kw: ['shrug', 'trap bar', 'face pull', 'band pull apart', 'rear delt fly', 'reverse fly', 'external rot'], muscles: ['Traps', 'Rear Delts', 'Upper Back'] },
  { kw: ['forearm', 'wrist curl', 'grip', 'farmer walk', 'farmers', 'carry', 'hang', 'dead hang'], muscles: ['Forearms'] },
  { kw: ['hip flexor', 'mountain climber', 'knee raise', 'leg raise', 'v-up', 'flutter kick'], muscles: ['Hip Flexors', 'Core'] },
  { kw: ['muscle-up', 'muscle up', 'front lever', 'back lever', 'ring dip', 'ring push', 'ring row', 'ring pull'], muscles: ['Lats', 'Chest', 'Core', 'Biceps'] },
  { kw: ['sandbag', 'turkish get up', 'tgu', 'windmill', 'renegade'], muscles: ['Core', 'Shoulders', 'Lats'] },
  { kw: ['lower back', 'back extension', 'superman', 'reverse hyper', 'bird dog'], muscles: ['Lower Back', 'Glutes'] },
  { kw: ['band', 'monster walk', 'side step', 'lateral'], muscles: ['Glutes', 'Hip Flexors'] },
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
    const sets = await db.sets.toArray();
    const muscleSets = new Map<Muscle, number>();
    const muscleExercises = new Map<Muscle, Set<string>>();
    const unmappedSet = new Set<string>();

    for (const s of sets) {
      const muscles = mapExerciseToMuscles(s.exercise);
      if (muscles.length === 0) {
        unmappedSet.add(s.exercise);
      } else {
        for (const m of muscles) {
          muscleSets.set(m, (muscleSets.get(m) ?? 0) + 1);
          const exSet = muscleExercises.get(m) ?? new Set<string>();
          exSet.add(s.exercise);
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
