/**
 * LastCleaningReminder - Quick rebook component for returning clients
 * 
 * Shows information about the last completed cleaning and allows
 * quick rebooking with new date/time selection.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Sparkles } from 'lucide-react';
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

        setLastBooking({
          ...booking,
          cleaner_name: cleanerName
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

  const completedDate = new Date(lastBooking.completed_at || lastBooking.scheduled_date);
  const daysAgo = differenceInDays(new Date(), completedDate);
  const formattedDate = format(completedDate, 'd. MMMM yyyy', { locale: cs });

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
      {/* Decorative element */}
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-primary/5 blur-xl" />
      
      <CardContent className="relative p-5 space-y-4">
        {/* Header with refresh icon */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-primary/10">
            <RefreshCw className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-foreground">
              Váš poslední úklid byl před {daysAgo} {daysAgo === 1 ? 'dnem' : daysAgo < 5 ? 'dny' : 'dny'}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {formattedDate} na adrese <span className="font-medium text-foreground">{lastBooking.address}</span>
            </p>
            {lastBooking.cleaner_name && (
              <p className="text-sm text-muted-foreground mt-1">
                Uklízečka: <span className="font-medium text-foreground">{lastBooking.cleaner_name}</span>
              </p>
            )}
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
          <Button 
            onClick={handleRebook}
            disabled={submitting || !selectedDate}
            className="w-full bg-primary hover:bg-primary/90 font-semibold"
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
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
