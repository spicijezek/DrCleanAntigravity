import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, CheckCircle2, Phone, History, HeadphonesIcon, TrendingUp, Eye, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { toast } from 'sonner';
import { BookingCard } from '@/components/client/dashboard/BookingCard';
import { Booking } from '@/types/client-dashboard';
import { useInvoiceDownload } from '@/hooks/useInvoiceDownload';
import { HiddenInvoiceContainer } from '@/components/invoices/HiddenInvoiceContainer';
import maidImage from '@/assets/maid.png';
import { PremiumButton } from '@/components/ui/PremiumButton';

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
              postal_code
            ),
            rooms:booking_rooms (
              id,
              room_name,
              is_completed,
              completed_at,
              sort_order
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
        let localCompanyInfo = null;
        if (adminUserId) {
          const { data } = await supabase.from('company_info').select('*').eq('user_id', adminUserId).maybeSingle();
          if (data) {
            setCompanyInfo(data);
            localCompanyInfo = data;
          }
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
            company_info: localCompanyInfo,
            feedback,
            team_members: members,
            checklist: booking.checklist ? {
              ...booking.checklist,
              rooms: (booking as any).rooms || []
            } : null,
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

        // Set default filter to 'all' to show the prioritized list
        setSelectedStatus('all');
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
  }).sort((a, b) => {
    // Helper to determine priority tier
    const getPriority = (booking: Booking) => {
      // Tier 1: Urgent (In Progress OR Completed + Unpaid)
      const isUnpaid = booking.invoice?.status === 'overdue' || booking.invoice?.status === 'issued';
      if (booking.status === 'in_progress') return 0;
      if (booking.status === 'completed' && isUnpaid) return 0;

      // Tier 2: Active (Pending OR Approved)
      if (booking.status === 'pending' || booking.status === 'approved') return 1;

      // Tier 3: History (Paid, Cancelled, Skipped, etc.)
      return 2;
    };

    const priorityA = getPriority(a);
    const priorityB = getPriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB; // Lower priority score comes first
    }

    // Secondary sort: Date (Newest first)
    return new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime();
  });

  const getDaysDiffLabel = (dateStr: string) => {
    const diff = Math.ceil((new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'Dnes';
    if (diff === 1) return 'za 1 den';
    if (diff < 5) return `za ${diff} dny`;
    return `za ${diff} dnů`;
  };

  // Generate mockup booking for clients with no history
  const generateMockupBooking = (): Booking => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(10, 0, 0, 0);

    // Set started_at to show in-progress status with 75% completion
    const startedAt = new Date();
    startedAt.setHours(startedAt.getHours() - 2); // Started 2 hours ago

    return {
      id: 'mockup-preview',
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
        service_title: 'Úklid domácnosti',
        notes: 'Ukázkový popis úklidu - zde uvidíte své poznámky k objednávce.',
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
      company_info: companyInfo,
      feedback: null,
      team_members: [
        {
          name: 'Anička',
          bio: 'Pravidelně se starám o čistotu v Dr.Clean. Ráda dělám radost svou precizností.',
          user_id: 'mockup-user',
          profile: {
            avatar_url: maidImage,
            full_name: 'Anička'
          }
        }
      ],
      client: {
        has_allergies: false,
        allergies_notes: null,
        has_pets: false,
        has_children: false,
        special_instructions: null
      }
    };
  };

  if (loading) return <LoadingOverlay message="Načítám historii úklidů..." />;

  return (
    <div className="container mx-auto px-4 pt-6 pb-24 space-y-6 max-w-4xl">
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
        {filteredBookings.length === 0 ? (() => {
          // Show mockup booking ONLY when client has no bookings at all and viewing "all"
          if (bookings.length === 0 && selectedStatus === 'all') {
            const mockupBooking = generateMockupBooking();
            return (
              <div className="space-y-6">
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
                      <p className="text-xs text-muted-foreground font-medium">Ukázka toho, jak bude vypadat vaše historie úklidů</p>
                    </div>
                  </div>
                </div>

                {/* Mockup Booking Card with opacity overlay */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-3xl pointer-events-none z-10" />
                  <BookingCard
                    key={mockupBooking.id}
                    booking={mockupBooking}
                    onRatingSubmit={handleRatingSubmit}
                    onDownload={downloadInvoice}
                    isCollapsible={true}
                    currentLoyaltyPoints={loyaltyCredits}
                  />
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4 text-center max-w-md mx-auto">
                  <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm mx-auto flex items-center justify-center text-primary">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">Připraveni na Váš první úklid?</h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Jakmile si objednáte a dokončíte svůj první úklid, najdete jej zde s podobným designem a možností sledovat platby, hodnocení a další detaily.
                    </p>
                  </div>
                  <Link to="/klient/sluzby" className="block">
                    <PremiumButton className="w-full py-2.5 rounded-2xl">
                      <Sparkles className="h-4 w-4" />
                      Objednat první úklid
                    </PremiumButton>
                  </Link>
                </div>
              </div>
            );
          }

          // Show empty state message for filtered views
          const getEmptyStateContent = () => {
            switch (selectedStatus) {
              case 'pending':
                return {
                  title: 'Žádný úklid momentálně nečeká na schválení',
                  subtitle: 'Zde uvidíte detail objednávky.'
                };
              case 'approved':
                return {
                  title: 'Nemáte žádný schválený úklid',
                  subtitle: 'Zde uvidíte detail objednávky.'
                };
              case 'in_progress':
                return {
                  title: 'Momentálně neprobíhá žádný úklid',
                  subtitle: 'Zde uvidíte detail objednávky.'
                };
              case 'completed':
                return {
                  title: 'Nemáte žádný dokončený úklid',
                  subtitle: 'Zde uvidíte detail objednávky.'
                };
              case 'paid':
                return {
                  title: 'Nemáte žádný zaplacený úklid',
                  subtitle: 'Zde uvidíte detail objednávky.'
                };
              case 'cancelled':
                return {
                  title: 'Nemáte žádný zrušený úklid',
                  subtitle: 'Zde uvidíte detail objednávky.'
                };
              default:
                return {
                  title: 'Zatím nemáte žádnou historii',
                  subtitle: 'Jakmile dokončíte první úklid, najdete jej zde.'
                };
            }
          };
          const content = getEmptyStateContent();
          return (
            <Card className="rounded-[2.5rem] border-0 shadow-lg bg-card py-20 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-black tracking-tight">{content.title}</h3>
              <p className="text-sm text-muted-foreground">{content.subtitle}</p>
            </Card>
          );
        })() : (
          filteredBookings.map(booking => (
            <BookingCard key={booking.id} booking={booking} onRatingSubmit={handleRatingSubmit} onDownload={downloadInvoice} isCollapsible={true} currentLoyaltyPoints={loyaltyCredits} />
          ))
        )}
      </div>

      <div className="pb-12 max-w-md mx-auto text-center">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="h-14 w-14 rounded-full bg-white dark:bg-slate-800 shadow-sm mx-auto flex items-center justify-center text-primary"><HeadphonesIcon className="h-7 w-7" /></div>
          <div className="space-y-1">
            <h4 className="font-bold text-lg">Potřebujete s něčím pomoci?</h4>
            <p className="text-sm text-muted-foreground">Jsme tu pro vás s jakýmkoliv dotazem k vašim úklidům nebo fakturaci.</p>
          </div>
          <PremiumButton
            className="w-full py-2.5 rounded-2xl text-base"
            onClick={() => window.location.href = 'tel:+420777645610'}
          >
            <Phone className="h-4 w-4" />
            Zavolat podporu
          </PremiumButton>
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