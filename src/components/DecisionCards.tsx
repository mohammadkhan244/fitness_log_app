import { useState } from 'react';
import type { Decision } from '../hooks/useDecisions';
import { useDecisions } from '../hooks/useDecisions';

const TODAY = new Date().toISOString().split('T')[0];

function isDue(d: Decision): boolean {
  if (d.status === 'Revisit due') return true;
  if (d.status === 'Active' && d.revisitDate && d.revisitDate <= TODAY) return true;
  return false;
}

function Card({ d, onMark }: { d: Decision; onMark: (id: string, s: 'Confirmed' | 'Changed') => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  const handle = async (s: 'Confirmed' | 'Changed') => {
    setBusy(true);
    await onMark(d.id, s).finally(() => setBusy(false));
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-sm font-medium text-gray-100">{d.name}</span>
        {d.status === 'Revisit due' && (
          <span className="text-xs bg-yellow-900 text-yellow-300 px-2 py-0.5 rounded-full flex-shrink-0">
            Revisit due
          </span>
        )}
        {d.status === 'Active' && d.revisitDate && d.revisitDate <= TODAY && (
          <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded-full flex-shrink-0">
            Due {d.revisitDate}
          </span>
        )}
      </div>

      {d.trigger && (
        <div className="text-xs text-gray-400 mb-3">
          <span className="text-gray-600">Would change if: </span>
          {d.trigger}
        </div>
      )}

      {d.outcomeNote && (
        <div className="text-xs text-gray-500 italic mb-3">{d.outcomeNote}</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => void handle('Confirmed')}
          disabled={busy}
          className="flex-1 text-xs py-1.5 rounded bg-gray-800 hover:bg-green-900 hover:text-green-300 transition-colors disabled:opacity-40"
        >
          Still holds
        </button>
        <button
          onClick={() => void handle('Changed')}
          disabled={busy}
          className="flex-1 text-xs py-1.5 rounded bg-gray-800 hover:bg-red-900 hover:text-red-300 transition-colors disabled:opacity-40"
        >
          Changed
        </button>
      </div>
    </div>
  );
}

export default function DecisionCards() {
  const { decisions, loading, error, markStatus, refresh } = useDecisions();

  if (loading) {
    return <div className="text-xs text-gray-600 py-4 text-center">Loading decisions…</div>;
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 py-4 text-center">{error}</div>
    );
  }

  const due = decisions.filter(isDue);
  const active = decisions.filter((d) => d.status === 'Active' && !isDue(d));

  if (decisions.length === 0) {
    return <div className="text-xs text-gray-600 py-4 text-center">No decisions yet.</div>;
  }

  return (
    <div className="space-y-3">
      {due.length > 0 && (
        <div className="space-y-2">
          {due.map((d) => <Card key={d.id} d={d} onMark={markStatus} />)}
        </div>
      )}

      {active.length > 0 && (
        <details className="group">
          <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {active.length} active decision{active.length !== 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-2">
            {active.map((d) => <Card key={d.id} d={d} onMark={markStatus} />)}
          </div>
        </details>
      )}

      <button
        onClick={refresh}
        className="text-xs text-gray-600 hover:text-gray-400 w-full text-center py-1"
      >
        Refresh
      </button>
    </div>
  );
}
