import { useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ClientEmptyState } from '@/components/client/dashboard/ClientEmptyState';
import { BookingCard } from '@/components/client/dashboard/BookingCard';
import { useClientDashboardData } from '@/hooks/useClientDashboardData';
import { useInvoiceDownload } from '@/hooks/useInvoiceDownload';
import { HiddenInvoiceContainer } from '@/components/invoices/HiddenInvoiceContainer';
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
    declineRating,
    markAsViewed
  } = useClientDashboardData();

  const { downloadInvoice, generatingInvoiceId, invoiceItems, previewInvoice } = useInvoiceDownload();

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

      // 2. Completed with skip_invoice: show only if not viewed
      if (b.skip_invoice) return !b.client_viewed_at;

      // 3. Completed with invoice assigned:
      if (b.invoice) {
        // If unpaid (pending or overdue), stay on dashboard UNTIL PAID
        if (b.invoice.status !== 'paid') return true;

        // If paid, show only if not viewed (brief moment before moving to history)
        return !b.client_viewed_at;
      }

      // 4. Completed without invoice yet (and not skipped): show until invoice is assigned
      return true;
    }).sort((a, b) => {
      const aIsUnpaid = a.invoice?.status === 'overdue' || a.invoice?.status === 'issued';
      const bIsUnpaid = b.invoice?.status === 'overdue' || b.invoice?.status === 'issued';

      if (aIsUnpaid && !bIsUnpaid) return -1;
      if (!aIsUnpaid && bIsUnpaid) return 1;

      // For everything else, default to chronological (using scheduled_date or created_at)
      const dateA = new Date(a.scheduled_date || a.created_at).getTime();
      const dateB = new Date(b.scheduled_date || b.created_at).getTime();
      return dateB - dateA;
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

  const handleRatingDecline = async (bookingId: string) => {
    try {
      await declineRating.mutateAsync(bookingId);
    } catch (error) {
      // already handled
    }
  };

  if (isLoading) {
    return <LoadingOverlay message="Načítám Váš dashboard..." />;
  }

  return (
    <div className="container mx-auto px-4 pt-6 pb-20 space-y-6 animate-in fade-in duration-700">
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
                onDecline={handleRatingDecline}
                onDownload={downloadInvoice}
                currentLoyaltyPoints={loyaltyCredits?.current_credits}
              />
            ))}
          </div>
        </div>
      )}

      <HiddenInvoiceContainer
        generatingInvoiceId={generatingInvoiceId}
        previewInvoice={previewInvoice}
        companyInfo={bookings?.find(b => b.invoice?.id === previewInvoice?.id)?.company_info || {}}
        invoiceItems={invoiceItems}
        bookings={bookings as any || []}
        clientData={clientData}
      />
    </div>
  );
}