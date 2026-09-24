import { useState } from 'react';
import type { BodyMapData, Muscle } from '../../hooks/useBodyMap';

interface Props {
  data: BodyMapData;
}

type View = 'front' | 'back';

// ── Feedback computation ──────────────────────────────────────────────────────

interface Feedback {
  good: string | null;
  bad: string | null;
  capable: string | null;
}

function computeFeedback(
  muscle: Muscle,
  muscleSets: Map<Muscle, number>,
  total: number,
): Feedback {
  const sets = muscleSets.get(muscle) ?? 0;
  const p = total > 0 ? Math.round((sets / total) * 100) : 0;

  const pushSets = (['Chest', 'Shoulders', 'Triceps'] as Muscle[])
    .reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const pullSets = (['Lats', 'Upper Back', 'Biceps', 'Rear Delts'] as Muscle[])
    .reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
  const ppRatio = pullSets > 0 ? pushSets / pullSets : null;

  const quadSets = muscleSets.get('Quads') ?? 0;
  const hamSets = muscleSets.get('Hamstrings') ?? 0;
  const qhRatio = hamSets > 0 ? quadSets / hamSets : null;

  const coreSets = (muscleSets.get('Core') ?? 0) + (muscleSets.get('Hip Flexors') ?? 0);
  const corePct = total > 0 ? Math.round((coreSets / total) * 100) : 0;

  let good: string | null = null;
  let bad: string | null = null;
  let capable: string | null = null;

  switch (muscle) {
    case 'Rear Delts': {
      if (sets === 0) {
        bad = `No rear delt volume across ${total} total sets. Zero posterior shoulder stimulus while anterior chain keeps loading. Risk: shoulder impingement.`;
      } else if (ppRatio !== null && ppRatio > 1.4) {
        bad = `Push/pull is ${ppRatio.toFixed(1)}× — push volume has ${Math.round((ppRatio - 1) * 100)}% more sets than pull. Rear delts are the rotator cuff's primary check on anterior impingement. Risk: shoulder impingement.`;
      } else if (ppRatio !== null) {
        good = `Push/pull ratio ${ppRatio.toFixed(1)}× (${pushSets} push / ${pullSets} pull) — posterior shoulder is keeping pace with anterior load.`;
      }
      break;
    }

    case 'Shoulders': {
      if (ppRatio !== null && ppRatio > 1.4) {
        bad = `Push/pull ratio ${ppRatio.toFixed(1)}× — pressing volume outpaces posterior stabilization by ${Math.round((ppRatio - 1) * 100)}%. Risk: anterior shoulder impingement.`;
      } else if (ppRatio !== null && p >= 8) {
        good = `Push/pull ratio ${ppRatio.toFixed(1)}× and ${p}% volume share — overhead pressing strength is unlikely to be the handstand limiter. Scapular control and balance are.`;
      } else if (ppRatio !== null) {
        good = `Push/pull ratio ${ppRatio.toFixed(1)}× — shoulder complex is within the healthy 0.7–1.4× push/pull range.`;
      }
      break;
    }

    case 'Chest':
    case 'Triceps': {
      if (ppRatio !== null) {
        if (ppRatio > 1.4) {
          bad = `Push/pull ratio ${ppRatio.toFixed(1)}× — ${pushSets} push vs ${pullSets} pull sets. Push is accumulating volume ${Math.round((ppRatio - 1) * 100)}% faster than pull. Risk: anterior shoulder impingement.`;
        } else {
          good = `Push/pull ratio ${ppRatio.toFixed(1)}× (${pushSets} push / ${pullSets} pull) — within the healthy 0.7–1.4× range.`;
        }
      }
      break;
    }

    case 'Lats': {
      if (ppRatio !== null) {
        if (ppRatio <= 1.4) {
          good = `Push/pull ratio ${ppRatio.toFixed(1)}× (${pushSets}/${pullSets} sets) — lat volume is proportional to pressing. Pull-up output is building on a balanced base.`;
        } else {
          bad = `Push/pull ratio ${ppRatio.toFixed(1)}× — pulling muscles are under-trained relative to ${pushSets} push sets. Row and pull frequency needs to increase.`;
        }
      }
      if (sets > 0) {
        capable = `At ${sets} sets (${p}% of volume), lat pulling strength is your primary pull-up driver. Rear delt and rotator cuff stability are the likely limiter for one-arm progressions.`;
      }
      break;
    }

    case 'Upper Back':
    case 'Biceps': {
      if (ppRatio !== null) {
        if (ppRatio <= 1.4) {
          good = `Push/pull ratio ${ppRatio.toFixed(1)}× — pull volume is proportional to push across your training history.`;
        } else {
          bad = `Push/pull ratio ${ppRatio.toFixed(1)}× — pulling muscles are under-trained relative to push volume. ${pushSets} push vs ${pullSets} pull sets.`;
        }
      }
      break;
    }

    case 'Quads': {
      if (hamSets === 0 && quadSets > 0) {
        bad = `${quadSets} quad sets with zero hamstring volume — quad/hamstring ratio is uncapped. Risk: ACL and knee tracking injury.`;
      } else if (qhRatio !== null) {
        if (qhRatio > 2) {
          bad = `Quad/hamstring ratio ${qhRatio.toFixed(1)}× (${quadSets}q / ${hamSets}h sets) — too quad-dominant. Hamstrings carry the ACL load on deceleration. Risk: ACL and knee tracking injury.`;
        } else {
          good = `Quad/hamstring ratio ${qhRatio.toFixed(1)}× (${quadSets}q / ${hamSets}h sets) — within the safe 2× ceiling for knee health.`;
        }
      }
      break;
    }

    case 'Hamstrings': {
      if (qhRatio !== null) {
        if (qhRatio > 2) {
          bad = `Quad/hamstring ratio ${qhRatio.toFixed(1)}× — ${quadSets} quad sets vs ${hamSets} hamstring sets. Sprint deceleration and ACL integrity are primarily hamstring-dependent. Risk: ACL and knee tracking injury.`;
        } else {
          good = `Quad/hamstring ratio ${qhRatio.toFixed(1)}× (${quadSets}q / ${hamSets}h sets) — within the safe 2× ceiling.`;
        }
      } else if (quadSets > 0 && hamSets === 0) {
        bad = `${quadSets} quad sets logged with zero hamstring volume. Risk: ACL and knee tracking injury.`;
      }
      if (sets > 0) {
        capable = `At ${sets} sets (${p}% of volume), posterior-chain output for sprint deceleration and hip hinge is ${qhRatio !== null && qhRatio <= 2 ? 'within healthy range' : 'underdeveloped relative to quad volume'} — the Primal Engine pattern.`;
      }
      break;
    }

    case 'Glutes': {
      const postSets = (['Lower Back', 'Glutes', 'Hamstrings'] as Muscle[])
        .reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
      const anteSets = (['Quads', 'Core', 'Chest'] as Muscle[])
        .reduce((s, m) => s + (muscleSets.get(m) ?? 0), 0);
      if (postSets > 0 && anteSets > 0) {
        const paRatio = anteSets / postSets;
        if (paRatio > 2.5) {
          bad = `Anterior chain (${anteSets} sets) is ${paRatio.toFixed(1)}× posterior chain (${postSets} sets). Jump height and sprint power are primarily posterior-chain — this gap shows up athletically before it shows up in the gym.`;
        } else {
          good = `Anterior/posterior ratio ${paRatio.toFixed(1)}× — posterior chain has adequate representation in your training volume.`;
        }
      }
      if (sets > 0) {
        capable = `At ${sets} sets (${p}% of volume), glute training directly loads the primary hip-extension mechanism — the Primal Engine's jumping and sprinting power source.`;
      }
      break;
    }

    case 'Calves': {
      if (sets === 0) {
        bad = `No calf volume across ${total} total sets. Zero Achilles tendon stimulus. The reactive component of jumping, cutting, and landing has no training base.`;
      } else if (p < 3) {
        bad = `${sets} sets (${p}% of volume) — below 3% of total. The Achilles tendon's elastic energy storage drives reactive ground contact; tendons adapt slowly and need consistent direct work.`;
      } else {
        good = `${sets} sets (${p}%) — calf training has consistent representation in your volume.`;
      }
      if (sets > 0) {
        capable = `At ${sets} sets, calf training directly loads the Achilles tendon-spring mechanism — Spider's reactive takeoff and landing are bottlenecked here before lat or quad strength become the limit.`;
      }
      break;
    }

    case 'Core': {
      if (corePct >= 6) {
        good = `Core + Hip Flexors at ${corePct}% of total volume — within the 6–10% range for calisthenics training.`;
        capable = `At ${corePct}% core/hip flexor volume, the structural base for L-sit and hollow body is present. Handstand balance depends on this ratio staying above 6%.`;
      } else if (coreSets > 0) {
        bad = `Core + Hip Flexors at ${corePct}% — below the 6% floor. Spinal stiffness transfers force between limbs; this gap shows up as a power leak in every compound movement, not as a "weak core" feeling.`;
      } else {
        bad = `No core or hip flexor volume logged. Zero spinal stiffness training stimulus.`;
      }
      break;
    }

    case 'Hip Flexors': {
      const hfPct = total > 0 ? Math.round((sets / total) * 100) : 0;
      if (sets === 0) {
        bad = `No hip flexor volume. Anterior pelvic stability under load has no direct training stimulus — the lumbar spine compensates. Risk: lumbar instability.`;
      } else if (hfPct < 2) {
        bad = `Hip flexors at ${hfPct}% of volume — below 2%. Lumbar-hip stability under load is undertrained. Risk: lumbar instability during heavy overhead and carry work.`;
      } else {
        good = `Hip flexors at ${hfPct}% of volume — anterior pelvic stability has direct training stimulus alongside core work.`;
      }
      break;
    }

    case 'Lower Back': {
      if (sets === 0) {
        bad = `No lower back volume across ${total} total sets. Lumbar stabilization under load has no direct training base. Risk: lumbar disc injury.`;
      } else if (p < 3) {
        bad = `${p}% of volume — below the threshold for lumbar integrity under progressive load. Risk: lumbar disc injury under heavy hinges and carries.`;
      } else {
        good = `${sets} sets (${p}%) — lumbar stabilization has active training stimulus relative to total volume.`;
      }
      break;
    }

    case 'Forearms': {
      if (sets === 0) {
        bad = `No forearm volume. Grip will fail before pulling strength under sustained load — all hanging and climbing goals bottleneck here first. Risk: wrist and elbow tendinopathy.`;
      } else if (p < 2) {
        bad = `${sets} sets (${p}% of volume) — at this ratio, forearm endurance will fail before lat or bicep strength on dead hangs and progressive pull-up loading. Risk: wrist and elbow tendinopathy.`;
      } else {
        good = `${sets} sets (${p}%) — grip and wrist stability have active training stimulus.`;
      }
      if (sets > 0) {
        capable = `At ${sets} sets, forearm training directly loads the Spider constraint — wall-crawling, hanging, and climbing all bottleneck on forearm endurance before anything else fails.`;
      }
      break;
    }

    case 'Traps': {
      if (sets === 0) {
        bad = `No trap volume. Scapular elevation and cervical-thoracic load transfer have no training stimulus — overhead pressing and carrying mechanics suffer.`;
      } else if (p < 2) {
        bad = `${sets} sets (${p}%) — trap volume is below 2%. Scapular winging under overhead load becomes a limiting factor at this ratio.`;
      } else {
        good = `${sets} sets (${p}%) — scapular and cervical stabilization have consistent training volume.`;
      }
      break;
    }
  }

  return { good, bad, capable };
}

// ── Analysis panel (full-width, below SVG row) ───────────────────────────────

function MuscleAnalysis({
  muscle,
  muscleSets,
  total,
}: {
  muscle: Muscle;
  muscleSets: Map<Muscle, number>;
  total: number;
}) {
  const { good, bad, capable } = computeFeedback(muscle, muscleSets, total);
  if (!good && !bad && !capable) return null;

  return (
    <div className="mt-1 space-y-2 pt-3 border-t border-gray-800">
      {good && (
        <div className="flex gap-2 items-start">
          <span className="text-green-500 text-xs font-bold mt-0.5 flex-shrink-0">✓</span>
          <p className="text-xs text-gray-400 leading-relaxed">{good}</p>
        </div>
      )}
      {bad && (
        <div className="flex gap-2 items-start">
          <span className="text-red-500 text-xs font-bold mt-0.5 flex-shrink-0">✗</span>
          <p className="text-xs text-gray-400 leading-relaxed">{bad}</p>
        </div>
      )}
      {capable && (
        <div className="flex gap-2 items-start">
          <span className="text-blue-400 text-xs font-bold mt-0.5 flex-shrink-0">→</span>
          <p className="text-xs text-gray-400 leading-relaxed">{capable}</p>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BodyMap({ data }: Props) {
  const [view, setView] = useState<View>('front');
  const [selected, setSelected] = useState<Muscle | null>(null);

  const { muscleSets, muscleExercises, unmapped } = data;
  const maxSets = Math.max(1, ...Array.from(muscleSets.values()));
  const totalMuscleSets = Math.max(1, Array.from(muscleSets.values()).reduce((a, b) => a + b, 0));

  function pct(muscle: Muscle): number {
    const count = muscleSets.get(muscle) ?? 0;
    return count > 0 ? Math.round((count / totalMuscleSets) * 100) : 0;
  }

  function fill(muscle: Muscle): string {
    const count = muscleSets.get(muscle) ?? 0;
    if (count === 0) return '#1f2937';
    const t = Math.min(1, count / maxSets);
    const r = Math.round(161 + t * 84);
    const g = Math.round(81 + t * 77);
    const b = Math.round(8 + t * 3);
    return `rgb(${r},${g},${b})`;
  }

  function opacity(muscle: Muscle): number {
    const count = muscleSets.get(muscle) ?? 0;
    if (count === 0) return 1;
    return 0.35 + 0.65 * Math.min(1, count / maxSets);
  }

  function regionProps(muscle: Muscle) {
    const isSelected = selected === muscle;
    return {
      style: {
        fill: fill(muscle),
        opacity: opacity(muscle),
        stroke: isSelected ? '#fbbf24' : 'none',
        strokeWidth: isSelected ? 2 : 0,
        cursor: 'pointer',
      },
      onClick: () => setSelected(selected === muscle ? null : muscle),
    };
  }

  function PctLabel({ muscle, x, y, fs = 5 }: { muscle: Muscle; x: number; y: number; fs?: number }) {
    const p = pct(muscle);
    if (p === 0) return null;
    return (
      <text x={x} y={y} textAnchor="middle" fill="white" fontSize={fs} fontWeight="700" pointerEvents="none" opacity="0.9">
        {p}%
      </text>
    );
  }

  const selectedCount = selected ? (muscleSets.get(selected) ?? 0) : 0;
  const selectedExercises = selected ? (muscleExercises.get(selected) ?? []) : [];

  return (
    <div className="space-y-4">
      {/* Front/Back toggle */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        {(['front', 'back'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 h-8 rounded-md text-xs font-medium capitalize transition-colors ${
              view === v ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex gap-4 items-start">
        {/* SVG Body */}
        <div className="flex-shrink-0">
          <svg viewBox="0 0 120 250" className="w-32" style={{ display: 'block' }}>
            {/* Head */}
            <circle cx="60" cy="17" r="14" fill="#374151" />
            {/* Neck */}
            <rect x="55" y="30" width="10" height="8" fill="#374151" />

            {view === 'front' && <>
              {/* Shoulders */}
              <rect x="24" y="40" width="22" height="18" rx="5" {...regionProps('Shoulders')} />
              <rect x="74" y="40" width="22" height="18" rx="5" {...regionProps('Shoulders')} />
              {/* Chest */}
              <rect x="38" y="40" width="44" height="32" rx="6" {...regionProps('Chest')} />
              {/* Biceps */}
              <rect x="20" y="60" width="17" height="30" rx="5" {...regionProps('Biceps')} />
              <rect x="83" y="60" width="17" height="30" rx="5" {...regionProps('Biceps')} />
              {/* Forearms */}
              <rect x="16" y="92" width="15" height="26" rx="4" {...regionProps('Forearms')} />
              <rect x="89" y="92" width="15" height="26" rx="4" {...regionProps('Forearms')} />
              {/* Core */}
              <rect x="40" y="74" width="40" height="38" rx="5" {...regionProps('Core')} />
              {/* Hip Flexors */}
              <rect x="40" y="114" width="40" height="16" rx="4" {...regionProps('Hip Flexors')} />
              {/* Quads */}
              <rect x="36" y="132" width="22" height="50" rx="6" {...regionProps('Quads')} />
              <rect x="62" y="132" width="22" height="50" rx="6" {...regionProps('Quads')} />
              {/* Calves */}
              <rect x="36" y="184" width="20" height="38" rx="5" {...regionProps('Calves')} />
              <rect x="64" y="184" width="20" height="38" rx="5" {...regionProps('Calves')} />

              {/* ── Labels ── */}
              <PctLabel muscle="Shoulders" x={35} y={51} fs={5} />
              <PctLabel muscle="Shoulders" x={85} y={51} fs={5} />
              <text x="60" y="57" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="600" pointerEvents="none">Chest</text>
              <PctLabel muscle="Chest" x={60} y={65} fs={5.5} />
              <PctLabel muscle="Biceps" x={28} y={76} fs={5} />
              <PctLabel muscle="Biceps" x={91} y={76} fs={5} />
              <PctLabel muscle="Forearms" x={23} y={107} fs={4.5} />
              <PctLabel muscle="Forearms" x={96} y={107} fs={4.5} />
              <text x="60" y="93" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="600" pointerEvents="none">Core</text>
              <PctLabel muscle="Core" x={60} y={101} fs={5.5} />
              <PctLabel muscle="Hip Flexors" x={60} y={123} fs={4.5} />
              <text x="47" y="157" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Quad</text>
              <PctLabel muscle="Quads" x={47} y={164} fs={5.5} />
              <text x="73" y="157" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Quad</text>
              <PctLabel muscle="Quads" x={73} y={164} fs={5.5} />
              <PctLabel muscle="Calves" x={46} y={205} fs={5} />
              <PctLabel muscle="Calves" x={74} y={205} fs={5} />
            </>}

            {view === 'back' && <>
              {/* Rear Delts */}
              <rect x="24" y="40" width="22" height="18" rx="5" {...regionProps('Rear Delts')} />
              <rect x="74" y="40" width="22" height="18" rx="5" {...regionProps('Rear Delts')} />
              {/* Traps */}
              <rect x="38" y="40" width="44" height="22" rx="5" {...regionProps('Traps')} />
              {/* Upper Back */}
              <rect x="40" y="62" width="40" height="30" rx="5" {...regionProps('Upper Back')} />
              {/* Lats */}
              <rect x="28" y="62" width="20" height="40" rx="5" {...regionProps('Lats')} />
              <rect x="72" y="62" width="20" height="40" rx="5" {...regionProps('Lats')} />
              {/* Triceps */}
              <rect x="20" y="60" width="17" height="30" rx="5" {...regionProps('Triceps')} />
              <rect x="83" y="60" width="17" height="30" rx="5" {...regionProps('Triceps')} />
              {/* Forearms */}
              <rect x="16" y="92" width="15" height="26" rx="4" {...regionProps('Forearms')} />
              <rect x="89" y="92" width="15" height="26" rx="4" {...regionProps('Forearms')} />
              {/* Lower Back */}
              <rect x="40" y="94" width="40" height="22" rx="4" {...regionProps('Lower Back')} />
              {/* Glutes */}
              <rect x="37" y="118" width="22" height="28" rx="6" {...regionProps('Glutes')} />
              <rect x="61" y="118" width="22" height="28" rx="6" {...regionProps('Glutes')} />
              {/* Hamstrings */}
              <rect x="37" y="148" width="22" height="48" rx="6" {...regionProps('Hamstrings')} />
              <rect x="61" y="148" width="22" height="48" rx="6" {...regionProps('Hamstrings')} />
              {/* Calves */}
              <rect x="37" y="198" width="20" height="34" rx="5" {...regionProps('Calves')} />
              <rect x="63" y="198" width="20" height="34" rx="5" {...regionProps('Calves')} />

              {/* ── Labels ── */}
              <PctLabel muscle="Rear Delts" x={35} y={51} fs={5} />
              <PctLabel muscle="Rear Delts" x={85} y={51} fs={5} />
              <text x="60" y="50" textAnchor="middle" fill="white" fontSize="6" fontWeight="600" pointerEvents="none">Traps</text>
              <PctLabel muscle="Traps" x={60} y={57} fs={5.5} />
              <text x="60" y="76" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="600" pointerEvents="none">U.Back</text>
              <PctLabel muscle="Upper Back" x={60} y={83} fs={5.5} />
              <PctLabel muscle="Lats" x={38} y={84} fs={5} />
              <PctLabel muscle="Lats" x={82} y={84} fs={5} />
              <PctLabel muscle="Triceps" x={28} y={76} fs={5} />
              <PctLabel muscle="Triceps" x={91} y={76} fs={5} />
              <PctLabel muscle="Forearms" x={23} y={107} fs={4.5} />
              <PctLabel muscle="Forearms" x={96} y={107} fs={4.5} />
              <text x="60" y="104" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Lower Back</text>
              <PctLabel muscle="Lower Back" x={60} y={111} fs={5.5} />
              <text x="48" y="131" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Glute</text>
              <PctLabel muscle="Glutes" x={48} y={138} fs={5.5} />
              <text x="72" y="131" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Glute</text>
              <PctLabel muscle="Glutes" x={72} y={138} fs={5.5} />
              <PctLabel muscle="Hamstrings" x={48} y={173} fs={5} />
              <PctLabel muscle="Hamstrings" x={72} y={173} fs={5} />
              <PctLabel muscle="Calves" x={47} y={217} fs={5} />
              <PctLabel muscle="Calves" x={73} y={217} fs={5} />
            </>}
          </svg>
        </div>

        {/* Compact sidebar: name + set count + exercise list */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-400">{selected}</span>
                <div className="text-right">
                  <span className="text-xs text-gray-400">{selectedCount} sets</span>
                  {pct(selected) > 0 && (
                    <span className="text-xs text-amber-500 ml-2 font-semibold">{pct(selected)}%</span>
                  )}
                </div>
              </div>
              {selectedExercises.length === 0 ? (
                <p className="text-xs text-gray-600">No exercises mapped yet.</p>
              ) : (
                <ul className="space-y-1">
                  {selectedExercises.map((ex) => (
                    <li key={ex} className="text-xs text-gray-300 truncate">{ex}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-600 pt-2">
              Tap a region to see exercises
            </div>
          )}
        </div>
      </div>

      {/* Full-width analysis panel — appears below SVG row when a muscle is selected */}
      {selected && (
        <MuscleAnalysis
          muscle={selected}
          muscleSets={muscleSets}
          total={totalMuscleSets}
        />
      )}

      {/* Colour scale legend */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const r = Math.round(161 + t * 84);
          const g = Math.round(81 + t * 77);
          const b = Math.round(8 + t * 3);
          return (
            <span
              key={t}
              className="w-5 h-3 rounded-sm"
              style={{ backgroundColor: t === 0 ? '#1f2937' : `rgb(${r},${g},${b})`, opacity: t === 0 ? 1 : 0.35 + 0.65 * t }}
            />
          );
        })}
        <span className="text-xs text-gray-600">More</span>
      </div>

      {/* Unmapped exercises */}
      {unmapped.length > 0 && (
        <details className="group">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 flex items-center gap-1 list-none">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {unmapped.length} unmapped exercise{unmapped.length !== 1 ? 's' : ''}
          </summary>
          <div className="mt-2 text-xs text-gray-600 space-y-0.5 pl-4">
            {unmapped.map((ex) => <div key={ex}>{ex}</div>)}
          </div>
        </details>
      )}
    </div>
  );
}
