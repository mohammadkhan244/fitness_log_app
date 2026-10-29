import { useEffect, useRef, useState } from 'react';
import { useCapabilities } from '../hooks/useCapabilities';
import { NEGATIVE_SIGNAL_KEYWORDS } from '../config/capabilityConfig';
import type { CapabilityResult, CapabilityStatus } from '../hooks/useCapabilities';
import type { ExerciseSet } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatValue(value?: number, unit?: string, load?: number): string {
  const parts: string[] = [];
  if (value != null && unit && unit !== 'none') {
    const u =
      unit === 'seconds'      ? 'sec' :
      unit === 'minutes'      ? 'min' :
      unit === 'reps_per_leg' ? 'reps/leg' :
      unit === 'reps_total'   ? 'reps' :
      unit === 'miles'        ? 'mi' :
      unit;
    parts.push(`${value} ${u}`);
  }
  if (load != null) parts.push(`${load} lbs`);
  return parts.join(' · ') || '';
}

function setHasNegativeSignal(set: ExerciseSet): boolean {
  const text = ((set.notes ?? '') + ' ' + (set.detail ?? '')).toLowerCase();
  return NEGATIVE_SIGNAL_KEYWORDS.some((kw) => text.includes(kw));
}

const CATEGORY_BADGE: Partial<Record<string, string>> = {
  'Fast Tempo': 'bg-blue-900/60 text-blue-300',
  'Slow Tempo': 'bg-purple-900/60 text-purple-300',
  'Skills':     'bg-cyan-900/60 text-cyan-300',
  'Guardian':   'bg-green-900/60 text-green-300',
  'Benchmark':  'bg-amber-900/60 text-amber-300',
  'Cardio':               'bg-pink-900/60 text-pink-300',
  'Overcoming Isometric': 'bg-orange-900/60 text-orange-300',
  'General':              'bg-gray-800 text-gray-400',
  'Rest/Chaos': 'bg-gray-800 text-gray-500',
};

// ─── SetRow ───────────────────────────────────────────────────────────────────

function SetRow({
  set,
  kindLabel,
  highlight,
}: {
  set: ExerciseSet;
  kindLabel?: string;
  highlight?: boolean;
}) {
  const val = formatValue(set.value, set.unit, set.load);
  const catStyle = CATEGORY_BADGE[set.category] ?? 'bg-gray-800 text-gray-400';

  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1 border-b border-gray-800/50 last:border-0 ${highlight ? 'bg-amber-950/20 -mx-1 px-1 rounded' : ''}`}>
      <span className="text-xs text-gray-500 w-14 flex-shrink-0">{formatDate(set.date)}</span>
      {kindLabel && (
        <span className="text-xs text-gray-600 italic flex-shrink-0">{kindLabel}</span>
      )}
      <span className="text-xs text-gray-300 flex-shrink-0">{set.exercise}</span>
      <span className={`text-xs px-1.5 py-0 rounded flex-shrink-0 ${catStyle}`}>{set.category}</span>
      {val && <span className="text-xs text-gray-500">{val}</span>}
      {(set.notes || set.detail) && (
        <span className={`text-xs w-full pl-16 leading-relaxed ${highlight ? 'text-amber-300/80' : 'text-gray-600'}`}>
          {set.notes || set.detail}
        </span>
      )}
    </div>
  );
}

// ─── EvidencePanel ────────────────────────────────────────────────────────────

function EvidencePanel({ result }: { result: CapabilityResult }) {
  const { capability, status, demoSets, buildSets, flagSet } = result;

  if (status === 'confirmed-transfer') {
    type Entry = { kind: 'Demo' | 'Build'; set: ExerciseSet };
    const timeline: Entry[] = [
      ...demoSets.map((s) => ({ kind: 'Demo' as const, set: s })),
      ...buildSets.map((s) => ({ kind: 'Build' as const, set: s })),
    ].sort((a, b) => b.set.date.localeCompare(a.set.date));

    return (
      <div>
        <p className="text-xs text-gray-500 mb-2">Timeline — {ROLLING_WINDOW_LABEL}</p>
        {timeline.map((e, i) => (
          <SetRow key={i} set={e.set} kindLabel={e.kind} />
        ))}
      </div>
    );
  }

  if (status === 'flagged') {
    return (
      <div className="space-y-3">
        {flagSet && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Triggering entry</p>
            <SetRow set={flagSet} highlight />
          </div>
        )}
        {demoSets.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-1">All activity — {ROLLING_WINDOW_LABEL}</p>
            {[...demoSets]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((s, i) => (
                <SetRow key={i} set={s} highlight={setHasNegativeSignal(s)} />
              ))}
          </div>
        )}
      </div>
    );
  }

  if (status === 'demonstrated') {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-2">Evidence — {ROLLING_WINDOW_LABEL}</p>
        {[...demoSets]
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((s, i) => (
            <SetRow key={i} set={s} />
          ))}
      </div>
    );
  }

  if (status === 'building') {
    const emptyDemo = capability.demonstratedBy.length === 0;
    return (
      <div className="space-y-3">
        {buildSets.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Built toward — {ROLLING_WINDOW_LABEL}</p>
            {[...buildSets]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((s, i) => (
                <SetRow key={i} set={s} />
              ))}
          </div>
        )}
        {emptyDemo && capability.emptyDemoNote && (
          <p className="text-xs text-gray-500 leading-relaxed">{capability.emptyDemoNote}</p>
        )}
      </div>
    );
  }

  return null;
}

const ROLLING_WINDOW_LABEL = 'last 12 weeks';

// ─── Styles ───────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<CapabilityStatus, { border: string; badge: string; label: string }> = {
  demonstrated: {
    border: 'border-gray-700',
    badge: 'bg-gray-800 text-gray-300',
    label: 'Demonstrated',
  },
  building: {
    border: 'border-blue-900/60',
    badge: 'bg-blue-900/50 text-blue-300',
    label: 'Building',
  },
  'confirmed-transfer': {
    border: 'border-indigo-600/50',
    badge: 'bg-indigo-900/70 text-indigo-200',
    label: 'Confirmed transfer',
  },
  flagged: {
    border: 'border-amber-900/50',
    badge: 'bg-amber-900/60 text-amber-300',
    label: 'Flagged',
  },
  untested: {
    border: 'border-gray-800',
    badge: 'bg-gray-900 text-gray-500',
    label: 'Untested',
  },
};

function collapsedDetail(result: CapabilityResult): { text: string; color: string } {
  const { status, lastCleanDate, flagDetail, transferDetail, capability } = result;
  switch (status) {
    case 'demonstrated':
      return {
        text: lastCleanDate ? `Last clean set ${formatDate(lastCleanDate)}.` : '',
        color: 'text-gray-400',
      };
    case 'building':
      return {
        text: capability.buildingNote ?? 'Active investment this window — no demonstration yet.',
        color: 'text-gray-400',
      };
    case 'confirmed-transfer':
      return { text: transferDetail ?? '', color: 'text-indigo-300/90' };
    case 'flagged':
      return { text: flagDetail ?? '', color: 'text-amber-300/80' };
    case 'untested':
      return { text: 'No logged activity this window.', color: 'text-gray-600' };
  }
}

// ─── CapabilityRow ────────────────────────────────────────────────────────────

function CapabilityRow({
  result,
  onNavigateToScience,
  isTarget,
  isNotification,
}: {
  result: CapabilityResult;
  onNavigateToScience?: (id: string) => void;
  isTarget?: boolean;
  isNotification?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(isTarget));
  const refStandardRef = useRef<HTMLDivElement>(null);
  const { capability, status } = result;
  const style = STATUS_STYLE[status];
  const { text: detail, color: detailColor } = collapsedDetail(result);
  const canExpand = status !== 'untested';

  // Auto-open when this card becomes the navigation target
  useEffect(() => {
    if (isTarget && canExpand) setOpen(true);
  }, [isTarget, canExpand]);

  const hasSources = capability.sources && capability.sources.length > 0;
  const hasRefStandard = Boolean(capability.referenceStandard);

  return (
    <div
      id={`capability-${capability.id}`}
      className={`border rounded-xl overflow-hidden ${isNotification ? 'border-red-900/40 ring-1 ring-red-500/30' : style.border}`}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => canExpand && setOpen((o) => !o)}
        className={`w-full p-4 text-left ${canExpand ? 'cursor-pointer active:bg-gray-800/30' : 'cursor-default'}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isNotification && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${style.badge}`}>
              {style.label}
            </span>
            <span className="text-sm font-medium text-gray-200">{capability.name}</span>
          </div>
          {canExpand && (
            <span className="text-xs text-gray-600 flex-shrink-0 ml-2">{open ? '▲' : '▼'}</span>
          )}
        </div>
        {detail && (
          <p className={`text-xs leading-relaxed mt-1.5 ${detailColor}`}>{detail}</p>
        )}
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-gray-800 px-4 pb-4 pt-3 space-y-4">
          {/* Mechanism block — science note + navigation link */}
          {(capability.science || hasSources || hasRefStandard) && (
            <div className="space-y-2">
              {capability.science && (
                <p className="text-xs text-gray-500/90 leading-relaxed">{capability.science}</p>
              )}
              {hasSources ? (
                <button
                  type="button"
                  onClick={() => onNavigateToScience?.(capability.id)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 active:text-indigo-200 transition-colors"
                >
                  Learn the mechanism →
                </button>
              ) : hasRefStandard ? (
                <button
                  type="button"
                  onClick={() =>
                    refStandardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  }
                  className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  See reference standard ↓
                </button>
              ) : null}
            </div>
          )}

          <EvidencePanel result={result} />

          {capability.referenceStandard && (
            <div ref={refStandardRef} className="border border-gray-800 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">General reference</p>
              <p className="text-xs text-gray-500 leading-relaxed">{capability.referenceStandard}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CapabilitiesSection ──────────────────────────────────────────────────────

export default function CapabilitiesSection({
  onNavigateToScience,
  targetId,
  badgeCapabilityId,
}: {
  onNavigateToScience?: (id: string) => void;
  targetId?: string;
  badgeCapabilityId?: string;
}) {
  const results = useCapabilities();

  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(`capability-${targetId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [targetId]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Last 12 weeks. Tap a card to see the evidence. Untested = no data yet — not a weakness.
      </p>
      {results.map((r) => (
        <CapabilityRow
          key={r.capability.id}
          result={r}
          onNavigateToScience={onNavigateToScience}
          isTarget={r.capability.id === targetId}
          isNotification={r.capability.id === badgeCapabilityId}
        />
      ))}
    </div>
  );
}
