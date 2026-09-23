import { useCallback, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/schema';
import { importFromNotion, syncPending, type SyncFailure } from '../db/sync';
import type { Equipment } from '../types';

export interface SyncState {
  pendingCount: number;
  syncing: boolean;
  lastSync: number | null;
  error: string | null;
  failedEntries: SyncFailure[];
  sync: () => Promise<void>;
  fixEntry: (id: number, equipment: Equipment) => Promise<void>;
  importing: boolean;
  importProgress: string | null;
  triggerImport: () => Promise<void>;
}

export function useSync(): SyncState {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [failedEntries, setFailedEntries] = useState<SyncFailure[]>([]);
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
      const { failed, errors } = await syncPending();
      setFailedEntries(errors);
      if (failed > 0) {
        setError(`${failed} entr${failed === 1 ? 'y' : 'ies'} failed — see below`);
      } else {
        setFailedEntries([]);
      }
      setLastSync(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  const fixEntry = useCallback(async (id: number, equipment: Equipment) => {
    await db.sets.update(id, { equipment });
    // Remove from failed list optimistically
    setFailedEntries((prev) => prev.filter((f) => f.entry.id !== id));
    await sync();
  }, [sync]);

  const triggerImport = useCallback(async () => {
    if (importing || !navigator.onLine) return;
    setImporting(true);
    setImportProgress('Starting…');
    try {
      const count = await importFromNotion((done) => {
        setImportProgress(`Fetching page ${done}…`);
      });
      setImportProgress(`Done — ${count} new entries imported`);
      setTimeout(() => setImportProgress(null), 4000);
      if (count > 0) setLastSync(Date.now());
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : String(e)}`);
      setImportProgress(null);
    } finally {
      setImporting(false);
    }
  }, [importing]);

  useEffect(() => {
    if (!navigator.onLine) return;
    void db.meta.get('notionImportedAt').then((meta) => {
      if (!meta) void triggerImport();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (navigator.onLine) void sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);

  return {
    pendingCount: pendingCount ?? 0,
    syncing,
    lastSync,
    error,
    failedEntries,
    sync,
    fixEntry,
    importing,
    importProgress,
    triggerImport,
  };
}
