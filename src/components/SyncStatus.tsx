import type { SyncState } from '../hooks/useSync';

function ago(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

export default function SyncStatus({
  pendingCount,
  syncing,
  lastSync,
  error,
  sync,
}: SyncState) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 sticky top-0 z-10">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${
          offline
            ? 'bg-gray-600'
            : syncing
              ? 'bg-yellow-400 animate-pulse'
              : error
                ? 'bg-red-500'
                : 'bg-green-500'
        }`}
      />

      {offline ? (
        <span>Offline — will sync on reconnect</span>
      ) : syncing ? (
        <span>Syncing{pendingCount > 0 ? ` ${pendingCount} pending` : ''}…</span>
      ) : error ? (
        <span className="text-red-400">{error}</span>
      ) : (
        <span>
          {pendingCount > 0 ? `${pendingCount} pending` : 'Synced'}
          {lastSync != null && ` · ${ago(lastSync)}`}
        </span>
      )}

      {!syncing && !offline && (
        <button
          onClick={() => void sync()}
          className="ml-auto text-gray-600 hover:text-gray-300 underline"
        >
          Sync now
        </button>
      )}
    </div>
  );
}
