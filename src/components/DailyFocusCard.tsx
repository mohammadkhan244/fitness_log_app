import type { BodyMapData, Muscle } from '../hooks/useBodyMap';

interface Props {
  bodyMap: BodyMapData;
  week: number;
}

const STRUCTURAL_PRIORITY: Array<{ muscle: Muscle; exercises: string[] }> = [
  { muscle: 'Rear Delts',   exercises: ['Face pulls', 'Reverse fly', 'Band pull-aparts', 'Wall angels'] },
  { muscle: 'Lower Back',   exercises: ['Jefferson curls', 'Good mornings', 'Hyperextensions', 'Back extensions'] },
  { muscle: 'Hamstrings',   exercises: ['Nordic curls', 'Romanian deadlift', 'Good mornings', 'Leg curl'] },
  { muscle: 'Hip Flexors',  exercises: ['Hanging leg raises', 'Dead bugs', 'Flutter kicks', 'Dragon flags'] },
  { muscle: 'Traps',        exercises: ['Shrugs', 'Upright rows', 'Face pulls', 'Farmer carries'] },
  { muscle: 'Calves',       exercises: ['Single-leg calf raises', 'Jump rope', 'Explosive calf press'] },
  { muscle: 'Forearms',     exercises: ['Dead hangs', 'Farmer carries', 'Wrist curls', 'Rice bucket'] },
];

function weekPhase(week: number): string {
  if (week <= 10) return 'Foundation phase — every session is laying structural groundwork. Prioritise form over load.';
  if (week <= 20) return 'Early build — small weekly progressions compound massively. Log your benchmarks now.';
  if (week <= 30) return 'Mid phase — this is where most people quit. Consistency here separates programs from results.';
  if (week <= 40) return 'Strength phase — your tendons have adapted. Push intensity on benchmark lifts.';
  if (week <= 52) return 'Advanced phase — consolidate movement patterns. Depth over breadth now.';
  if (week <= 60) return 'Final stretch — master what you have. No new exercises, just sharper execution.';
  return 'Week 60+ — elite consistency. Most programs never reach this. Keep the standard.';
}

export default function DailyFocusCard({ bodyMap, week }: Props) {
  const { muscleSets } = bodyMap;
  const totalMuscleSets = Math.max(1, Array.from(muscleSets.values()).reduce((a, b) => a + b, 0));

  const focus = STRUCTURAL_PRIORITY.find(({ muscle }) => {
    const pct = ((muscleSets.get(muscle) ?? 0) / totalMuscleSets) * 100;
    return pct < 8;
  });

  // Push/pull imbalance
  const pushMuscles: Muscle[] = ['Chest', 'Shoulders', 'Triceps'];
  const pullMuscles: Muscle[] = ['Lats', 'Upper Back', 'Biceps', 'Rear Delts'];
  const pushVol = pushMuscles.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const pullVol = pullMuscles.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const ratio = pullVol > 0 ? pushVol / pullVol : null;
  const imbalance =
    ratio !== null && ratio > 1.4
      ? `pull`
      : ratio !== null && ratio < 0.7
      ? `push`
      : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's focus</p>

      {/* Muscle focus */}
      {focus ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-400">{focus.muscle}</span>
            <span className="text-xs text-gray-600">
              {Math.round(((muscleSets.get(focus.muscle) ?? 0) / totalMuscleSets) * 100)}% of volume
            </span>
          </div>
          <p className="text-xs text-gray-500">Undertrained structural muscle. Work it in today.</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {focus.exercises.map((ex) => (
              <span key={ex} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">{ex}</span>
            ))}
          </div>
        </div>
      ) : imbalance ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-400">
            {imbalance === 'pull' ? 'Add pulling work' : 'Add pressing work'}
          </p>
          <p className="text-xs text-gray-500">
            Your push/pull ratio is {ratio?.toFixed(1)}. Lean into {imbalance} movements today.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm font-semibold text-green-400">Balance looks solid</p>
          <p className="text-xs text-gray-500">No major gaps. Focus on quality and progressive overload.</p>
        </div>
      )}

      {/* Week tip */}
      <div className="border-t border-gray-800 pt-3">
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="text-gray-500 font-medium">Wk {week} · </span>
          {weekPhase(week)}
        </p>
      </div>
    </div>
  );
}
