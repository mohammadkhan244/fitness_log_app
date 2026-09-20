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
  importing,
  importProgress,
  triggerImport,
}: SyncState) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;

  const dotColor = offline
    ? 'bg-gray-600'
    : importing
      ? 'bg-blue-400 animate-pulse'
      : syncing
        ? 'bg-yellow-400 animate-pulse'
        : error
          ? 'bg-red-500'
          : 'bg-green-500';

  let label: React.ReactNode;
  if (offline) {
    label = 'Offline — will sync on reconnect';
  } else if (importing) {
    label = <span className="text-blue-400">Importing history: {importProgress}</span>;
  } else if (syncing) {
    label = `Syncing${pendingCount > 0 ? ` ${pendingCount} pending` : ''}…`;
  } else if (error) {
    label = <span className="text-red-400">{error}</span>;
  } else {
    label = (
      <>
        {pendingCount > 0 ? `${pendingCount} pending` : 'Synced'}
        {lastSync != null && ` · ${ago(lastSync)}`}
      </>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs text-gray-400 sticky top-0 z-10">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="flex-1 truncate">{label}</span>

      {!syncing && !importing && !offline && (
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => void triggerImport()}
            className="text-gray-600 hover:text-gray-300 underline"
          >
            Re-import
          </button>
          <button
            onClick={() => void sync()}
            className="text-gray-600 hover:text-gray-300 underline"
          >
            Sync
          </button>
        </div>
      )}
    </div>
  );
}
