import { useState } from 'react';
import type { BodyMapData, Muscle } from '../../hooks/useBodyMap';

interface Props {
  data: BodyMapData;
}

type View = 'front' | 'back';

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

  // Render a % label; returns null if muscle has 0 sets
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
              {/* Shoulders */}
              <PctLabel muscle="Shoulders" x={35} y={51} fs={5} />
              <PctLabel muscle="Shoulders" x={85} y={51} fs={5} />
              {/* Chest */}
              <text x="60" y="57" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="600" pointerEvents="none">Chest</text>
              <PctLabel muscle="Chest" x={60} y={65} fs={5.5} />
              {/* Biceps */}
              <PctLabel muscle="Biceps" x={28} y={76} fs={5} />
              <PctLabel muscle="Biceps" x={91} y={76} fs={5} />
              {/* Forearms */}
              <PctLabel muscle="Forearms" x={23} y={107} fs={4.5} />
              <PctLabel muscle="Forearms" x={96} y={107} fs={4.5} />
              {/* Core */}
              <text x="60" y="93" textAnchor="middle" fill="white" fontSize="6.5" fontWeight="600" pointerEvents="none">Core</text>
              <PctLabel muscle="Core" x={60} y={101} fs={5.5} />
              {/* Hip Flexors */}
              <PctLabel muscle="Hip Flexors" x={60} y={123} fs={4.5} />
              {/* Quads */}
              <text x="47" y="157" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Quad</text>
              <PctLabel muscle="Quads" x={47} y={164} fs={5.5} />
              <text x="73" y="157" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Quad</text>
              <PctLabel muscle="Quads" x={73} y={164} fs={5.5} />
              {/* Calves */}
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
              {/* Rear Delts */}
              <PctLabel muscle="Rear Delts" x={35} y={51} fs={5} />
              <PctLabel muscle="Rear Delts" x={85} y={51} fs={5} />
              {/* Traps */}
              <text x="60" y="50" textAnchor="middle" fill="white" fontSize="6" fontWeight="600" pointerEvents="none">Traps</text>
              <PctLabel muscle="Traps" x={60} y={57} fs={5.5} />
              {/* Upper Back */}
              <text x="60" y="76" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="600" pointerEvents="none">U.Back</text>
              <PctLabel muscle="Upper Back" x={60} y={83} fs={5.5} />
              {/* Lats */}
              <PctLabel muscle="Lats" x={38} y={84} fs={5} />
              <PctLabel muscle="Lats" x={82} y={84} fs={5} />
              {/* Triceps */}
              <PctLabel muscle="Triceps" x={28} y={76} fs={5} />
              <PctLabel muscle="Triceps" x={91} y={76} fs={5} />
              {/* Forearms */}
              <PctLabel muscle="Forearms" x={23} y={107} fs={4.5} />
              <PctLabel muscle="Forearms" x={96} y={107} fs={4.5} />
              {/* Lower Back */}
              <text x="60" y="104" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Lower Back</text>
              <PctLabel muscle="Lower Back" x={60} y={111} fs={5.5} />
              {/* Glutes */}
              <text x="48" y="131" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Glute</text>
              <PctLabel muscle="Glutes" x={48} y={138} fs={5.5} />
              <text x="72" y="131" textAnchor="middle" fill="white" fontSize="5.5" pointerEvents="none">Glute</text>
              <PctLabel muscle="Glutes" x={72} y={138} fs={5.5} />
              {/* Hamstrings */}
              <PctLabel muscle="Hamstrings" x={48} y={173} fs={5} />
              <PctLabel muscle="Hamstrings" x={72} y={173} fs={5} />
              {/* Calves */}
              <PctLabel muscle="Calves" x={47} y={217} fs={5} />
              <PctLabel muscle="Calves" x={73} y={217} fs={5} />
            </>}
          </svg>
        </div>

        {/* Selected muscle info */}
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

      {/* Unmapped exercises (collapsible) */}
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
