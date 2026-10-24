import CapabilitiesSection from './CapabilitiesSection';

export default function CapabilitiesScreen({
  onNavigateToScience,
  targetId,
  badgeCapabilityId,
}: {
  onNavigateToScience?: (id: string) => void;
  targetId?: string;
  badgeCapabilityId?: string;
}) {
  return (
    <div className="max-w-lg mx-auto p-4">
      <CapabilitiesSection
        onNavigateToScience={onNavigateToScience}
        targetId={targetId}
        badgeCapabilityId={badgeCapabilityId}
      />
    </div>
  );
}
