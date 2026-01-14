import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientLoading } from '@/components/client/ClientLoading';
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
    submitRating
  } = useClientDashboardData();

  // Filter active bookings
  const activeBookings = useMemo(() => {
    if (!bookings) return [];
    return bookings.filter(b => {
      // If invoice is paid, hide it from dashboard (moved to history/billing)
      if (b.invoice?.status === 'paid') return false;

      // If skip_invoice is true and client has viewed it (has feedback or was explicitly viewed), hide it
      if (b.status === 'completed' && b.skip_invoice && b.client_viewed_at) return false;

      return true;
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
    return <ClientLoading message="Načítám Váš dashboard..." />;
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