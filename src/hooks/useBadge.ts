import { useState } from 'react';
import { useTodaysMechanism } from './useTodaysMechanism';

const STORAGE_KEY = 'capabilities_last_acknowledged';

/**
 * Tracks whether the Capabilities tab has unseen activity.
 * Badge shows when:
 *   - A capability was trained today and Capabilities tab hasn't been visited today.
 *   - A capability's status changed, and the change date is after the last visit.
 * Call acknowledge() when the user opens the Capabilities tab to clear the badge.
 */
export function useCapabilityBadge(): { hasBadge: boolean; acknowledge: () => void } {
  const [lastAck, setLastAck] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? '1970-01-01T00:00:00.000Z',
  );
  const mechanism = useTodaysMechanism();

  const today = new Date().toISOString().slice(0, 10);
  const lastAckDate = lastAck.slice(0, 10);

  let hasBadge = false;
  if (mechanism) {
    if (mechanism.triggerCase === 'today') {
      // Badge if user hasn't visited Capabilities at any point today
      hasBadge = lastAckDate < today;
    } else if (mechanism.triggerCase === 'status-change' && mechanism.changeDate) {
      // Badge if the status flip happened after the last acknowledged date
      hasBadge = mechanism.changeDate > lastAckDate;
    }
  }

  function acknowledge() {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    setLastAck(now);
  }

  return { hasBadge, acknowledge };
}
