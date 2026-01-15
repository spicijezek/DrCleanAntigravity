import { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ClientEmptyState } from '@/components/client/dashboard/ClientEmptyState';
import { BookingCard } from '@/components/client/dashboard/BookingCard';
import { useClientDashboardData } from '@/hooks/useClientDashboardData';
import { toast } from 'sonner';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { CalendarIcon } from 'lucide-react';

export default function ClientDashboard() {
  const { user } = useAuth();
  const {
    clientData,
    bookings,
    loyaltyCredits,
    isLoading,
    submitRating,
    markAsViewed
  } = useClientDashboardData();

  // Mark terminal bookings as viewed when they appear on dashboard
  useEffect(() => {
    const bookingsToMarkAsViewed = bookings?.filter(b =>
      b.status === 'completed' &&
      (b.invoice?.status === 'paid' || b.skip_invoice) &&
      !b.client_viewed_at
    );

    if (bookingsToMarkAsViewed && bookingsToMarkAsViewed.length > 0) {
      // Mark them as viewed after a short delay to ensure client sees them
      const timer = setTimeout(() => {
        bookingsToMarkAsViewed.forEach(b => markAsViewed.mutate(b.id));
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [bookings, markAsViewed]);

  // Filter active bookings
  const activeBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => {
      // 1. Pending, Approved, In Progress are always active
      if (b.status !== 'completed') return true;

      // 2. Completed: If overdue, always show
      if (b.invoice?.status === 'overdue') return true;

      // 3. Completed: If paid OR skipped, show only if NOT yet viewed
      if ((b.invoice?.status === 'paid' || b.skip_invoice) && !b.client_viewed_at) return true;

      // 4. Completed: If no invoice assigned yet (and not skipped), show until feedback is given
      if (!b.invoice && !b.skip_invoice && !b.feedback) return true;

      return false;
    });
  }, [bookings]);

  const hasActiveBookings = activeBookings.length > 0;
  const hasBookedBefore = bookings && bookings.length > 0;

  // Get first name for welcome message
  const firstName = clientData?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Klient';

  const handleRatingSubmit = async (bookingId: string, rating: number, comment: string) => {
    try {
      await submitRating.mutateAsync({ bookingId, rating, comment });
    } catch (error) {
      // already handled
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Načítám Váš dashboard..." />;
  }

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6 animate-in fade-in duration-700">
      {/* Empty State - shown when no active bookings */}
      {!hasActiveBookings && (
        <ClientEmptyState
          firstName={firstName}
          currentCredits={loyaltyCredits?.current_credits || 0}
          hasBookedBefore={hasBookedBefore}
          clientId={clientData?.id}
          onBookingCreated={() => { }}
        />
      )}

      {/* Active Bookings List */}
      {hasActiveBookings && (
        <div className="space-y-4">
          <ClientHeroHeader
            icon={CalendarIcon}
            title="Vaše rezervace"
            subtitle="Správa vašich naplánovaných úklidů"
            className="mb-6"
          />
          <div className="space-y-4">
            {activeBookings.map(booking => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onRatingSubmit={handleRatingSubmit}
                currentLoyaltyPoints={loyaltyCredits?.current_credits}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}