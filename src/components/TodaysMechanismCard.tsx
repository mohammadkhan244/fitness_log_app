import { useTodaysMechanism } from '../hooks/useTodaysMechanism';
import type { CapabilityStatus } from '../hooks/useCapabilities';
import type { ExerciseSet } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatValue(set: ExerciseSet): string {
  const { value, unit, load } = set;
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
  return parts.join(' · ');
}

const STATUS_LABEL: Record<CapabilityStatus, string> = {
  'demonstrated':       'Demonstrated',
  'building':           'Building',
  'confirmed-transfer': 'Confirmed transfer',
  'flagged':            'Flagged',
  'untested':           'Untested',
};

const STATUS_BADGE: Record<CapabilityStatus, string> = {
  'demonstrated':       'bg-gray-800 text-gray-300',
  'building':           'bg-blue-900/50 text-blue-300',
  'confirmed-transfer': 'bg-indigo-900/70 text-indigo-200',
  'flagged':            'bg-amber-900/60 text-amber-300',
  'untested':           'bg-gray-900 text-gray-500',
};

// ─── TodaysMechanismCard ──────────────────────────────────────────────────────

export default function TodaysMechanismCard({
  onNavigateToCapabilities,
  onNavigateToScience,
}: {
  onNavigateToCapabilities?: (id: string) => void;
  onNavigateToScience?: (id: string) => void;
}) {
  const result = useTodaysMechanism();

  if (!result) return null;

  const { capability, currentResult, triggerCase } = result;
  const status = currentResult.status;
  const hasSources = Boolean(capability.sources?.length);

  // Build trigger line text
  let triggerNode: React.ReactNode = null;

  if (triggerCase === 'today' && result.todaySets) {
    const sets = result.todaySets.slice(0, 3);
    triggerNode = (
      <div className="space-y-0.5">
        {sets.map((s, i) => {
          const val = formatValue(s);
          return (
            <p key={i} className="text-xs text-gray-500">
              Logged today: {s.exercise}, {s.category}{val ? `, ${val}` : ''}.
            </p>
          );
        })}
      </div>
    );
  } else if (triggerCase === 'status-change' && result.changeDate) {
    const oldLabel = STATUS_LABEL[result.oldStatus!];
    const newLabel = STATUS_LABEL[status];
    const backingText = (result.changeSets ?? [])
      .slice(0, 2)
      .map((s) => `${s.exercise} on ${formatDate(s.date)}`)
      .join('; ');
    triggerNode = (
      <p className="text-xs text-gray-500">
        {oldLabel} → {newLabel} as of {formatDate(result.changeDate)}
        {backingText ? `, backed by: ${backingText}.` : '.'}
      </p>
    );
  } else if (triggerCase === 'fallback' && result.lastDate) {
    triggerNode = (
      <p className="text-xs text-gray-500">
        Last touched {formatDate(result.lastDate)}: {result.lastExercise}.
      </p>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Today's mechanism</p>

      {/* Capability name + status badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[status]}`}>
          {STATUS_LABEL[status]}
        </span>
        <span className="text-sm font-medium text-gray-200">{capability.name}</span>
      </div>

      {/* Static science note */}
      {capability.science && (
        <p className="text-xs text-gray-500 leading-relaxed">{capability.science}</p>
      )}

      {/* Dynamic trigger line */}
      {triggerNode}

      {/* Navigation links */}
      <div className="flex items-center gap-4 border-t border-gray-800 pt-3">
        <button
          type="button"
          onClick={() => onNavigateToCapabilities?.(capability.id)}
          className="text-xs text-gray-500 hover:text-gray-300 active:text-gray-200 transition-colors"
        >
          View in Capabilities →
        </button>
        {hasSources && (
          <button
            type="button"
            onClick={() => onNavigateToScience?.(capability.id)}
            className="text-xs text-indigo-400 hover:text-indigo-300 active:text-indigo-200 transition-colors"
          >
            Learn the mechanism →
          </button>
        )}
      </div>
    </div>
  );
}
