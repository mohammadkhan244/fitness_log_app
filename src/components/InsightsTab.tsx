import type { BodyMapData, Muscle } from '../hooks/useBodyMap';
import { MUSCLE_LIST } from '../hooks/useBodyMap';
import type { DashboardData } from '../hooks/useDashboardData';

interface Props {
  bodyMap: BodyMapData;
  dashboard: DashboardData;
}

type Priority = 'high' | 'medium' | 'low' | 'good';

interface Suggestion {
  priority: Priority;
  title: string;
  detail: string;
  muscles: Muscle[];
  exercises?: string[];
}

// Exercises from the program to suggest per muscle group
const SUGGESTED_EXERCISES: Partial<Record<Muscle, string[]>> = {
  Shoulders:    ['Handstand practice', 'Pike push-ups', 'OHP / Sandbag military press'],
  Chest:        ['Dips', 'Push-up variations', 'Slow dips'],
  Triceps:      ['Dip bar tricep extensions', 'Tricep pushdowns', 'Diamond push-ups'],
  Biceps:       ['Pull-ups', 'Chinups', 'TRX / ring rows'],
  Forearms:     ['Dead hang L-sit', 'Farmer carries', 'Dead hangs'],
  Core:         ['Hollow body holds', 'L-sit hold', 'Planks', 'Russian twists'],
  Lats:         ['Pull-ups (weighted)', 'Lat pulldowns', 'Ring rows'],
  'Upper Back': ['Full body inverted rows', 'Cable rows', 'TRX rows'],
  Traps:        ['Face pulls', 'Band pull-aparts', 'Shrugs'],
  'Rear Delts': ['Reverse flys', 'Face pulls', 'Band pull-aparts'],
  'Lower Back': ['Jefferson curl', 'Good mornings', 'Bird dog', 'Superman'],
  'Hip Flexors':['Psoas leg raises', 'Hanging knee raises', 'Mountain climbers'],
  Glutes:       ['Single-leg glute bridges', 'Bulgarian split squats', 'Hip thrusts'],
  Quads:        ['Squats', 'Bulgarian split squats', 'Sissy squats', 'Lunges'],
  Hamstrings:   ['Nordic curls', 'Single-leg RDLs', 'Lying / band leg curls'],
  Calves:       ['Calf raises', 'Single-leg calf raises', 'Jump rope', 'Sprint protocol'],
};

function generateSuggestions(
  muscleSets: Map<Muscle, number>,
  totalSets: number,
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  if (totalSets === 0) return suggestions;

  const volumeByMuscle = MUSCLE_LIST.map((m) => ({ m, sets: muscleSets.get(m) ?? 0 }));
  const trained = volumeByMuscle.filter((x) => x.sets > 0);
  const avg = trained.length > 0 ? trained.reduce((s, x) => s + x.sets, 0) / trained.length : 0;

  // ── 1. Never trained ────────────────────────────────────────────────────────
  const untrained = volumeByMuscle.filter((x) => x.sets === 0).map((x) => x.m);
  if (untrained.length > 0) {
    // Split into structural-important vs aesthetic
    const structural: Muscle[] = ['Lower Back', 'Rear Delts', 'Traps', 'Hamstrings', 'Hip Flexors'];
    const highPriority = untrained.filter((m) => structural.includes(m));
    if (highPriority.length > 0) {
      suggestions.push({
        priority: 'high',
        title: `${highPriority.length} structural group${highPriority.length > 1 ? 's' : ''} with no data`,
        detail: highPriority.join(', '),
        muscles: highPriority,
        exercises: highPriority.flatMap((m) => (SUGGESTED_EXERCISES[m] ?? []).slice(0, 1)),
      });
    }
    const rest = untrained.filter((m) => !structural.includes(m));
    if (rest.length > 0) {
      suggestions.push({
        priority: 'medium',
        title: `${rest.length} muscle group${rest.length > 1 ? 's' : ''} with no sets logged`,
        detail: rest.join(', '),
        muscles: rest,
      });
    }
  }

  // ── 2. Push / Pull balance ───────────────────────────────────────────────────
  const pushMuscles: Muscle[] = ['Chest', 'Triceps', 'Shoulders'];
  const pullMuscles: Muscle[] = ['Lats', 'Upper Back', 'Biceps', 'Rear Delts'];
  const pushSets = pushMuscles.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const pullSets = pullMuscles.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);

  if (pushSets > 0 && pullSets > 0) {
    const ratio = pushSets / pullSets;
    if (ratio > 1.4) {
      suggestions.push({
        priority: 'high',
        title: `Push-heavy: ${ratio.toFixed(1)}× more push than pull`,
        detail: `Push: ${pushSets} sets · Pull: ${pullSets} sets. Heavy push-dominant training strains shoulder joints over time.`,
        muscles: ['Lats', 'Upper Back', 'Rear Delts'],
        exercises: ['Pull-ups (weighted)', 'Full body inverted rows', 'Face pulls', 'Ring rows'],
      });
    } else if (ratio < 0.7) {
      suggestions.push({
        priority: 'medium',
        title: `Pull-heavy: ${(1 / ratio).toFixed(1)}× more pull than push`,
        detail: `Pull: ${pullSets} sets · Push: ${pushSets} sets. Balance with more pressing work.`,
        muscles: ['Chest', 'Triceps', 'Shoulders'],
        exercises: ['Dips', 'Push-up variations', 'OHP / Pike push-ups'],
      });
    } else {
      suggestions.push({
        priority: 'good',
        title: `Push/pull ratio looks solid (${ratio.toFixed(1)}×)`,
        detail: `Push: ${pushSets} sets · Pull: ${pullSets} sets. Stay within 0.7–1.4× range.`,
        muscles: [...pushMuscles, ...pullMuscles],
      });
    }
  }

  // ── 3. Quad / Hamstring balance ──────────────────────────────────────────────
  const quadSets = muscleSets.get('Quads') ?? 0;
  const hamSets = muscleSets.get('Hamstrings') ?? 0;

  if (quadSets > 0 && hamSets > 0) {
    const ratio = quadSets / hamSets;
    if (ratio > 2) {
      suggestions.push({
        priority: 'high',
        title: `Quad-dominant legs (${ratio.toFixed(1)}× quads vs hamstrings)`,
        detail: `Quads: ${quadSets} sets · Hamstrings: ${hamSets} sets. This ratio is a common cause of knee and lower-back issues.`,
        muscles: ['Hamstrings', 'Lower Back'],
        exercises: ['Nordic curls', 'Single-leg RDLs', 'Good mornings', 'Band leg curls'],
      });
    } else if (ratio < 0.6) {
      suggestions.push({
        priority: 'medium',
        title: `Hamstring-dominant legs`,
        detail: `Hamstrings: ${hamSets} sets · Quads: ${quadSets} sets. Add more squat variations.`,
        muscles: ['Quads'],
        exercises: ['Bulgarian split squats', 'Squats', 'Sissy squats'],
      });
    } else {
      suggestions.push({
        priority: 'good',
        title: 'Quad/hamstring balance is healthy',
        detail: `Quads: ${quadSets} · Hamstrings: ${hamSets} sets. Tendon-first programs love this.`,
        muscles: ['Quads', 'Hamstrings'],
      });
    }
  }

  // ── 4. Posterior chain ───────────────────────────────────────────────────────
  const posteriorMuscles: Muscle[] = ['Lower Back', 'Glutes', 'Hamstrings'];
  const posteriorSets = posteriorMuscles.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const anteriorMuscles: Muscle[] = ['Quads', 'Core', 'Chest'];
  const anteriorSets = anteriorMuscles.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);

  if (posteriorSets > 0 && anteriorSets > posteriorSets * 2.5) {
    suggestions.push({
      priority: 'medium',
      title: 'Weak posterior chain relative to anterior',
      detail: `Anterior (quads/core/chest): ${anteriorSets} sets · Posterior (hamstrings/glutes/lower back): ${posteriorSets} sets.`,
      muscles: ['Lower Back', 'Glutes', 'Hamstrings'],
      exercises: ['Jefferson curl', 'Single-leg glute bridges', 'Good mornings', 'Nordic curls'],
    });
  }

  // ── 5. Core volume ───────────────────────────────────────────────────────────
  const coreSets = (muscleSets.get('Core') ?? 0) + (muscleSets.get('Hip Flexors') ?? 0);
  const corePct = totalSets > 0 ? coreSets / totalSets : 0;

  if (trained.length > 4 && corePct < 0.06) {
    suggestions.push({
      priority: 'medium',
      title: 'Low core work',
      detail: `Core + Hip Flexors are ${Math.round(corePct * 100)}% of total sets — below the 6–10% range typical for calisthenics.`,
      muscles: ['Core', 'Hip Flexors'],
      exercises: ['Hollow body holds', 'L-sit hold', 'Planks', 'Dragon flag progressions'],
    });
  }

  // ── 6. Neglected structural muscles ─────────────────────────────────────────
  const neglected: Array<{ m: Muscle; threshold: number }> = [
    { m: 'Lower Back', threshold: avg * 0.25 },
    { m: 'Rear Delts', threshold: avg * 0.2 },
    { m: 'Calves', threshold: avg * 0.2 },
    { m: 'Forearms', threshold: avg * 0.15 },
  ];

  for (const { m, threshold } of neglected) {
    const sets = muscleSets.get(m) ?? 0;
    if (sets > 0 && sets < threshold) {
      suggestions.push({
        priority: 'low',
        title: `Low ${m} volume (${sets} sets)`,
        detail: `Only ${Math.round((sets / avg) * 100)}% of your average muscle volume. Often overlooked but high-impact.`,
        muscles: [m],
        exercises: (SUGGESTED_EXERCISES[m] ?? []).slice(0, 2),
      });
    }
  }

  return suggestions;
}

const PRIORITY_STYLE: Record<Priority, { badge: string; border: string; label: string }> = {
  high:   { badge: 'bg-red-900/60 text-red-300',    border: 'border-red-900/50',    label: 'Fix' },
  medium: { badge: 'bg-amber-900/60 text-amber-300', border: 'border-amber-900/50', label: 'Watch' },
  low:    { badge: 'bg-gray-800 text-gray-400',      border: 'border-gray-800',      label: 'Tip' },
  good:   { badge: 'bg-green-900/60 text-green-300', border: 'border-green-900/50', label: '✓ Good' },
};

export default function InsightsTab({ bodyMap, dashboard }: Props) {
  const { muscleSets } = bodyMap;

  if (dashboard.loading) {
    return <p className="text-xs text-gray-600 py-4 text-center">Loading…</p>;
  }
  if (dashboard.totalSets === 0) {
    return (
      <p className="text-xs text-gray-600 py-4 text-center">
        No data yet — import from Notion or log a session to see insights.
      </p>
    );
  }

  const suggestions = generateSuggestions(muscleSets, dashboard.totalSets);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Based on {dashboard.totalSets.toLocaleString()} sets across {dashboard.weeks.filter(w => w.totalSets > 0).length} weeks.
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

      {suggestions.length === 0 && (
        <div className="border border-green-900/50 rounded-xl p-4">
          <p className="text-sm text-green-300 font-medium">Training looks balanced 💪</p>
          <p className="text-xs text-gray-400 mt-1">No major imbalances detected. Keep logging to get more specific feedback.</p>
        </div>
      )}
    </div>
  );
}
