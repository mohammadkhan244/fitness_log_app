import { useBodyMap } from '../hooks/useBodyMap';
import { useDashboardData } from '../hooks/useDashboardData';
import BodyMap from './charts/BodyMap';
import DailyFocusCard from './DailyFocusCard';
import InsightsTab from './InsightsTab';

export default function InsightsScreen() {
  const bodyMap = useBodyMap();
  const dashboard = useDashboardData();

  if (dashboard.loading) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-gray-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 space-y-6">
      {/* Today's focus */}
      <DailyFocusCard bodyMap={bodyMap} week={dashboard.maxWeek} />

      {/* Body map */}
      <div>
        <h2 className="text-sm font-semibold text-gray-200 mb-1">Muscle Volume Map</h2>
        <p className="text-xs text-gray-500 mb-3">
          All-time sets by muscle group. Tap a region to see exercises.
        </p>
        <BodyMap data={bodyMap} />
      </div>

      {/* Suggestions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-200 mb-3">Training Insights</h2>
        <InsightsTab bodyMap={bodyMap} dashboard={dashboard} />
      </div>
    </div>
  );
}
