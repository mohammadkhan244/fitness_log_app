import LogScreen from './components/LogScreen';
import SyncStatus from './components/SyncStatus';
import { useSync } from './hooks/useSync';

export default function App() {
  const syncState = useSync();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <SyncStatus {...syncState} />
      <LogScreen sync={syncState.sync} />
    </div>
  );
}
