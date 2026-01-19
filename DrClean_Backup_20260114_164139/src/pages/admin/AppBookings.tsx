
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { BookingCard } from '@/components/admin/bookings/BookingCard';
import { BookingDetailDialog } from '@/components/admin/bookings/BookingDetailDialog';
import { CreateBookingDialog } from '@/components/admin/CreateBookingDialog';
import { Button } from '@/components/ui/button';
import {
  Plus, Search, LayoutGrid, Clock, PlayCircle, CheckCircle2, History, TrendingUp, Filter, Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { subDays, startOfDay, endOfDay, isWithinInterval, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export default function AppBookings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  useEffect(() => {
    loadData();

    const bookingChannel = supabase
      .channel('admin-booking-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadBookings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'checklist_rooms' }, () => {
        // Find if any currently loaded booking is affected by this checklist room change
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadTeamMembers(), loadClients()]);
    setLoading(false);
  };

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (
            name, email, phone, address, city, 
            has_children, has_pets, has_allergies, 
            allergies_notes, special_instructions
          ),
          booking_feedback (rating, comment, declined)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract only non-declined feedback
      const processedBookings = (bookingsData || []).map(b => ({
        ...b,
        feedback: b.booking_feedback?.[0] && !b.booking_feedback[0].declined ? b.booking_feedback[0] : null
      }));

      // Fetch checklist details for each booking that has a checklist_id
      const bookingsWithChecklists = await Promise.all(processedBookings.map(async (b) => {
        if (b.checklist_id) {
          const { data: checklist } = await supabase
            .from('client_checklists')
            .select('*')
            .eq('id', b.checklist_id)
            .maybeSingle();

          if (checklist) {
            const { data: rooms } = await supabase
              .from('checklist_rooms')
              .select('id, room_name, is_completed, completed_at')
              .eq('checklist_id', b.checklist_id)
              .order('sort_order', { ascending: true });

            return { ...b, checklist: { ...checklist, rooms: rooms || [] } };
          }
        }
        return b;
      }));

      setBookings(bookingsWithChecklists);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Chyba načítání', description: error.message });
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error loading team members:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('id, name, user_id')
        .order('name');
      setClients(data || []);
    } catch (error: any) {
      console.error('Error loading clients:', error);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Opravdu chcete smazat tuto rezervaci?')) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Smazáno', description: 'Rezervace byla úspěšně smazána' });
      loadBookings();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Chyba při mazání', description: error.message });
    }
  };

  const handleCreateInvoice = (bookingId: string) => {
    navigate('/invoices/generator', { state: { bookingId } });
  };

  const handleViewDetail = (booking: any) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
  };

  const getFilteredBookings = () => {
    let result = bookings;

    // 1. Text Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.clients?.name?.toLowerCase().includes(query) ||
        b.address.toLowerCase().includes(query) ||
        b.service_type.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query)
      );
    }

    // 2. Status Filter
    switch (filter) {
      case 'active':
        result = result.filter(b => ['approved', 'in_progress'].includes(b.status));
        break;
      case 'pending':
        result = result.filter(b => b.status === 'pending');
        break;
      case 'completed':
        result = result.filter(b => b.status === 'completed');
        break;
      case 'other':
        result = result.filter(b => ['cancelled', 'declined', 'paid'].includes(b.status));
        break;
      default:
        // 'all' - no filter needed
        break;
    }

    // 3. Period Filter
    if (selectedPeriod !== 'all') {
      const now = new Date();
      let start, end;

      switch (selectedPeriod) {
        case 'today':
          start = startOfDay(now);
          end = endOfDay(now);
          break;
        case '7days':
          start = subDays(now, 7);
          end = endOfDay(now);
          break;
        case '30days':
          start = subDays(now, 30);
          end = endOfDay(now);
          break;
        case 'thisMonth':
          start = startOfMonth(now);
          end = endOfMonth(now);
          break;
        case 'lastMonth':
          start = startOfMonth(subDays(startOfMonth(now), 1));
          end = endOfMonth(subDays(startOfMonth(now), 1));
          break;
        case 'thisQuarter':
          start = startOfQuarter(now);
          end = endOfQuarter(now);
          break;
        case 'thisYear':
          start = startOfYear(now);
          end = endOfYear(now);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            start = startOfDay(parseISO(customStartDate));
            end = endOfDay(parseISO(customEndDate));
          }
          break;
      }

      if (start && end) {
        result = result.filter((b) => {
          const bookingDate = parseISO(b.created_at);
          return isWithinInterval(bookingDate, { start, end });
        });
      }
    }

    return result;
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return <LoadingOverlay message="Načítám rezervace..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground/90 leading-none">Objednávky</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/60" />
              Správa rezervací z klientské aplikace
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-[1.25rem] h-12 px-8 font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Vytvořit rezervaci
          </Button>
        </div>

        {/* Glassmorphic Filter Bar */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000 space-y-4">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Hledat rezervaci podle jména, adresy nebo služby..."
                className="pl-12 h-14 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all w-full text-base font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 pl-4 pr-2 h-14 rounded-2xl border border-white/40 shadow-sm min-w-[240px] transition-all hover:shadow-md">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                <TrendingUp className="h-4 w-4" />
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto font-black text-slate-700 dark:text-slate-200 text-sm">
                  <SelectValue placeholder="Období" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 max-h-[400px]">
                  <SelectItem value="all" className="rounded-xl font-bold px-4 py-2.5">Celá historie</SelectItem>
                  <SelectItem value="today" className="rounded-xl font-bold px-4 py-2.5">Dnes</SelectItem>
                  <SelectItem value="7days" className="rounded-xl font-bold px-4 py-2.5">Posledních 7 dní</SelectItem>
                  <SelectItem value="30days" className="rounded-xl font-bold px-4 py-2.5">Posledních 30 dní</SelectItem>
                  <SelectItem value="thisMonth" className="rounded-xl font-bold px-4 py-2.5">Tento měsíc</SelectItem>
                  <SelectItem value="lastMonth" className="rounded-xl font-bold px-4 py-2.5">Minulý měsíc</SelectItem>
                  <SelectItem value="thisQuarter" className="rounded-xl font-bold px-4 py-2.5">Toto čtvrtletí</SelectItem>
                  <SelectItem value="thisYear" className="rounded-xl font-bold px-4 py-2.5">Tento rok</SelectItem>
                  <SelectItem value="custom" className="rounded-xl font-bold px-4 py-2.5">Vlastní rozsah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-2 px-2">
            <ToggleGroup type="single" value={filter} onValueChange={(val) => val && setFilter(val)} className="justify-start gap-2 h-12">
              <ToggleGroupItem value="all" className="rounded-full px-6 h-10 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200/50 bg-white/50 text-[10px] font-black uppercase tracking-widest transition-all gap-2 min-w-fit">
                <LayoutGrid className="h-4 w-4" /> Vše
              </ToggleGroupItem>
              <ToggleGroupItem value="pending" className="rounded-full px-6 h-10 data-[state=on]:bg-amber-500 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200/50 bg-white/50 text-[10px] font-black uppercase tracking-widest transition-all gap-2 min-w-fit">
                <Clock className="h-4 w-4" /> Čekající
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-white/30 text-white border-0 text-[9px] h-4 min-w-[1.25rem] px-1 font-black">
                    {bookings.filter(b => b.status === 'pending').length}
                  </Badge>
                )}
              </ToggleGroupItem>
              <ToggleGroupItem value="active" className="rounded-full px-6 h-10 data-[state=on]:bg-indigo-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200/50 bg-white/50 text-[10px] font-black uppercase tracking-widest transition-all gap-2 min-w-fit">
                <PlayCircle className="h-4 w-4" /> Aktivní
              </ToggleGroupItem>
              <ToggleGroupItem value="completed" className="rounded-full px-6 h-10 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200/50 bg-white/50 text-[10px] font-black uppercase tracking-widest transition-all gap-2 min-w-fit">
                <CheckCircle2 className="h-4 w-4" /> Dokončené
              </ToggleGroupItem>
              <ToggleGroupItem value="other" className="rounded-full px-6 h-10 data-[state=on]:bg-slate-700 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200/50 bg-white/50 text-[10px] font-black uppercase tracking-widest transition-all gap-2 min-w-fit">
                <History className="h-4 w-4" /> Ostatní
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {selectedPeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/30 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Datum od</Label>
              <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-12 bg-white/50 border-0 rounded-xl shadow-sm focus-visible:ring-primary/20" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Datum do</Label>
              <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-12 bg-white/50 border-0 rounded-xl shadow-sm focus-visible:ring-primary/20" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-24">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-xl animate-in fade-in zoom-in duration-700">
              <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                <Filter className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Žádné rezervace</h3>
              <p className="text-muted-foreground font-medium text-center max-w-xs">
                V této kategorii jsme nenašli žádné záznamy.
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetail={handleViewDetail}
                onDelete={handleDelete}
                onCreateInvoice={handleCreateInvoice}
              />
            ))
          )}
        </div>

        <BookingDetailDialog
          booking={selectedBooking}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedBooking(null);
          }}
          onUpdate={loadBookings}
          teamMembers={teamMembers}
        />

        {showCreateDialog && (
          <CreateBookingDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSuccess={loadBookings}
            teamMembers={teamMembers}
            clients={clients}
          />
        )}
      </div>
    </Layout>
  );
}
