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
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="App Bookings"
          description="Spravujte rezervace z klientské aplikace"
          action={
            <Button
              onClick={() => setShowCreateDialog(true)}
              variant="outline"
              className="shadow-sm hover:shadow-md transition-all rounded-xl border-primary/20 text-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Vytvořit rezervaci
            </Button>
          }
        />

        {/* Glassmorphic Filter Bar */}
        <div className="flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">

          {/* Top Row: Search & Period (Mobile) / Left Side (Desktop) */}
          <div className="flex flex-col sm:flex-row gap-3 xl:w-auto w-full">
            <div className="relative group flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-blue-500" />
              <Input
                placeholder="Hledat rezervaci..."
                className="pl-12 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all w-full text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-white/10 shadow-sm sm:w-auto w-full">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-2 h-auto text-sm font-medium min-w-[140px]">
                  <SelectValue placeholder="Období" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Celá historie</SelectItem>
                  <SelectItem value="today">Dnes</SelectItem>
                  <SelectItem value="7days">Posledních 7 dní</SelectItem>
                  <SelectItem value="30days">Posledních 30 dní</SelectItem>
                  <SelectItem value="thisMonth">Tento měsíc</SelectItem>
                  <SelectItem value="lastMonth">Minulý měsíc</SelectItem>
                  <SelectItem value="thisQuarter">Toto čtvrtletí</SelectItem>
                  <SelectItem value="thisYear">Tento rok</SelectItem>
                  <SelectItem value="custom">Vlastní rozsah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Row: Status Pills (Mobile) / Right Side (Desktop) */}
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <ToggleGroup type="single" value={filter} onValueChange={(val) => val && setFilter(val)} className="justify-start xl:justify-end w-full gap-2">
              <ToggleGroupItem value="all" className="rounded-full px-4 h-11 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <LayoutGrid className="h-4 w-4" /> Vše
              </ToggleGroupItem>
              <ToggleGroupItem value="pending" className="rounded-full px-4 h-11 data-[state=on]:bg-amber-500 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <Clock className="h-4 w-4" /> Čekající
                {bookings.filter(b => b.status === 'pending').length > 0 && (
                  <span className="ml-1 bg-white/30 px-1.5 py-0.5 rounded-full text-[10px] backdrop-blur-sm">
                    {bookings.filter(b => b.status === 'pending').length}
                  </span>
                )}
              </ToggleGroupItem>
              <ToggleGroupItem value="active" className="rounded-full px-4 h-11 data-[state=on]:bg-indigo-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <PlayCircle className="h-4 w-4" /> Aktivní
              </ToggleGroupItem>
              <ToggleGroupItem value="completed" className="rounded-full px-4 h-11 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <CheckCircle2 className="h-4 w-4" /> Dokončené
              </ToggleGroupItem>
              <ToggleGroupItem value="other" className="rounded-full px-4 h-11 data-[state=on]:bg-slate-700 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <History className="h-4 w-4" /> Ostatní
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {selectedPeriod === 'custom' && (
          <div className="flex items-end gap-4 bg-card p-4 rounded-xl border shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="space-y-2">
              <Label>Od</Label>
              <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Do</Label>
              <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
          {filteredBookings.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-card/50 backdrop-blur-sm rounded-3xl border border-dashed border-muted-foreground/20">
              <p className="text-muted-foreground">Žádné rezervace v této kategorii.</p>
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
