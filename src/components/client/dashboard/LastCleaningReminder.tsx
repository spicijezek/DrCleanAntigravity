/**
 * LastCleaningReminder - Quick rebook component for returning clients
 * 
 * Shows information about the last completed cleaning and allows
 * quick rebooking with new date/time selection.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { RefreshCw, Sparkles, Star, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, addDays } from 'date-fns';
import { cs } from 'date-fns/locale';
import { toast } from 'sonner';
import { DateTimeRow } from '@/components/ui/date-time-picker';

interface LastBooking {
  id: string;
  address: string;
  booking_details: any;
  service_type: string;
  completed_at: string;
  scheduled_date: string;
  cleaner_name: string | null;
  rating?: number;
  points_earned?: number;
}

interface LastCleaningReminderProps {
  clientId: string;
  onBookingCreated?: () => void;
}

export function LastCleaningReminder({ clientId, onBookingCreated }: LastCleaningReminderProps) {
  const { user } = useAuth();
  const [lastBooking, setLastBooking] = useState<LastBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Rebook form state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [selectedTime, setSelectedTime] = useState('09:00');

  useEffect(() => {
    fetchLastCompletedBooking();
  }, [clientId]);

  const fetchLastCompletedBooking = async () => {
    if (!clientId) return;

    try {
      // Get the last completed booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id,
          address,
          booking_details,
          service_type,
          completed_at,
          scheduled_date,
          team_member_ids
        `)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (booking) {
        // Get cleaner name
        let cleanerName = null;
        if (booking.team_member_ids && booking.team_member_ids.length > 0) {
          const { data: teamMembers } = await supabase
            .from('team_members')
            .select('name')
            .in('id', booking.team_member_ids)
            .limit(1);

          if (teamMembers && teamMembers.length > 0) {
            cleanerName = teamMembers[0].name;
          }
        }

        // Get rating
        const { data: feedback } = await supabase
          .from('booking_feedback')
          .select('rating')
          .eq('booking_id', booking.id)
          .maybeSingle();

        // Get points earned
        const { data: transaction } = await supabase
          .from('loyalty_transactions')
          .select('amount')
          .eq('related_job_id', booking.id) // related_job_id is used for bookings too in some parts of the code
          .eq('type', 'earned')
          .maybeSingle();

        setLastBooking({
          ...booking,
          cleaner_name: cleanerName,
          rating: feedback?.rating,
          points_earned: transaction?.amount
        });
      }
    } catch (error) {
      console.error('Error fetching last booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRebook = async () => {
    if (!lastBooking || !selectedDate || !user) return;

    setSubmitting(true);
    try {
      // Create scheduled datetime
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Create new booking with same details
      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          client_id: clientId,
          service_type: lastBooking.service_type,
          address: lastBooking.address,
          booking_details: {
            ...lastBooking.booking_details,
            is_rebook: true,
            original_booking_id: lastBooking.id
          },
          scheduled_date: scheduledDate.toISOString(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Úklid byl úspěšně objednán!', {
        description: `Termín: ${format(scheduledDate, 'PPP', { locale: cs })} v ${selectedTime}`
      });

      onBookingCreated?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Nepodařilo se vytvořit objednávku');
    } finally {
      setSubmitting(false);
    }
  };

  // Don't render if loading or no last booking
  if (loading || !lastBooking) return null;

  // Always use scheduled_date as primary source to match booking card
  const displayDate = new Date(lastBooking.scheduled_date);
  const daysAgo = differenceInDays(new Date(), displayDate);
  const formattedDate = format(displayDate, 'd. MMMM yyyy', { locale: cs });

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 shadow-md">
      {/* Decorative element */}
      <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-primary/5 blur-xl" />

      <CardContent className="relative p-6 space-y-6">
        {/* Header with main text */}
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Váš poslední úklid byl před {daysAgo} {daysAgo === 1 ? 'dnem' : daysAgo < 5 ? 'dny' : 'dny'}
              </h3>
              <p className="text-[13px] text-muted-foreground font-medium">
                {formattedDate} • <span className="text-foreground">{lastBooking.address}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {lastBooking.cleaner_name && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-foreground/80">Uklízečka: {lastBooking.cleaner_name}</span>
                </div>
              )}

              {lastBooking.rating && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-800">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${star <= lastBooking.rating! ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-yellow-500/30'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 ml-0.5">{lastBooking.rating}</span>
                </div>
              )}

              {lastBooking.points_earned && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
                  <Coins className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+{lastBooking.points_earned} b.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick rebook form */}
        <div className="space-y-3 pt-2">
          <p className="text-sm font-medium text-foreground">Objednat stejný úklid na nový termín:</p>

          <DateTimeRow
            date={selectedDate}
            time={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
            dateLabel=""
            timeLabel=""
            disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            singleRow={true}
          />

          {/* Submit button */}
          <PremiumButton
            onClick={handleRebook}
            disabled={submitting || !selectedDate}
            className="w-full"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Odesílám...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Objednat úklid
              </>
            )}
          </PremiumButton>
        </div>
      </CardContent>
    </Card>
  );
}
