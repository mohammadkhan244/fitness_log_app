import { useState } from 'react';
import type { SyncState } from '../hooks/useSync';
import type { Category, Equipment } from '../types';

const EQUIPMENTS: Equipment[] = [
  'Bodyweight', 'Dumbbell', 'Kettlebell', 'Sandbag', 'Weighted Backpack',
  'Machine/Cable', 'Barbell', 'None',
];
const CATEGORIES: Category[] = [
  'Fast Tempo', 'Slow Tempo', 'Skills', 'Guardian', 'Benchmark', 'Rest/Chaos', 'General',
];

function ago(ts: number): string {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

interface FixState {
  equipment?: Equipment;
  category?: Category;
}

export default function SyncStatus({
  pendingCount, syncing, lastSync, error, failedEntries,
  sync, fixEntry, importing, importProgress, triggerImport,
}: SyncState) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;
  const [fixes, setFixes] = useState<Record<number, FixState>>({});

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
    label = <span className="text-blue-300">{importProgress ?? 'Importing history…'}</span>;
  } else if (importProgress) {
    label = <span className="text-blue-300">{importProgress}</span>;
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

  const selectCls = 'flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 h-9 text-xs text-gray-100 focus:outline-none focus:border-blue-500';

  return (
    <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
      {/* Status bar */}
      <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="flex-1 truncate">{label}</span>
        {!syncing && !importing && !offline && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => void triggerImport()}
              className="px-2 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              ↓ Import
            </button>
            <button
              onClick={() => void sync()}
              className="px-2 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              ↑ Sync
            </button>
          </div>
        )}
      </div>

      {/* Failed entries panel */}
      {failedEntries.length > 0 && (
        <div className="border-t border-red-900/40 bg-gray-950 px-4 py-3 space-y-3">
          <p className="text-xs font-semibold text-red-400">
            {failedEntries.length} entr{failedEntries.length === 1 ? 'y' : 'ies'} failed to sync
          </p>
          {failedEntries.map(({ entry, message }) => {
            const id = entry.id!;
            const fix = fixes[id] ?? {};
            const missingCategory = !entry.category;
            const selectedEquipment = fix.equipment ?? (entry.equipment as Equipment | undefined);
            const selectedCategory = fix.category ?? (entry.category as Category | undefined);

            const canFix = missingCategory ? !!fix.category : true;

            return (
              <div key={entry.clientId} className="bg-gray-900 rounded-xl p-3 space-y-2">
                {/* Entry info */}
                <div>
                  <p className="text-xs font-medium text-gray-200">{entry.exercise}</p>
                  <p className="text-xs text-gray-500">{entry.date} · set {entry.set ?? '?'}</p>
                  {entry.equipment && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      Equipment: <span className="font-medium">{entry.equipment}</span>
                    </p>
                  )}
                  {missingCategory && (
                    <p className="text-xs text-amber-500 mt-0.5">Category missing</p>
                  )}
                </div>

                {/* Notion error */}
                <p className="text-xs text-red-400 leading-snug break-words">{message}</p>

                {/* Fix category (shown when missing) */}
                {missingCategory && (
                  <div className="flex gap-2 items-center">
                    <select
                      value={selectedCategory ?? ''}
                      onChange={(e) => setFixes((prev) => ({
                        ...prev,
                        [id]: { ...prev[id], category: e.target.value as Category },
                      }))}
                      className={selectCls}
                    >
                      <option value="">— pick category —</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}

                {/* Fix equipment */}
                <div className="flex gap-2 items-center">
                  <select
                    value={selectedEquipment ?? ''}
                    onChange={(e) => setFixes((prev) => ({
                      ...prev,
                      [id]: { ...prev[id], equipment: e.target.value as Equipment },
                    }))}
                    className={selectCls}
                  >
                    <option value="">— fix equipment —</option>
                    {EQUIPMENTS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const eq = fix.equipment ?? entry.equipment as Equipment;
                      const cat = fix.category ?? (entry.category as Category | undefined);
                      void fixEntry(id, eq, cat);
                    }}
                    disabled={!canFix}
                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-lg text-xs font-medium text-white transition-colors flex-shrink-0"
                  >
                    Fix & Sync
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
