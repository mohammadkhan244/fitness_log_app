import type { BodyMapData, Muscle } from '../hooks/useBodyMap';

interface Props {
  mobility: BodyMapData;
}

// Priority order — muscles most likely to become silent limiters first
const FOCUS_ORDER: Muscle[] = [
  'Hip Flexors', 'Hamstrings', 'Lower Back', 'Shoulders',
  'Upper Back', 'Calves', 'Forearms', 'Glutes', 'Quads',
];

interface MuscleMeta {
  why: string;
  exercises: string[];
}

const MUSCLE_META: Record<string, MuscleMeta> = {
  'Hip Flexors': {
    why: "Tight hip flexors cap squat depth, limit handstand line, and shorten sprint stride. The anterior chain compensates for what the hip flexors can't provide — the lumbar spine pays.",
    exercises: ['90/90 hip stretch', 'Couch stretch', 'Kneeling lunge stretch'],
  },
  'Hamstrings': {
    why: 'Shortened hamstrings load the lumbar spine on every hinge and limit forward fold depth. Posterior chain strength without hamstring length is stored tension, not usable range.',
    exercises: ['Pancake stretch', 'Standing forward fold', 'Single-leg hamstring stretch'],
  },
  'Lower Back': {
    why: "Stiff lumbar segments transfer load through joints instead of muscles. Spinal mobility is what keeps hinge mechanics clean under fatigue — without it the disc absorbs what the muscles should.",
    exercises: ["Child's pose", 'Cat-cow', 'Jefferson curl (unloaded)'],
  },
  'Shoulders': {
    why: 'Shoulder mobility is the primary ceiling for handstand form and overhead pressing mechanics. Strength gets you to the range you have — mobility determines what that range is.',
    exercises: ['Thread the needle', 'Doorway chest stretch', 'Cross-body shoulder stretch'],
  },
  'Upper Back': {
    why: "Thoracic stiffness forces lumbar compensation during all overhead work — the lower back pays for the upper back's rigidity. Thoracic extension is the structural prerequisite for a clean handstand line.",
    exercises: ['Thread the needle', 'Thoracic rotation', 'Book openings'],
  },
  'Calves': {
    why: 'Limited ankle dorsiflexion forces heel rise in squats and increases Achilles load on landing. The reactive ground contact that sprint and jump training builds depends on this range being available.',
    exercises: ['Standing calf stretch', 'Ankle mobility circles', 'Downward dog'],
  },
  'Forearms': {
    why: 'Wrist extension range limits handstand, pushup depth, and any loaded front rack position. Wrist mobility is the silent bottleneck for pressing and overhead skill work.',
    exercises: ['Wrist extension stretch', 'Prayer stretch', 'Wrist circles'],
  },
  'Glutes': {
    why: 'Tight hip external rotators limit squat width, single-leg stability, and lateral change of direction. Glute mobility is what makes glute strength usable through full range.',
    exercises: ['Pigeon pose', '90/90 hip rotation', 'Figure-four stretch'],
  },
  'Quads': {
    why: 'Quad flexibility determines squat depth and knee clearance in deep positions. Loaded quads without offsetting length accumulate into patellar tension over time.',
    exercises: ['Couch stretch', 'Standing quad stretch', 'Kneeling quad stretch'],
  },
};

function findFocus(muscleSets: Map<Muscle, number>): { muscle: Muscle; sessions: number } {
  // First: any zero-session muscle in priority order
  const zeroMuscle = FOCUS_ORDER.find((m) => (muscleSets.get(m) ?? 0) === 0);
  if (zeroMuscle) return { muscle: zeroMuscle, sessions: 0 };
  // Fallback: lowest session count in priority order
  return FOCUS_ORDER
    .map((m) => ({ muscle: m, sessions: muscleSets.get(m) ?? 0 }))
    .reduce((min, curr) => (curr.sessions < min.sessions ? curr : min));
}

export default function MobilityFocusCard({ mobility }: Props) {
  const { muscle, sessions } = findFocus(mobility.muscleSets);
  const meta = MUSCLE_META[muscle];

  // All focus muscles have solid coverage
  const allCovered = FOCUS_ORDER.every((m) => (mobility.muscleSets.get(m) ?? 0) >= 3);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
        Today's Mobility Focus
      </p>

      {allCovered ? (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-cyan-400">All key areas covered</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Every priority mobility group has consistent sessions logged. Rotate through them
            to maintain coverage — mobility range degrades faster than it's built when sessions stop.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-cyan-400">{muscle}</span>
            <span className="text-xs text-gray-600">
              {sessions === 0 ? 'no sessions yet' : `${sessions} session${sessions !== 1 ? 's' : ''}`}
            </span>
          </div>

          {meta && (
            <>
              <p className="text-xs text-gray-400 leading-relaxed">{meta.why}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {meta.exercises.map((ex) => (
                  <span key={ex} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">
                    {ex}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
