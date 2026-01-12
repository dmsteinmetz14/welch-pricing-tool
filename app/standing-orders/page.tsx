import RestrictedContent from '@/components/RestrictedContent';
import StandingOrdersManager from '@/components/StandingOrdersManager';

export const dynamic = 'force-dynamic';

export default function StandingOrdersPage() {
  return (
    <RestrictedContent featureLabel="Standing Orders">
      <StandingOrdersManager />
    </RestrictedContent>
  );
}
