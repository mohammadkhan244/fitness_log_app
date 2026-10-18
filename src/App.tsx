import { useEffect, useRef, useState } from 'react';
import CapabilitiesScreen from './components/CapabilitiesScreen';
import DashboardScreen from './components/DashboardScreen';
import ErrorBoundary from './components/ErrorBoundary';
import InsightsScreen from './components/InsightsScreen';
import LogScreen from './components/LogScreen';
import ScienceScreen from './components/ScienceScreen';
import SyncStatus from './components/SyncStatus';
import { useCapabilityBadge } from './hooks/useBadge';
import { useSync } from './hooks/useSync';

type Tab = 'log' | 'dashboard' | 'insights' | 'capabilities' | 'science';

// Extend Navigator type for Web App Badging API (not yet in all TS lib versions)
declare global {
  interface Navigator {
    setAppBadge?(count?: number): Promise<void>;
    clearAppBadge?(): Promise<void>;
  }
}

export default function App() {
  const syncState = useSync();
  const [tab, setTab] = useState<Tab>('log');
  const [scienceTarget, setScienceTarget] = useState<string | undefined>(undefined);
  const [capabilitiesTarget, setCapabilitiesTarget] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const logSaveTrigger = useRef<() => void>(() => {});

  const { hasBadge, badgeLabel, acknowledge } = useCapabilityBadge();

  // Sync badge count to PWA app icon via Web App Badging API
  useEffect(() => {
    if (hasBadge) {
      navigator.setAppBadge?.(1)?.catch(() => {});
    } else {
      navigator.clearAppBadge?.()?.catch(() => {});
    }
  }, [hasBadge]);

  function navigateToScience(capabilityId: string) {
    setScienceTarget(capabilityId);
    setTab('science');
  }

  function navigateToCapabilities(capabilityId: string) {
    setCapabilitiesTarget(capabilityId);
    acknowledge();
    setTab('capabilities');
  }

  // On the log tab the bottom bar is taller (save row + tab row)
  const bottomBarHeight = tab === 'log' ? '7rem' : '3rem';

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <SyncStatus {...syncState} />

      <div
        className="flex-1 overflow-auto"
        style={{ paddingBottom: `calc(${bottomBarHeight} + env(safe-area-inset-bottom, 0px))` }}
      >
        {tab === 'log' && (
          <LogScreen
            sync={syncState.sync}
            saveTrigger={logSaveTrigger}
            onSavingChange={(s, m) => { setSaving(s); setSaveMsg(m); }}
          />
        )}
        {tab === 'dashboard' && <DashboardScreen />}
        {tab === 'insights' && (
          <InsightsScreen
            onNavigateToCapabilities={navigateToCapabilities}
            onNavigateToScience={navigateToScience}
          />
        )}
        {tab === 'capabilities' && (
          <CapabilitiesScreen
            onNavigateToScience={navigateToScience}
            targetId={capabilitiesTarget}
          />
        )}
        {tab === 'science' && <ScienceScreen targetId={scienceTarget} />}
      </div>

      {/* Unified bottom bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-20 bg-gray-900 border-t border-gray-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Save row — log tab only */}
        {tab === 'log' && (
          <div className="px-4 pt-2 pb-1">
            <button
              type="button"
              onClick={() => logSaveTrigger.current()}
              disabled={saving}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              {saving ? 'Saving…' : 'Save session'}
              {saveMsg && !saving && (
                <span className="text-blue-200 text-xs font-normal">· {saveMsg}</span>
              )}
            </button>
          </div>
        )}

        {/* Tab row */}
        <div className="flex h-12">
          {(
            [
              { id: 'log',          label: 'Log' },
              { id: 'dashboard',    label: 'Dashboard' },
              { id: 'insights',     label: 'Insights' },
              { id: 'capabilities', label: 'Capabilities' },
              { id: 'science',      label: 'Science' },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => {
                if (id === 'capabilities') acknowledge();
                if (id !== 'science') setScienceTarget(undefined);
                if (id !== 'capabilities') setCapabilitiesTarget(undefined);
                setTab(id);
              }}
              className={`flex-1 text-xs font-medium transition-colors flex flex-col items-center justify-center gap-0 ${
                tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="relative inline-block leading-none">
                {label}
                {id === 'capabilities' && hasBadge && (
                  <span className="absolute -top-1.5 -right-2.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </span>
              {id === 'capabilities' && badgeLabel && (
                <span className="text-[9px] text-red-400/80 font-normal mt-0.5 max-w-[72px] truncate leading-none">
                  {badgeLabel}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
