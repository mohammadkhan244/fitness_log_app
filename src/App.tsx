import { useState } from 'react';
import DashboardScreen from './components/DashboardScreen';
import LogScreen from './components/LogScreen';
import SyncStatus from './components/SyncStatus';
import { useSync } from './hooks/useSync';

type Tab = 'log' | 'dashboard';

export default function App() {
  const syncState = useSync();
  const [tab, setTab] = useState<Tab>('log');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <SyncStatus {...syncState} />
      <div className="flex-1 overflow-auto pb-16">
        {tab === 'log' ? <LogScreen sync={syncState.sync} /> : <DashboardScreen />}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-20">
        <button
          onClick={() => setTab('log')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'log' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Log
        </button>
        <button
          onClick={() => setTab('dashboard')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'dashboard' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Dashboard
        </button>
      </nav>
    </div>
  );
}
