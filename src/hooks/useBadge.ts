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
export function useCapabilityBadge(): {
  hasBadge: boolean;
  badgeLabel: string | undefined;
  acknowledge: () => void;
} {
  const [lastAck, setLastAck] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? '1970-01-01T00:00:00.000Z',
  );
  const mechanism = useTodaysMechanism();

  const today = new Date().toISOString().slice(0, 10);
  const lastAckDate = lastAck.slice(0, 10);

  let hasBadge = false;
  if (mechanism) {
    if (mechanism.triggerCase === 'today') {
      hasBadge = lastAckDate < today;
    } else if (mechanism.triggerCase === 'status-change' && mechanism.changeDate) {
      hasBadge = mechanism.changeDate > lastAckDate;
    }
  }

  // Short name for the sub-label: strip the parenthetical qualifier, e.g.
  // 'Pulling tendon capacity (fast-tempo transfer)' → 'Pulling tendon capacity'
  const badgeLabel = hasBadge && mechanism
    ? mechanism.capability.name.split('(')[0].trim()
    : undefined;

  function acknowledge() {
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, now);
    setLastAck(now);
  }

  return { hasBadge, badgeLabel, acknowledge };
}
