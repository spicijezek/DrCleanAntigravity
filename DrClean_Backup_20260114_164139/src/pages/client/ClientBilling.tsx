import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, Download, ChevronDown, ChevronUp, MapPin, Calendar, Clock, Banknote, CheckCircle2, AlertTriangle, Star, X, Phone, TrendingUp, CreditCard, History, Receipt, User, HeadphonesIcon, LucideIcon, Sparkles, Baby, Dog, HeartPulse } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ClientLoading } from '@/components/client/ClientLoading';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { toast } from 'sonner';
import { BookingCard } from '@/components/client/dashboard/BookingCard';
import { Booking } from '@/types/client-dashboard';

export default function ClientBilling() {
  const {
    user
  } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextScheduledDate, setNextScheduledDate] = useState<string | null>(null);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<Record<string, string>>({});

  // Rating state
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<Set<string>>(new Set());
  useEffect(() => {
    loadData();
  }, [user]);
  const loadData = async () => {
    if (!user) return;
    try {
      const {
        data: client,
        error: clientError
      } = await supabase.from('clients').select('id, name, has_allergies, allergies_notes, has_pets, has_children, special_instructions').eq('user_id', user.id).maybeSingle();
      if (clientError) throw clientError;
      if (client) {
        setClientId(client.id);

        // Count completed bookings and get last completed date
        const {
          data: completedBookings,
          count: completedBookingsCount
        } = await supabase.from('bookings').select('scheduled_date', {
          count: 'exact'
        }).eq('client_id', client.id).eq('status', 'completed').order('scheduled_date', {
          ascending: false
        }).limit(1);
        setCompletedCount(completedBookingsCount || 0);
        setLastCompletedDate(completedBookings?.[0]?.scheduled_date || null);

        // Get next scheduled booking - only APPROVED ones (Schváleno & Naplánováno)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const {
          data: upcomingBookings
        } = await supabase.from('bookings').select('scheduled_date').eq('client_id', client.id).eq('status', 'approved').gte('scheduled_date', today.toISOString()).order('scheduled_date', {
          ascending: true
        }).limit(1);
        setNextScheduledDate(upcomingBookings?.[0]?.scheduled_date || null);

        // Fetch bookings with invoices
        const {
          data: bookingsData,
          error: bookingsError
        } = await supabase.from('bookings').select(`
            id,
            address,
            scheduled_date,
            started_at,
            completed_at,
            created_at,
            client_viewed_at,
            service_type,
            status,
            booking_details,
            invoice_id,
            skip_invoice,
            team_member_ids,
            checklist:client_checklists (
              id,
              street,
              city,
              postal_code,
              rooms:checklist_rooms (
                id,
                room_name,
                is_completed,
                completed_at,
                sort_order
              )
            )
          `).eq('client_id', client.id).order('scheduled_date', {
          ascending: false
        });

        if (bookingsError) throw bookingsError;

        // Fetch all team members first
        const { data: teamData } = await supabase
          .from('team_members')
          .select('id, name, bio, user_id');

        const teamMap: Record<string, any> = {};
        if (teamData && teamData.length > 0) {
          // Fetch all related profiles in one query
          const userIds = teamData.map(m => m.user_id).filter(Boolean);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, avatar_url, full_name')
            .in('user_id', userIds);

          const profilesMap: Record<string, any> = {};
          profilesData?.forEach(p => profilesMap[p.user_id] = p);

          teamData.forEach(m => {
            teamMap[m.id] = {
              ...m,
              profile: profilesMap[m.user_id] || null
            };
          });
        }

        // Fetch all invoices for this client
        const {
          data: bookingIdsData,
          error: bookingIdsError
        } = await supabase.from('bookings').select('id').eq('client_id', client.id);
        if (bookingIdsError) throw bookingIdsError;
        const bookingIds = (bookingIdsData || []).map(b => b.id);
        const bookingIdsFilter = bookingIds.length ? `booking_id.in.(${bookingIds.join(',')})` : '';
        const orFilter = [`client_id.eq.${client.id}`, bookingIdsFilter].filter(Boolean).join(',');
        const {
          data: invoicesData,
          error: invoicesError
        } = await supabase.from('invoices').select('id, invoice_number, date_created, date_due, total, status, pdf_path, variable_symbol, booking_id, user_id').or(orFilter).order('date_created', {
          ascending: false
        });
        if (invoicesError) throw invoicesError;
        setInvoices(invoicesData || []);

        // Calculate total spent from paid invoices
        const paidTotal = (invoicesData || []).filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        setTotalSpent(paidTotal);

        // Fetch company info for the admin who created the invoices
        const adminUserId = invoicesData?.[0]?.user_id;
        let companyData = null;
        if (adminUserId) {
          const { data } = await supabase
            .from('company_info')
            .select('*')
            .eq('user_id', adminUserId)
            .maybeSingle();
          companyData = data;
        }
        setCompanyInfo(companyData);

        // Fetch existing feedback for bookings
        const {
          data: feedbackData
        } = await supabase.from('booking_feedback').select('id, booking_id, rating, comment, declined').eq('client_id', client.id);

        // Map everything to bookings
        const bookingsWithAll = (bookingsData || []).map(booking => {
          const invoice = invoicesData?.find(inv => inv.booking_id === booking.id);
          const feedback = feedbackData?.find(fb => fb.booking_id === booking.id);
          const members = (booking.team_member_ids || []).map(id => teamMap[id]).filter(Boolean);

          return {
            ...booking,
            invoice,
            company_info: companyData,
            feedback,
            team_members: members,
            client: {
              has_allergies: client.has_allergies,
              allergies_notes: client.allergies_notes,
              has_pets: client.has_pets,
              has_children: client.has_children,
              special_instructions: client.special_instructions
            }
          };
        });

        setBookings(bookingsWithAll);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleRatingSubmit = async (bookingId: string, rating: number, comment: string) => {
    if (!clientId) return;
    setSubmittingRating(true);
    try {
      const {
        error
      } = await supabase.from('booking_feedback').insert({
        booking_id: bookingId,
        client_id: clientId,
        rating: rating,
        comment: comment.trim() || null,
        declined: false
      });
      if (error) throw error;

      // Update bookings state
      setBookings(prev => prev.map(b => b.id === bookingId ? {
        ...b,
        feedback: {
          id: '',
          booking_id: bookingId,
          rating: rating,
          comment: comment,
          declined: false
        }
      } : b));
      toast.success('Děkujeme za zpětnou vazbu!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Nepodařilo se odeslat hodnocení');
    } finally {
      setSubmittingRating(false);
    }
  };
  const handleDeclineRating = async (bookingId: string) => {
    if (!clientId) return;
    try {
      const {
        error
      } = await supabase.from('booking_feedback').insert({
        booking_id: bookingId,
        client_id: clientId,
        rating: 0,
        declined: true
      });
      if (error) throw error;

      // Update bookings state
      setBookings(prev => prev.map(b => b.id === bookingId ? {
        ...b,
        feedback: {
          id: '',
          booking_id: bookingId,
          rating: 0,
          comment: null,
          declined: true
        }
      } : b));
    } catch (error) {
      console.error('Error declining rating:', error);
    }
  };
  const handleDownload = async (pdfPath: string) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('invoices').download(pdfPath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfPath.split('/').pop() || 'faktura.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };
  const getStatusText = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Zaplaceno',
      pending: 'K úhradě',
      overdue: 'Po splatnosti',
      draft: 'Koncept',
      issued: 'K úhradě'
    };
    return labels[status] || status;
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 dark:text-green-500';
      case 'overdue':
        return 'text-red-600 dark:text-red-500';
      default:
        return 'text-foreground';
    }
  };
  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      home_cleaning: 'Úklid domácnosti',
      commercial_cleaning: 'Komerční úklid',
      window_cleaning: 'Mytí oken',
      post_construction_cleaning: 'Úklid po rekonstrukci',
      upholstery_cleaning: 'Čištění čalounění',
      cleaning: 'Úklid'
    };
    return labels[serviceType] || serviceType;
  };
  const toggleExpand = (bookingId: string) => {
    setExpandedBookingId(expandedBookingId === bookingId ? null : bookingId);
  };
  const getDaysDiffLabel = (dateStr: string) => {
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Dnes';
    if (diffDays === 1) return 'za 1 den';
    if (diffDays >= 2 && diffDays <= 4) return `za ${diffDays} dny`;
    return `za ${diffDays} dnů`;
  };

  if (loading) {
    return <ClientLoading message="Načítám historii úklidů..." />;
  }
  const paidCount = bookings.filter(b => b.invoice?.status === 'paid').length;
  const pendingCount = bookings.filter(b => b.invoice?.status !== 'paid').length;
  return <div className="container mx-auto p-4 pb-24 space-y-6 max-w-4xl">
    {/* Hero Stats Header */}
    <ClientHeroHeader
      icon={History}
      title="Historie Úklidů"
      subtitle="Přehled Vašich dokončených úklidů"
      stats={[
        {
          icon: Calendar,
          label: "Naplánovaný",
          value: nextScheduledDate ? getDaysDiffLabel(nextScheduledDate) : 'Žádný'
        },
        {
          icon: Clock,
          label: "Poslední úklid",
          value: lastCompletedDate ? format(new Date(lastCompletedDate), 'd. M. yyyy', { locale: cs }) : 'Žádný'
        },
        {
          icon: TrendingUp,
          label: "Investováno",
          value: `${totalSpent.toLocaleString('cs-CZ')} Kč`
        },
        {
          icon: CheckCircle2,
          label: "Hotové",
          value: `${completedCount} úklidů`
        }
      ]}
    />

    {/* Invoices List */}
    <div className="space-y-6">
      {bookings.length === 0 ? (
        <Card className="rounded-[2.5rem] border-0 shadow-lg bg-card">
          <CardContent className="py-20 text-center space-y-4">
            <div className="p-6 rounded-full bg-muted/50 w-fit mx-auto shadow-inner text-muted-foreground/30">
              <History className="h-12 w-12" />
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              <h3 className="text-xl font-black tracking-tight">Zatím nemáte žádnou historii</h3>
              <p className="text-sm text-muted-foreground font-medium">
                Jakmile dokončíte první úklid, najdete jej zde v přehledné historii i s fakturou.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        bookings.map(booking => (
          <BookingCard
            key={booking.id}
            booking={booking}
            onRatingSubmit={handleRatingSubmit}
            isCollapsible={true}
          />
        ))
      )}
    </div>

    {/* Support Section */}
    <div className="pt-12 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="max-w-md mx-auto">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 transition-all hover:shadow-lg group shadow-sm text-center">
          {/* Bubble Animation Background */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 animate-float-circle-1 pointer-events-none" />
          <div className="absolute -right-2 top-16 h-16 w-16 rounded-full bg-primary/10 animate-float-circle-2 pointer-events-none" />
          <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-xl animate-pulse pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 text-primary group-hover:scale-110 transition-transform duration-300">
              <HeadphonesIcon className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-lg text-foreground tracking-tight">Potřebujete s něčím pomoci?</h4>
              <p className="text-sm text-muted-foreground">Jsme tu pro vás, abychom vám pomohli s jakýmkoliv dotazem k vašim úklidům nebo fakturaci.</p>
            </div>

            <a
              href="tel:+420777645610"
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98] mt-2"
            >
              <Phone className="h-5 w-5 fill-current" />
              <span>Zavolat podporu</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>;
}