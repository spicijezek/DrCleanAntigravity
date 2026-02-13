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
import { BookingCard } from './BookingCard';
import { Eye, Sparkles } from 'lucide-react';
import type { Booking } from '@/types/client-dashboard';
import maidImage from '@/assets/maid.png';

interface ClientEmptyStateProps {
  firstName: string;
  currentCredits: number;
  hasBookedBefore?: boolean;
  clientId?: string;
  onBookingCreated?: () => void;
}

// Generate mockup booking for preview
const generateMockupBooking = (): Booking => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  futureDate.setHours(10, 0, 0, 0);

  // Set started_at to show in-progress status with 75% completion
  const startedAt = new Date();
  startedAt.setHours(startedAt.getHours() - 2); // Started 2 hours ago

  return {
    id: 'mockup-preview-dashboard',
    address: 'Příkladová 123, Praha 1',
    scheduled_date: futureDate.toISOString(),
    started_at: startedAt.toISOString(),
    completed_at: null,
    created_at: new Date().toISOString(),
    client_viewed_at: null,
    service_type: 'home_cleaning',
    status: 'in_progress',
    booking_details: {
      cleaning_type: 'osobni',
      typ_domacnosti: 'byt',
      plocha_m2: 75,
      znecisteni: 'stredni',
      frekvence: 'monthly',
      equipment_option: 'own',
      priceEstimate: {
        price: 1800,
        priceMin: null,
        priceMax: null
      },
      service_title: 'Můj První Úklid',
      notes: 'Pravidelný úklid se zaměřením na kuchyň a koupelnu. Prosím o opatrnost u klavíru v obývacím pokoji.',
      manual_loyalty_points: 486
    },
    invoice_id: null,
    skip_invoice: false,
    team_member_ids: ['mockup-team-1'],
    checklist: {
      id: 'mockup-checklist',
      street: 'Příkladová 123',
      city: 'Praha 1',
      postal_code: '110 00',
      rooms: [
        { id: 'room-1', room_name: 'Obývací pokoj', is_completed: true, completed_at: new Date().toISOString() },
        { id: 'room-2', room_name: 'Kuchyň', is_completed: true, completed_at: new Date().toISOString() },
        { id: 'room-3', room_name: 'Ložnice', is_completed: true, completed_at: new Date().toISOString() },
        { id: 'room-4', room_name: 'Koupelna', is_completed: false, completed_at: null }
      ]
    },
    invoice: null,
    company_info: null,
    feedback: null,
    team_members: [
      {
        name: 'Anička',
        bio: 'Pravidelně se starám o čistotu v Klinr. Ráda dělám radost svou precizností.',
        user_id: 'mockup-user',
        profile: {
          avatar_url: maidImage,
          full_name: 'Anička'
        }
      }
    ],
    client: {
      has_allergies: true,
      allergies_notes: 'Alergie na agresivní čisticí prostředky s vůní citronu.',
      has_pets: true,
      has_children: true,
      special_instructions: 'Prosím o zvýšený důraz na utírání prachu ve výškách a pod postelí.'
    }
  };
};

export function ClientEmptyState({
  firstName,
  currentCredits,
  hasBookedBefore = false,
  clientId,
  onBookingCreated
}: ClientEmptyStateProps) {
  const mockupBooking = !hasBookedBefore ? generateMockupBooking() : null;

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <EmptyStateWelcome firstName={firstName} hasBookedBefore={hasBookedBefore} />

      {/* Trust Indicators - horizontal scroll (show above mockup for new clients) */}
      {!hasBookedBefore && <TrustIndicators />}

      {/* Mockup Booking Preview - only for new clients */}
      {!hasBookedBefore && mockupBooking && (
        <div className="space-y-4">
          {/* Preview Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 p-4 shadow-xl border-2 border-amber-200 dark:border-amber-700">
            {/* Animated decorative bubbles - 11 bubbles matching dashboard refinement */}
            <div className="absolute right-4 top-3 h-20 w-20 rounded-full bg-white/38 dark:bg-amber-300/40 animate-float-circle-1" />
            <div className="absolute right-8 top-14 h-14 w-14 rounded-full bg-orange-600/38 dark:bg-orange-300/42 animate-float-circle-2" />
            <div className="absolute left-4 bottom-3 h-16 w-16 rounded-full bg-white/40 dark:bg-amber-400/38 animate-float-circle-1" />
            <div className="absolute left-12 top-10 h-10 w-10 rounded-full bg-amber-600/38 dark:bg-orange-400/40 animate-float-circle-2" />
            <div className="absolute right-12 bottom-6 h-18 w-18 rounded-full bg-white/35 dark:bg-amber-300/38 animate-float-circle-1" />
            <div className="absolute left-1/2 top-8 h-12 w-12 rounded-full bg-orange-600/38 dark:bg-orange-300/40 animate-float-circle-2" />
            <div className="absolute left-8 bottom-12 h-14 w-14 rounded-full bg-white/38 dark:bg-amber-400/38 animate-float-circle-1" />
            <div className="absolute right-16 top-1/2 h-11 w-11 rounded-full bg-amber-700/38 dark:bg-orange-300/40 animate-float-circle-2" />
            <div className="absolute left-20 top-14 h-9 w-9 rounded-full bg-white/40 dark:bg-amber-300/38 animate-float-circle-1" />
            <div className="absolute right-10 top-10 h-12 w-12 rounded-full bg-orange-600/38 dark:bg-orange-300/42 animate-float-circle-2" />
            <div className="absolute left-6 top-6 h-10 w-10 rounded-full bg-white/38 dark:bg-amber-400/38 animate-float-circle-1" />

            {/* Sparkle decorations */}
            <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-600/70 dark:text-amber-300/60 animate-pulse" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shadow-lg animate-pulse">
                <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">Náhled Rezervace</h3>
                <p className="text-xs text-muted-foreground font-medium">Ukázka toho, jak bude vypadat vaše rezervace</p>
              </div>
            </div>
          </div>

          {/* Mockup Booking Card with opacity overlay */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl pointer-events-none z-10" />
            <BookingCard
              key={mockupBooking.id}
              booking={mockupBooking}
              onRatingSubmit={async () => { }}
              currentLoyaltyPoints={486}
            />
          </div>
        </div>
      )}

      {/* Last Cleaning Reminder - only for returning clients */}
      {hasBookedBefore && clientId && (
        <LastCleaningReminder clientId={clientId} onBookingCreated={onBookingCreated} />
      )}

      {/* For returning clients: Loyalty & Contact, then services */}
      {hasBookedBefore && (
        <div className="space-y-6">
          <LoyaltyBannerWithProgress currentCredits={currentCredits} />
          <QuickContact />
        </div>
      )}

      {/* Featured Services Carousel - for returning clients before Trust Indicators */}
      {hasBookedBefore && <FeaturedServices />}

      {/* Trust Indicators - horizontal scroll (for returning clients) */}
      {hasBookedBefore && <TrustIndicators />}

      {/* How It Works */}
      <HowItWorks />

      {/* Featured Services - for new clients between How It Works and Loyalty */}
      {!hasBookedBefore && <FeaturedServices />}

      {/* For new clients: Loyalty & Contact at the end */}
      {!hasBookedBefore && (
        <div className="space-y-6">
          <LoyaltyBannerWithProgress currentCredits={currentCredits} />
          <QuickContact />
        </div>
      )}
    </div>
  );
}
