import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, CheckCircle2, Phone, History, HeadphonesIcon, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { toast } from 'sonner';
import { BookingCard } from '@/components/client/dashboard/BookingCard';
import { Booking } from '@/types/client-dashboard';
import { useInvoiceDownload } from '@/hooks/useInvoiceDownload';
import { HiddenInvoiceContainer } from '@/components/invoices/HiddenInvoiceContainer';

export default function ClientBilling() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [nextScheduledDate, setNextScheduledDate] = useState<string | null>(null);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loyaltyCredits, setLoyaltyCredits] = useState<number>(0);

  const { downloadInvoice, generatingInvoiceId, invoiceItems, previewInvoice } = useInvoiceDownload();

  // Status filter state
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, has_allergies, allergies_notes, has_pets, has_children, special_instructions')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) throw clientError;

      if (client) {
        setClientId(client.id);

        // Count completed bookings and get last completed date
        const { data: completedBookings, count: completedBookingsCount } = await supabase
          .from('bookings')
          .select('scheduled_date', { count: 'exact' })
          .eq('client_id', client.id)
          .eq('status', 'completed')
          .order('scheduled_date', { ascending: false })
          .limit(1);

        setCompletedCount(completedBookingsCount || 0);
        setLastCompletedDate(completedBookings?.[0]?.scheduled_date || null);

        // Get next scheduled booking
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: upcomingBookings } = await supabase
          .from('bookings')
          .select('scheduled_date')
          .eq('client_id', client.id)
          .eq('status', 'approved')
          .gte('scheduled_date', today.toISOString())
          .order('scheduled_date', { ascending: true })
          .limit(1);

        setNextScheduledDate(upcomingBookings?.[0]?.scheduled_date || null);

        // Fetch bookings with invoices
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
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
          `)
          .eq('client_id', client.id)
          .order('scheduled_date', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Fetch team members
        const { data: teamData } = await supabase
          .from('team_members')
          .select('id, name, bio, user_id');

        const teamMap: Record<string, any> = {};
        if (teamData && teamData.length > 0) {
          const userIds = teamData.map(m => m.user_id).filter(Boolean);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, avatar_url, full_name')
            .in('user_id', userIds);

          const profilesMap: Record<string, any> = {};
          profilesData?.forEach(p => profilesMap[p.user_id] = p);

          teamData.forEach(m => {
            teamMap[m.id] = { ...m, profile: profilesMap[m.user_id] || null };
          });
        }

        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select('*')
          .or(`client_id.eq.${client.id},booking_id.in.(${bookingsData?.map(b => b.id).join(',') || ''})`)
          .order('date_created', { ascending: false });

        if (invoicesError) throw invoicesError;

        // Calculate total spent
        const paidTotal = (invoicesData || []).filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
        setTotalSpent(paidTotal);

        // Company Info
        const adminUserId = invoicesData?.[0]?.user_id;
        if (adminUserId) {
          const { data } = await supabase.from('company_info').select('*').eq('user_id', adminUserId).maybeSingle();
          setCompanyInfo(data);
        }

        // Loyalty
        const { data: loyaltyData } = await supabase.from('loyalty_credits').select('current_credits').eq('client_id', client.id).maybeSingle();
        if (loyaltyData) setLoyaltyCredits(loyaltyData.current_credits);

        // Map feedback
        const { data: feedbackData } = await supabase.from('booking_feedback').select('*').eq('client_id', client.id);

        const bookingsWithAll = (bookingsData || []).map(booking => {
          const invoice = invoicesData?.find(inv => inv.booking_id === booking.id);
          const feedback = feedbackData?.find(fb => fb.booking_id === booking.id);
          const members = (booking.team_member_ids || []).map(id => teamMap[id]).filter(Boolean);

          return {
            ...booking,
            invoice,
            company_info: companyInfo,
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

        // Set default filter
        if (bookingsWithAll.some(b => b.status === 'completed')) setSelectedStatus('completed');
        else setSelectedStatus('all');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingSubmit = async (bookingId: string, rating: number, comment: string) => {
    if (!clientId) return;
    try {
      const { error } = await supabase.from('booking_feedback').insert({
        booking_id: bookingId,
        client_id: clientId,
        rating,
        comment: comment.trim() || null,
        declined: false
      });
      if (error) throw error;
      loadData(); // Reload to update UI
      toast.success('Děkujeme za zpětnou vazbu!');
    } catch (error) {
      toast.error('Nepodařilo se odeslat hodnocení');
    }
  };

  const statusFilters = [
    { key: 'all', label: 'Vše' },
    { key: 'pending', label: 'Čeká' },
    { key: 'approved', label: 'Schváleno' },
    { key: 'in_progress', label: 'Probíhá' },
    { key: 'completed', label: 'Dokončeno' },
    { key: 'paid', label: 'Zaplaceno' },
    { key: 'cancelled', label: 'Zrušeno' }
  ];

  const filteredBookings = bookings.filter(b => {
    if (selectedStatus === 'all') return true;
    if (selectedStatus === 'paid') return b.invoice?.status === 'paid';
    return b.status === selectedStatus;
  }).sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());

  const getDaysDiffLabel = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Dnes';
    if (diff === 1) return 'za 1 den';
    if (diff < 5) return `za ${diff} dny`;
    return `za ${diff} dnů`;
  };

  if (loading) return <LoadingOverlay message="Načítám historii úklidů..." />;

  return (
    <div className="container mx-auto p-4 pb-24 space-y-6 max-w-4xl">
      <ClientHeroHeader
        icon={History}
        title="Historie Úklidů"
        subtitle="Přehled Vašich dokončených úklidů"
        stats={[
          { icon: Calendar, label: "Naplánovaný", value: nextScheduledDate ? getDaysDiffLabel(nextScheduledDate) : 'Žádný' },
          { icon: Clock, label: "Poslední úklid", value: lastCompletedDate ? format(new Date(lastCompletedDate), 'd. M. yyyy', { locale: cs }) : 'Žádný' },
          { icon: TrendingUp, label: "Investováno", value: `${totalSpent.toLocaleString('cs-CZ')} Kč` },
          { icon: CheckCircle2, label: "Hotové", value: `${completedCount} úklidů` }
        ]}
      />

      <div className="-mx-4 px-4 overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-2">
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setSelectedStatus(f.key)}
              className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${selectedStatus === f.key ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-muted/50 text-muted-foreground'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {filteredBookings.length === 0 ? (
          <Card className="rounded-[2.5rem] border-0 shadow-lg bg-card py-20 text-center">
            <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-black tracking-tight">Zatím nemáte žádnou historii</h3>
            <p className="text-sm text-muted-foreground">Jakmile dokončíte první úklid, najdete jej zde.</p>
          </Card>
        ) : (
          filteredBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} onRatingSubmit={handleRatingSubmit} onDownload={downloadInvoice} isCollapsible={true} currentLoyaltyPoints={loyaltyCredits} />
          ))
        )}
      </div>

      <div className="pt-12 pb-12 max-w-md mx-auto text-center">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm mx-auto flex items-center justify-center text-primary"><HeadphonesIcon className="h-7 w-7" /></div>
          <div className="space-y-1">
            <h4 className="font-bold text-lg">Potřebujete s něčím pomoci?</h4>
            <p className="text-sm text-muted-foreground">Jsme tu pro vás s jakýmkoliv dotazem k vašim úklidům nebo fakturaci.</p>
          </div>
          <a href="tel:+420777645610" className="flex items-center justify-center gap-3 px-6 py-4 bg-primary text-primary-foreground font-bold rounded-2xl shadow-xl transition-all active:scale-95"><Phone className="h-5 w-5" /><span>Zavolat podporu</span></a>
        </div>
      </div>

      <HiddenInvoiceContainer
        generatingInvoiceId={generatingInvoiceId}
        previewInvoice={previewInvoice}
        companyInfo={companyInfo}
        invoiceItems={invoiceItems}
        bookings={bookings}
      />
    </div>
  );
}