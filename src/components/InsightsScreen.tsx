import { useState } from 'react';
import { useBodyMap } from '../hooks/useBodyMap';
import { useDashboardData } from '../hooks/useDashboardData';
import BodyMap from './charts/BodyMap';
import DailyFocusCard from './DailyFocusCard';
import InsightsTab from './InsightsTab';
import MobilityFocusCard from './MobilityFocusCard';
import MobilityInsightsTab from './MobilityInsightsTab';
import TodaysMechanismCard from './TodaysMechanismCard';

const PROGRAM_START_MS = new Date('2025-06-23T00:00:00').getTime();

function calendarWeek(): number {
  const noon = new Date();
  noon.setHours(12, 0, 0, 0);
  const days = Math.floor((noon.getTime() - PROGRAM_START_MS) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

export default function InsightsScreen({
  onNavigateToCapabilities,
  onNavigateToScience,
  hasBadge,
}: {
  onNavigateToCapabilities?: (id: string) => void;
  onNavigateToScience?: (id: string) => void;
  hasBadge?: boolean;
}) {
  const { strength, mobility } = useBodyMap();
  const dashboard = useDashboardData();
  const currentWeek = calendarWeek();
  const [bodyMapMode, setBodyMapMode] = useState<'strength' | 'mobility'>('strength');

  if (dashboard.loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-gray-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* Focus cards — always visible regardless of body map toggle */}
      <DailyFocusCard bodyMap={strength} week={currentWeek} />
      <MobilityFocusCard mobility={mobility} />
      <TodaysMechanismCard
        onNavigateToCapabilities={onNavigateToCapabilities}
        onNavigateToScience={onNavigateToScience}
        isNotification={hasBadge}
      />

      {/* Body map — mode is lifted here so the insights section below stays in sync */}
      <div>
        <h2 className="text-sm font-semibold text-gray-200 mb-1">Muscle Volume Map</h2>
        <p className="text-xs text-gray-500 mb-3">
          Tap a region to see exercises. Toggle Strength / Mobility to switch lenses.
        </p>
        <BodyMap
          strength={strength}
          mobility={mobility}
          mode={bodyMapMode}
          onModeChange={setBodyMapMode}
        />
      </div>

      {/* Insights — switches with the body map toggle */}
      <div>
        <h2 className="text-sm font-semibold text-gray-200 mb-3">
          {bodyMapMode === 'strength' ? 'Training Insights' : 'Mobility Insights'}
        </h2>
        {bodyMapMode === 'strength' ? (
          <InsightsTab bodyMap={strength} dashboard={dashboard} />
        ) : (
          <MobilityInsightsTab strength={strength} mobility={mobility} />
        )}
      </div>

    </div>
  );
}
