import { useCapabilities } from '../hooks/useCapabilities';
import type { CapabilityResult, CapabilityStatus } from '../hooks/useCapabilities';

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const STATUS_STYLE: Record<
  CapabilityStatus,
  { border: string; badge: string; label: string }
> = {
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

function detailText(result: CapabilityResult): string {
  const { status, lastCleanDate, flagDetail, transferDetail } = result;
  switch (status) {
    case 'demonstrated':
      return lastCleanDate ? `Last clean set ${formatDate(lastCleanDate)}.` : '';
    case 'building':
      return 'Active investment this window — no demonstration yet.';
    case 'confirmed-transfer':
      return transferDetail ?? '';
    case 'flagged':
      return flagDetail ?? '';
    case 'untested':
      return 'No logged activity this window.';
  }
}

function CapabilityRow({ result }: { result: CapabilityResult }) {
  const { capability, status } = result;
  const style = STATUS_STYLE[status];
  const detail = detailText(result);

  const detailColor =
    status === 'confirmed-transfer' ? 'text-indigo-300/90' :
    status === 'flagged'            ? 'text-amber-300/80' :
    status === 'untested'           ? 'text-gray-600' :
                                      'text-gray-400';

  return (
    <div className={`border rounded-xl p-4 space-y-1.5 ${style.border}`}>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${style.badge}`}
        >
          {style.label}
        </span>
        <span className="text-sm font-medium text-gray-200">{capability.name}</span>
      </div>
      {detail && (
        <p className={`text-xs leading-relaxed ${detailColor}`}>{detail}</p>
      )}
    </div>
  );
}

export default function CapabilitiesSection() {
  const results = useCapabilities();

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Last 12 weeks. Untested = no data yet — not a weakness.
      </p>
      {results.map((r) => (
        <CapabilityRow key={r.capability.id} result={r} />
      ))}
    </div>
  );
}
