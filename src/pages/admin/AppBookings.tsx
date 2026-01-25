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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Plus, Search, Calendar
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_rooms' }, () => {
        // Update when any booking room changes (live progress)
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
          booking_feedback (rating, comment, declined),
          invoiced:invoices!invoice_id(id, invoice_number, status, pdf_path, total, variable_symbol),
          linked_invoices:invoices!booking_id(id, invoice_number, status, pdf_path, total, variable_symbol)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Extract only non-declined feedback and merge duplicate invoice joins
      const processedBookings = (bookingsData || []).map(b => ({
        ...b,
        feedback: b.booking_feedback?.[0] && !b.booking_feedback[0].declined ? b.booking_feedback[0] : null,
        invoices: b.invoiced && b.invoiced.length > 0 ? b.invoiced : (b.linked_invoices || [])
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
              .from('booking_rooms')
              .select('id, room_name, is_completed, completed_at')
              .eq('booking_id', b.id)
              .order('sort_order', { ascending: true });

            return {
              ...b,
              checklist: { ...checklist, rooms: rooms || [] },
              checklist_rooms: rooms || [] // For BookingCard property
            };
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

  const handleDeleteClick = (bookingId: string) => {
    setBookingToDelete(bookingId);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingToDelete);
      if (error) throw error;
      toast({ title: 'Smazáno', description: 'Rezervace byla úspěšně smazána' });
      setBookingToDelete(null);
      loadBookings();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Chyba při mazání', description: error.message });
      setBookingToDelete(null);
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
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Vytvořit rezervaci
            </Button>
          }
        />

        {/* Clean Filter Container - Monday.com Inspired */}
        <div className="bg-card border border-border p-6 rounded-xl shadow-soft space-y-6">
          {/* Filters Row */}
          <div className="filter-container flex flex-col lg:flex-row gap-4 items-start lg:items-center flex-wrap">
            {/* Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:flex-1">
              <span className="text-sm font-bold whitespace-nowrap">Search:</span>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Hledat rezervaci..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-sm font-bold whitespace-nowrap">Status:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="pending">Čekající</SelectItem>
                  <SelectItem value="active">Aktivní</SelectItem>
                  <SelectItem value="completed">Dokončené</SelectItem>
                  <SelectItem value="other">Ostatní</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timeline Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
              <span className="text-sm font-bold whitespace-nowrap">Period:</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select period" />
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

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div className="bg-primary-light p-6 rounded-xl border border-border animate-in fade-in zoom-in-95 duration-300">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Custom Date Range
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customStartDate" className="text-xs font-bold ml-1 uppercase text-muted-foreground">Od:</Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEndDate" className="text-xs font-bold ml-1 uppercase text-muted-foreground">Do:</Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

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
                onDelete={handleDeleteClick}
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

        <AlertDialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Smazat rezervaci?</AlertDialogTitle>
              <AlertDialogDescription>
                Tato akce je nevratná. Rezervace a všechna související data budou trvale odstraněna.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zrušit</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Smazat
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
