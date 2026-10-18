import CapabilitiesSection from './CapabilitiesSection';

export default function CapabilitiesScreen({
  onNavigateToScience,
  targetId,
}: {
  onNavigateToScience?: (id: string) => void;
  targetId?: string;
}) {
  return (
    <div className="max-w-lg mx-auto p-4">
      <CapabilitiesSection onNavigateToScience={onNavigateToScience} targetId={targetId} />
    </div>
  );
}
