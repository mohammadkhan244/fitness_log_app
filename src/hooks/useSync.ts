import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { importFromNotion, syncPending } from '../db/sync';

export interface SyncState {
  pendingCount: number;
  syncing: boolean;
  lastSync: number | null;
  error: string | null;
  sync: () => Promise<void>;
  importing: boolean;
  importProgress: string | null;
  triggerImport: () => Promise<void>;
}

export function useSync(): SyncState {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);

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

  const triggerImport = useCallback(async () => {
    if (importing || !navigator.onLine) return;
    setImporting(true);
    setImportProgress('Starting…');
    try {
      const count = await importFromNotion((done) => {
        setImportProgress(`Fetching page ${done}…`);
      });
      setImportProgress(null);
      if (count > 0) setLastSync(Date.now());
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
      setImportProgress(null);
    } finally {
      setImporting(false);
    }
  }, [importing]);

  // Auto-import historical data once if not yet done
  useEffect(() => {
    if (!navigator.onLine) return;
    void db.meta.get('notionImportedAt').then((meta) => {
      if (!meta) void triggerImport();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync pending on mount
  useEffect(() => {
    if (navigator.onLine) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync on reconnect
  useEffect(() => {
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);

  return {
    pendingCount: pendingCount ?? 0,
    syncing,
    lastSync,
    error,
    sync,
    importing,
    importProgress,
    triggerImport,
  };
}
