import CapabilitiesSection from './CapabilitiesSection';

export default function CapabilitiesScreen({
  onNavigateToScience,
}: {
  onNavigateToScience?: (id: string) => void;
}) {
  return (
    <div className="max-w-lg mx-auto p-4">
      <CapabilitiesSection onNavigateToScience={onNavigateToScience} />
    </div>
  );
}
