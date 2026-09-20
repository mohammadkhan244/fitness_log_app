import { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import BenchmarkChart from './charts/BenchmarkChart';
import ConsistencyGrid from './charts/ConsistencyGrid';
import FatigueTrends from './charts/FatigueTrends';
import DecisionCards from './DecisionCards';

type Section = 'overview' | 'benchmarks' | 'fatigue' | 'decisions';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'decisions', label: 'Decisions' },
];

export default function DashboardScreen() {
  const [section, setSection] = useState<Section>('overview');
  const data = useDashboardData();

  return (
    <div className="max-w-lg mx-auto">
      {/* Section tabs */}
      <div className="flex border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              section === s.id
                ? 'text-white border-b-2 border-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-6">
        {data.loading && (
          <div className="text-xs text-gray-600 text-center py-8">
            Loading {data.totalSets > 0 ? `${data.totalSets} sets` : 'data'}…
          </div>
        )}

        {!data.loading && data.totalSets === 0 && (
          <div className="text-xs text-gray-600 text-center py-8">
            No data yet — log a session or wait for the import to finish.
          </div>
        )}

        {/* Overview */}
        {section === 'overview' && !data.loading && data.totalSets > 0 && (
          <div className="space-y-6">
            <div>
              <SectionTitle>65-Week Training Map</SectionTitle>
              <p className="text-xs text-gray-500 mb-3">
                Each cell = one week. Color = dominant domain. Brighter = more sets logged.
              </p>
              <ConsistencyGrid weeks={data.weeks} />
            </div>

            <Stat label="Total sets logged" value={String(data.totalSets)} />
            <Stat label="Weeks active" value={String(data.weeks.filter((w) => w.totalSets > 0).length)} />
            <Stat label="Exercises tracked" value={String(data.allExercises.length)} />
          </div>
        )}

        {/* Benchmarks */}
        {section === 'benchmarks' && !data.loading && (
          <div className="space-y-4">
            <SectionTitle>Benchmark Progression</SectionTitle>
            {data.benchmarks.length === 0 ? (
              <p className="text-xs text-gray-600">
                No benchmark data yet. Log sets with Category = "Benchmark" to see progression charts here.
              </p>
            ) : (
              data.benchmarks.map((s) => <BenchmarkChart key={s.exercise} series={s} />)
            )}
          </div>
        )}

        {/* Fatigue */}
        {section === 'fatigue' && !data.loading && (
          <div className="space-y-4">
            <SectionTitle>Fatigue & Day Status</SectionTitle>
            {data.weeks.every((w) => w.avgFatigue == null) ? (
              <p className="text-xs text-gray-600">
                No fatigue data yet. Log sessions with a fatigue rating to see trends here.
              </p>
            ) : (
              <FatigueTrends weeks={data.weeks} />
            )}
          </div>
        )}

        {/* Decisions */}
        {section === 'decisions' && (
          <div className="space-y-4">
            <SectionTitle>Training Decisions</SectionTitle>
            <DecisionCards />
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-200 mb-2">{children}</h2>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-900">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-200">{value}</span>
    </div>
  );
}
