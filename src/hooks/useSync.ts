import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { syncPending } from '../db/sync';

export interface SyncState {
  pendingCount: number;
  syncing: boolean;
  lastSync: number | null;
  error: string | null;
  sync: () => Promise<void>;
}

export function useSync(): SyncState {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useLiveQuery(
    () => db.sets.where('syncedAt').equals(0).count(),
    [],
    0,
  );

  const sync = useCallback(async () => {
    if (syncing || !navigator.onLine) return;
    setSyncing(true);
    setError(null);
    try {
      const { failed } = await syncPending();
      if (failed > 0) {
        setError(`${failed} entr${failed === 1 ? 'y' : 'ies'} failed — will retry next sync`);
      }
      setLastSync(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Sync on mount
  useEffect(() => {
    if (navigator.onLine) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync on reconnect
  useEffect(() => {
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);

  return { pendingCount: pendingCount ?? 0, syncing, lastSync, error, sync };
}
