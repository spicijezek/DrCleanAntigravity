/**
 * ClientEmptyState - Empty state content for client dashboard
 * 
 * This component is displayed when a client has no active bookings.
 * To remove this feature, simply:
 * 1. Delete this file and all files in src/components/client/dashboard/
 * 2. Remove the import and usage from ClientDashboard.tsx
 */

import { EmptyStateWelcome } from './EmptyStateWelcome';
import { HowItWorks } from './HowItWorks';
import { TrustIndicators } from './TrustIndicators';
import { FeaturedServices } from './FeaturedServices';
import { LoyaltyBannerWithProgress } from './LoyaltyBannerWithProgress';
import { QuickContact } from './QuickContact';
import { LastCleaningReminder } from './LastCleaningReminder';

interface ClientEmptyStateProps {
  firstName: string;
  currentCredits: number;
  hasBookedBefore?: boolean;
  clientId?: string;
  onBookingCreated?: () => void;
}

export function ClientEmptyState({ 
  firstName, 
  currentCredits, 
  hasBookedBefore = false,
  clientId,
  onBookingCreated
}: ClientEmptyStateProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <EmptyStateWelcome firstName={firstName} hasBookedBefore={hasBookedBefore} />
      
      {/* Last Cleaning Reminder - only for returning clients */}
      {hasBookedBefore && clientId && (
        <LastCleaningReminder clientId={clientId} onBookingCreated={onBookingCreated} />
      )}
      
      {/* For returning clients: Loyalty & Contact, then services */}
      {hasBookedBefore && (
        <div className="space-y-6 pt-2">
          <LoyaltyBannerWithProgress currentCredits={currentCredits} />
          <QuickContact />
        </div>
      )}
      
      {/* Featured Services Carousel - for returning clients before Trust Indicators */}
      {hasBookedBefore && <FeaturedServices />}
      
      {/* Trust Indicators - horizontal scroll */}
      <TrustIndicators />
      
      {/* How It Works */}
      <HowItWorks />
      
      {/* Featured Services - for new clients between How It Works and Loyalty */}
      {!hasBookedBefore && <FeaturedServices />}
      
      {/* For new clients: Loyalty & Contact at the end */}
      {!hasBookedBefore && (
        <>
          <LoyaltyBannerWithProgress currentCredits={currentCredits} />
          <QuickContact />
        </>
      )}
    </div>
  );
}
