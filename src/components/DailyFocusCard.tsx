import type { BodyMapData, Muscle } from '../hooks/useBodyMap';
import { MUSCLE_META, STRUCTURAL_ORDER, programPhase } from '../config/muscleMetadata';

interface Props {
  bodyMap: BodyMapData;
  week: number;
}

const PUSH_MUSCLES: Muscle[] = ['Chest', 'Shoulders', 'Triceps'];
const PULL_MUSCLES: Muscle[] = ['Lats', 'Upper Back', 'Biceps', 'Rear Delts'];

export default function DailyFocusCard({ bodyMap, week }: Props) {
  const { muscleSets } = bodyMap;
  const total = Math.max(1, Array.from(muscleSets.values()).reduce((a, b) => a + b, 0));
  const pct = (m: Muscle) => Math.round(((muscleSets.get(m) ?? 0) / total) * 100);

  // Focus: first structural muscle below 8% of volume
  const focusMuscle = STRUCTURAL_ORDER.find((m) => pct(m) < 8);

  // Push/pull (used for imbalance fallback and stabilizer context)
  const pushVol = PUSH_MUSCLES.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const pullVol = PULL_MUSCLES.reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const ppRatio = pullVol > 0 ? pushVol / pullVol : null;
  const imbalance = ppRatio !== null && ppRatio > 1.4 ? 'pull'
    : ppRatio !== null && ppRatio < 0.7 ? 'push'
    : null;

  // Top mover (for mover gap template): highest-% muscle with role=mover, excluding focus
  const topMover = (Object.entries(MUSCLE_META) as [Muscle, typeof MUSCLE_META[Muscle]][])
    .filter(([m, v]) => v.role === 'mover' && m !== focusMuscle && (muscleSets.get(m) ?? 0) > 0)
    .sort(([a], [b]) => (muscleSets.get(b) ?? 0) - (muscleSets.get(a) ?? 0))[0] ?? null;

  const phase = programPhase(week);
  const focusMeta = focusMuscle ? MUSCLE_META[focusMuscle] : null;
  const focusPct = focusMuscle ? pct(focusMuscle) : 0;

  function renderBody() {
    if (focusMuscle && focusMeta) {
      if (focusMeta.role === 'stabilizer') {
        return (
          <p className="text-xs text-gray-400 leading-relaxed">
            {focusMuscle} is at {focusPct}% of volume — the lowest tracked structural muscle.
            It stabilizes {focusMeta.fn} rather than producing movement, so a gap here shows
            up as {focusMeta.upstreamEffect ?? 'reduced structural integrity'} before it shows
            up as weakness in {focusMuscle} itself. Per your Structure principle (slow,
            controlled reps build tendon integrity and joint stability), this is exactly the
            kind of gap that's invisible until something else breaks.
          </p>
        );
      }
      // mover template
      const topName = topMover?.[0] ?? null;
      const topPct = topName ? pct(topName) : null;
      return (
        <p className="text-xs text-gray-400 leading-relaxed">
          {focusMuscle} is at {focusPct}% of volume — the lowest tracked.
          It drives {focusMeta.fn}.
          {topName && topPct !== null
            ? ` Compare to your highest-volume mover: ${topName} at ${topPct}% — that ${focusPct}% vs ${topPct}% gap is a real output disparity, not a structural concern.`
            : ''}
        </p>
      );
    }

    if (imbalance && ppRatio !== null) {
      const side = imbalance === 'pull' ? 'push-heavy' : 'pull-heavy';
      const addSide = imbalance;
      return (
        <p className="text-xs text-gray-400 leading-relaxed">
          Push/pull ratio is {ppRatio.toFixed(1)}× ({pushVol} push vs {pullVol} pull sets) —
          outside the healthy 0.7–1.4× range, {side}.
          {imbalance === 'pull'
            ? ` Push muscles are accumulating volume ${ppRatio.toFixed(1)}× faster than pull counterparts. Left unchecked, this loads the anterior shoulder without the posterior stability to match it.`
            : ` Pull muscles are outpacing push by ${(1 / ppRatio).toFixed(1)}×. Add pressing work to restore symmetry.`}
          {' '}Lean into {addSide} movements today.
        </p>
      );
    }

    return (
      <p className="text-xs text-gray-400 leading-relaxed">
        {ppRatio !== null
          ? `Push/pull ratio is ${ppRatio.toFixed(1)}× (${pushVol} push · ${pullVol} pull sets) — within the healthy 0.7–1.4× range. `
          : ''}
        No structural muscle is below 8% of volume. Focus on quality and progressive overload.
      </p>
    );
  }

  function renderWeekTip() {
    const phaseName = phase.name;
    const phaseDesc = phase.desc;

    let muscleNote = '';
    if (focusMuscle && focusMeta) {
      if (focusMeta.alterEgo === phaseName) {
        muscleNote = ` ${focusMuscle} is a ${focusMeta.alterEgo}-phase muscle — directly in scope this phase.`;
      } else {
        muscleNote = ` ${focusMuscle} is a ${focusMeta.alterEgo}-phase muscle — this gap carries more structural risk the further you are from its primary phase.`;
      }
    }

    return (
      <p className="text-xs text-gray-500 leading-relaxed">
        <span className="font-medium text-gray-400">Wk {week} · {phaseName}</span>
        {' — '}{phaseDesc}.{muscleNote}
      </p>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's focus</p>

      {focusMuscle && focusMeta ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-amber-400">{focusMuscle}</span>
            <span className="text-xs text-gray-600">{focusPct}% of volume</span>
            <span className="text-xs text-gray-700">·</span>
            <span className="text-xs text-gray-600">{focusMeta.alterEgo}</span>
            <span className="text-xs text-gray-700">·</span>
            <span className="text-xs text-gray-600">{focusMeta.role}</span>
          </div>
          {renderBody()}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {focusMeta.exercises.map((ex) => (
              <span key={ex} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">{ex}</span>
            ))}
          </div>
        </div>
      ) : imbalance && ppRatio !== null ? (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-amber-400">
              {imbalance === 'pull' ? 'Push-heavy' : 'Pull-heavy'} imbalance
            </span>
            <span className="text-xs text-gray-600">{ppRatio.toFixed(1)}× ratio</span>
          </div>
          {renderBody()}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-green-400">No major gaps detected</p>
          {renderBody()}
        </div>
      )}

      <div className="border-t border-gray-800 pt-3">
        {renderWeekTip()}
      </div>
    </div>
  );
}
