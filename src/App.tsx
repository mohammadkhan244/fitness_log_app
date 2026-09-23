import { useRef, useState } from 'react';
import DashboardScreen from './components/DashboardScreen';
import InsightsScreen from './components/InsightsScreen';
import LogScreen from './components/LogScreen';
import SyncStatus from './components/SyncStatus';
import { useSync } from './hooks/useSync';

type Tab = 'log' | 'dashboard' | 'insights';

export default function App() {
  const syncState = useSync();
  const [tab, setTab] = useState<Tab>('log');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const logSaveTrigger = useRef<() => void>(() => {});

  // On the log tab the bottom bar is taller (save row + tab row)
  const bottomBarHeight = tab === 'log' ? '7rem' : '3rem';

  return (
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
        {tab === 'insights' && <InsightsScreen />}
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
              { id: 'log', label: 'Log' },
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'insights', label: 'Insights' },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 text-sm font-medium transition-colors ${
                tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
