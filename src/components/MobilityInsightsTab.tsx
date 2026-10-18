import type { BodyMapData, Muscle } from '../hooks/useBodyMap';

interface Props {
  strength: BodyMapData;
  mobility: BodyMapData;
}

type Priority = 'high' | 'medium' | 'low' | 'good';

interface Suggestion {
  priority: Priority;
  title: string;
  detail: string;
  insight: string;
  muscles: Muscle[];
  exercises?: string[];
}

// Muscles ordered by how quickly a mobility deficit translates into injury or
// range-of-motion ceiling under loaded calisthenics/sport training.
const PRIORITY_ORDER: Muscle[] = [
  'Hip Flexors', 'Hamstrings', 'Lower Back', 'Shoulders',
  'Upper Back', 'Calves', 'Forearms', 'Glutes',
  'Quads', 'Lats', 'Chest', 'Triceps', 'Biceps', 'Rear Delts', 'Traps', 'Core',
];

const MOBILITY_EXERCISES: Partial<Record<Muscle, string[]>> = {
  'Hip Flexors': ['90/90 hip stretch', 'Couch stretch', 'Kneeling lunge stretch'],
  'Hamstrings':  ['Pancake stretch', 'Standing forward fold', 'Single-leg hamstring stretch'],
  'Lower Back':  ["Child's pose", 'Cat-cow', 'Jefferson curl (unloaded)'],
  'Shoulders':   ['Doorway stretch', 'Thread the needle', 'Cross-body shoulder stretch'],
  'Upper Back':  ['Thread the needle', 'Thoracic rotation', 'Book openings'],
  'Calves':      ['Standing calf stretch', 'Ankle mobility circles', 'Downward dog'],
  'Forearms':    ['Wrist extension stretch', 'Prayer stretch', 'Wrist circles'],
  'Glutes':      ['Pigeon pose', '90/90 hip rotation', 'Figure-four stretch'],
  'Quads':       ['Couch stretch', 'Standing quad stretch', 'Lying quad stretch'],
  'Lats':        ['Lat stretch (overhead)', 'Side bend stretch', "Child's pose"],
  'Chest':       ['Doorway chest stretch', 'Pec stretch on floor'],
  'Core':        ['Cobra pose', 'Standing back bend', 'Side stretch'],
  'Traps':       ['Neck side stretch', 'Levator scapulae stretch'],
};

function generateMobilityInsights(
  strength: BodyMapData,
  mobility: BodyMapData,
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const { muscleSets: mSets } = mobility;
  const { muscleSets: sSets } = strength;

  const totalMobility = Array.from(mSets.values()).reduce((a, b) => a + b, 0);
  const totalStrength = Array.from(sSets.values()).reduce((a, b) => a + b, 0);

  if (totalStrength === 0 && totalMobility === 0) return suggestions;

  // ── 1. Key mobility gaps ───────────────────────────────────────────────────
  const keyMuscles: Muscle[] = ['Hip Flexors', 'Hamstrings', 'Lower Back', 'Shoulders', 'Upper Back'];
  const zeroKey = keyMuscles.filter((m) => (mSets.get(m) ?? 0) === 0);

  if (zeroKey.length > 0) {
    suggestions.push({
      priority: zeroKey.length >= 3 ? 'high' : 'medium',
      title: `${zeroKey.length} high-priority mobility area${zeroKey.length > 1 ? 's' : ''} untouched`,
      detail: zeroKey.join(', '),
      insight: `${zeroKey.join(' and ')} ${zeroKey.length === 1 ? 'has' : 'have'} zero logged flexibility sessions — these are the areas most likely to become silent range-of-motion ceilings. The body adapts to the ranges it's regularly exposed to; without direct work here, loaded strength patterns slowly narrow the available range instead of expanding it.`,
      muscles: zeroKey,
      exercises: zeroKey.flatMap((m) => (MOBILITY_EXERCISES[m] ?? []).slice(0, 1)),
    });
  }

  // ── 2. Loaded but never stretched ─────────────────────────────────────────
  const LOAD_THRESHOLD = 15;
  const loadedUntouched = PRIORITY_ORDER.filter(
    (m) => (sSets.get(m) ?? 0) >= LOAD_THRESHOLD && (mSets.get(m) ?? 0) === 0 && !zeroKey.includes(m),
  );

  if (loadedUntouched.length > 0) {
    suggestions.push({
      priority: 'medium',
      title: `${loadedUntouched.length} muscle${loadedUntouched.length > 1 ? 's' : ''} loaded heavily but never stretched`,
      detail: loadedUntouched.map((m) => `${m} (${sSets.get(m)} sets)`).join(' · '),
      insight: `Tissue loaded repeatedly through strength work without offsetting flexibility work adapts toward stiffness, not resilience — the force-producing range narrows over time. Stretch what you load; the strength ceiling follows the mobility ceiling.`,
      muscles: loadedUntouched,
      exercises: loadedUntouched.flatMap((m) => (MOBILITY_EXERCISES[m] ?? []).slice(0, 1)).slice(0, 3),
    });
  }

  // ── 3. Mobility-to-strength volume ratio ──────────────────────────────────
  if (totalStrength >= 20) {
    const pct = Math.round((totalMobility / totalStrength) * 100);
    if (pct < 5) {
      suggestions.push({
        priority: 'low',
        title: `Mobility sessions are ${pct}% of strength volume`,
        detail: `${totalMobility} mobility sessions vs ${totalStrength} strength sets — most coaches recommend 5–10%.`,
        insight: `At ${pct}%, mobility work is outpaced by strength volume ${Math.round(totalStrength / Math.max(1, totalMobility))}× over. The Scientist principle of structural longevity depends on tissue being both loaded and lengthened — one without the other compounds silently.`,
        muscles: [],
      });
    } else {
      suggestions.push({
        priority: 'good',
        title: `Mobility-to-strength ratio: ${pct}%`,
        detail: `${totalMobility} mobility sessions vs ${totalStrength} strength sets — within the healthy 5–10% range.`,
        insight: `At ${pct}%, flexibility work is keeping pace with strength volume. Tissue is being loaded and lengthened proportionally — structural resilience is building alongside strength output rather than eroding under it.`,
        muscles: [],
      });
    }
  }

  // ── 4. Coverage breadth ───────────────────────────────────────────────────
  const covered = PRIORITY_ORDER.filter((m) => (mSets.get(m) ?? 0) > 0).length;
  const total = PRIORITY_ORDER.length;

  if (totalMobility > 0 && covered <= 4) {
    suggestions.push({
      priority: 'medium',
      title: `Mobility coverage: ${covered} of ${total} muscle groups`,
      detail: `Most sessions are concentrated in a few areas. Rotating through more regions catches tightness before it becomes a training ceiling.`,
      insight: `${covered}/${total} muscle groups have any flexibility work — concentrated mobility training builds local range but leaves the surrounding kinetic chain rigid. Joints that aren't periodically taken through full range slowly lose access to it.`,
      muscles: PRIORITY_ORDER.filter((m) => (mSets.get(m) ?? 0) === 0).slice(0, 5),
    });
  } else if (totalMobility > 0 && covered >= 10) {
    suggestions.push({
      priority: 'good',
      title: `Broad mobility coverage: ${covered} of ${total} muscle groups`,
      detail: `Flexibility work is distributed across most of the body.`,
      insight: `${covered}/${total} muscle groups have logged flexibility work — broad coverage keeps the full kinetic chain supple and prevents isolated stiffness from becoming a force-leak in compound movements.`,
      muscles: [],
    });
  }

  return suggestions;
}

const PRIORITY_STYLE: Record<Priority, { badge: string; border: string; label: string }> = {
  high:   { badge: 'bg-red-900/60 text-red-300',    border: 'border-red-900/50',    label: 'Fix'    },
  medium: { badge: 'bg-amber-900/60 text-amber-300', border: 'border-amber-900/50', label: 'Watch'  },
  low:    { badge: 'bg-gray-800 text-gray-400',      border: 'border-gray-800',      label: 'Tip'    },
  good:   { badge: 'bg-green-900/60 text-green-300', border: 'border-green-900/50', label: '✓ Good' },
};

export default function MobilityInsightsTab({ strength, mobility }: Props) {
  const totalMobility = Array.from(mobility.muscleSets.values()).reduce((a, b) => a + b, 0);

  if (totalMobility === 0) {
    return (
      <p className="text-xs text-gray-600 py-4 text-center">
        No mobility sessions logged yet. Log timed holds or stretches (seconds/minutes, no load) with any category to see insights here.
      </p>
    );
  }

  const suggestions = generateMobilityInsights(strength, mobility);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Based on {totalMobility} mobility session{totalMobility !== 1 ? 's' : ''} across {mobility.muscleExercises.size} muscle group{mobility.muscleExercises.size !== 1 ? 's' : ''}.
      </p>

      {suggestions.map((s, i) => {
        const style = PRIORITY_STYLE[s.priority];
        return (
          <div key={i} className={`border rounded-xl p-4 space-y-2 ${style.border}`}>
            <div className="flex items-start gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-sm font-medium text-gray-200">{s.title}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{s.detail}</p>
            <p className="text-xs text-cyan-400/80 leading-relaxed border-l-2 border-cyan-900/60 pl-2">
              {s.insight}
            </p>
            {s.exercises && s.exercises.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Try:</p>
                <div className="flex flex-wrap gap-1">
                  {s.exercises.map((ex) => (
                    <span key={ex} className="text-xs bg-gray-800 text-gray-300 rounded-lg px-2 py-1">
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {s.muscles.length > 0 && s.priority !== 'good' && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {s.muscles.map((m) => (
                  <span key={m} className="text-xs text-gray-600 bg-gray-900 rounded px-1.5 py-0.5">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
