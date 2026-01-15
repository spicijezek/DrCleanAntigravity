import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CalendarIcon, ClockIcon, MapPinIcon, UserIcon, CheckCircle, CheckCircle2, XCircle, Eye, Users, Trash2, Plus, FileText, Clock, Star, Save, X, Banknote } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingDetailsDisplay } from '@/components/bookings/BookingDetailsDisplay';
import { PhotoGallery } from '@/components/bookings/PhotoGallery';
import { CreateBookingDialog } from '@/components/admin/CreateBookingDialog';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';

interface ChecklistRoom {
  id: string;
  room_name: string;
  is_completed: boolean;
  completed_at: string | null;
}

interface BookingFeedback {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  client_id: string;
  service_type: string;
  scheduled_date: string;
  address: string;
  booking_details: any;
  status: string;
  team_member_ids: string[];
  admin_notes: string | null;
  checklist_id: string | null;
  invoice_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  skip_invoice: boolean;
  clients?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    has_children: boolean;
    has_pets: boolean;
    has_allergies: boolean;
    allergies_notes: string;
    special_instructions: string;
  };
  team_members?: {
    id: string;
    name: string;
  }[];
  checklist_rooms?: ChecklistRoom[];
  invoice?: {
    id: string;
    invoice_number: string;
    status: string;
  } | null;
  feedback?: BookingFeedback | null;
}

interface TeamMember {
  id: string;
  name: string;
}

export default function AppBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string; user_id: string }>>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [checklists, setChecklists] = useState<Array<{ id: string; street: string; city: string | null; postal_code: string | null }>>([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const [skipInvoice, setSkipInvoice] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    scheduled_date: string;
    scheduled_time: string;
    address: string;
    status: string;
    booking_details: any;
  } | null>(null);

  useEffect(() => {
    loadBookings();
    loadTeamMembers();
    loadClients();

    // Real-time subscription for booking updates
    const bookingChannel = supabase
      .channel('admin-booking-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadBookings();
        }
      )
      .subscribe();

    // Real-time subscription for checklist room updates
    const roomChannel = supabase
      .channel('admin-room-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'checklist_rooms'
        },
        (payload) => {
          // Update the specific room in bookings state
          setBookings(prev => prev.map(booking => {
            if (booking.checklist_rooms) {
              const updatedRooms = booking.checklist_rooms.map(room =>
                room.id === payload.new.id
                  ? { ...room, is_completed: payload.new.is_completed, completed_at: payload.new.completed_at }
                  : room
              );
              return { ...booking, checklist_rooms: updatedRooms };
            }
            return booking;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(roomChannel);
    };
  }, []);

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch client details, team members, and checklist rooms for each booking
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: client } = await supabase
            .from('clients')
            .select('name, email, phone, address, city, has_children, has_pets, has_allergies, allergies_notes, special_instructions')
            .eq('id', booking.client_id)
            .single();

          let team_members = [];
          if (booking.team_member_ids && booking.team_member_ids.length > 0) {
            const { data: teamData } = await supabase
              .from('team_members')
              .select('id, name')
              .in('id', booking.team_member_ids);
            team_members = teamData || [];
          }

          // Fetch checklist rooms if booking has a checklist
          let checklist_rooms: ChecklistRoom[] = [];
          if (booking.checklist_id) {
            const { data: roomsData } = await supabase
              .from('checklist_rooms')
              .select('id, room_name, is_completed, completed_at, sort_order')
              .eq('checklist_id', booking.checklist_id)
              .order('sort_order', { ascending: true });
            checklist_rooms = roomsData || [];
          }

          // Fetch invoice if booking has one
          let invoice = null;
          if (booking.invoice_id) {
            const { data: invoiceData } = await supabase
              .from('invoices')
              .select('id, invoice_number, status')
              .eq('id', booking.invoice_id)
              .single();
            invoice = invoiceData;
          }

          // Fetch feedback for this booking
          const { data: feedbackData } = await supabase
            .from('booking_feedback')
            .select('id, rating, comment, created_at, declined')
            .eq('booking_id', booking.id)
            .maybeSingle();

          return {
            ...booking,
            clients: client,
            team_members,
            checklist_rooms,
            invoice,
            feedback: feedbackData && !feedbackData.declined ? feedbackData : null
          };
        })
      );

      setBookings(bookingsWithDetails);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba načítání',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('is_active', true);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Error loading team members:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, user_id')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error loading clients:', error);
    }
  };

  const handleUpdateTeamMembers = async (bookingId: string) => {
    if (selectedTeamMembers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: 'Prosím vyberte alespoň jednoho člena týmu'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          team_member_ids: selectedTeamMembers,
          admin_notes: adminNotes,
          checklist_id: selectedChecklistId || null,
          skip_invoice: skipInvoice,
          booking_details: selectedBooking?.booking_details
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Aktualizováno',
        description: 'Členové týmu byli úspěšně aktualizováni'
      });

      setSelectedBooking(null);
      loadBookings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: error.message
      });
    }
  };

  const handleApprove = async (bookingId: string) => {
    if (selectedTeamMembers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: 'Prosím vyberte alespoň jednoho člena týmu'
      });
      return;
    }

    try {
      // If a checklist is selected, reset all rooms to not completed
      if (selectedChecklistId) {
        const { error: resetError } = await supabase
          .from('checklist_rooms')
          .update({
            is_completed: false,
            completed_at: null,
            completed_by: null
          })
          .eq('checklist_id', selectedChecklistId);

        if (resetError) throw resetError;
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'approved',
          team_member_ids: selectedTeamMembers,
          admin_notes: adminNotes,
          checklist_id: selectedChecklistId || null,
          skip_invoice: skipInvoice,
          booking_details: selectedBooking?.booking_details
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Schváleno',
        description: 'Rezervace byla úspěšně schválena'
      });

      setSelectedBooking(null);
      loadBookings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: error.message
      });
    }
  };

  const handleDecline = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'declined',
          admin_notes: adminNotes
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Zamítnuto',
        description: 'Rezervace byla zamítnuta'
      });

      setSelectedBooking(null);
      loadBookings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: error.message
      });
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Opravdu chcete smazat tuto rezervaci? Tuto akci nelze vrátit zpět.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: 'Smazáno',
        description: 'Rezervace byla úspěšně smazána'
      });

      setSelectedBooking(null);
      loadBookings();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba při mazání',
        description: error.message
      });
    }
  };

  const openBookingDialog = async (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedTeamMembers(booking.team_member_ids || []);
    setAdminNotes(booking.admin_notes || '');
    setSelectedChecklistId(booking.checklist_id || '');
    setSkipInvoice(booking.skip_invoice || false);
    setIsEditing(false);
    setEditFormData(null);

    // Load checklists for this client
    try {
      const { data } = await supabase
        .from('client_checklists')
        .select('id, street, city, postal_code')
        .eq('client_id', booking.client_id);

      setChecklists(data || []);
    } catch (error) {
      console.error('Error loading checklists:', error);
      setChecklists([]);
    }
  };

  const startEditing = () => {
    if (!selectedBooking) return;

    const scheduledDateTime = selectedBooking.scheduled_date ? new Date(selectedBooking.scheduled_date) : null;

    // Extract date in YYYY-MM-DD format
    const dateStr = scheduledDateTime
      ? `${scheduledDateTime.getFullYear()}-${String(scheduledDateTime.getMonth() + 1).padStart(2, '0')}-${String(scheduledDateTime.getDate()).padStart(2, '0')}`
      : '';

    // Extract time in HH:MM format (local time)
    const timeStr = scheduledDateTime
      ? `${String(scheduledDateTime.getHours()).padStart(2, '0')}:${String(scheduledDateTime.getMinutes()).padStart(2, '0')}`
      : '';

    setEditFormData({
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      address: selectedBooking.address,
      status: selectedBooking.status,
      booking_details: { ...selectedBooking.booking_details }
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const saveEditing = async () => {
    if (!selectedBooking || !editFormData) return;

    try {
      // Combine date and time into a proper ISO string
      let scheduledDateTime: string;
      if (editFormData.scheduled_date && editFormData.scheduled_time) {
        // Create a local Date object and convert to ISO string
        const [year, month, day] = editFormData.scheduled_date.split('-').map(Number);
        const [hours, minutes] = editFormData.scheduled_time.split(':').map(Number);
        const localDate = new Date(year, month - 1, day, hours, minutes, 0);
        scheduledDateTime = localDate.toISOString();
      } else if (editFormData.scheduled_date) {
        scheduledDateTime = new Date(editFormData.scheduled_date).toISOString();
      } else {
        scheduledDateTime = selectedBooking.scheduled_date;
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          scheduled_date: scheduledDateTime,
          address: editFormData.address,
          status: editFormData.status,
          booking_details: editFormData.booking_details,
          team_member_ids: selectedTeamMembers,
          admin_notes: adminNotes,
          checklist_id: selectedChecklistId || null
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Rezervace byla úspěšně aktualizována'
      });

      setIsEditing(false);
      setEditFormData(null);
      loadBookings();

      // Update the selected booking with new data
      const updatedBooking = {
        ...selectedBooking,
        scheduled_date: scheduledDateTime,
        address: editFormData.address,
        status: editFormData.status,
        booking_details: editFormData.booking_details,
        team_member_ids: selectedTeamMembers,
        admin_notes: adminNotes,
        checklist_id: selectedChecklistId || null
      };
      setSelectedBooking(updatedBooking);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: error.message
      });
    }
  };

  const updateBookingDetail = (key: string, value: any) => {
    if (!editFormData) return;
    setEditFormData(prev => prev ? ({
      ...prev,
      booking_details: {
        ...prev.booking_details,
        [key]: value
      }
    }) : null);
  };

  // Helper functions for translations
  const translateCleaningType = (value: any) => {
    if (!value) return 'Domácnost';
    const str = String(value).toLowerCase();
    if (str === 'firmy' || str === 'firemni' || str === 'office') return 'Firma';
    return 'Domácnost';
  };

  const translateHouseholdType = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'byt' || str === 'apartment') return 'Byt';
    if (str === 'rodinny_dum' || str === 'house' || str === 'rodinný dům') return 'Rodinný dům';
    return value;
  };

  const translateEquipmentOption = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'with' || str === 'ano' || str === 'mam') return 'Mám vybavení';
    if (str === 'without' || str === 'ne' || str === 'nemam') return 'Nemám vybavení';
    return value;
  };

  const translateDirtiness = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'light' || str === 'nizka' || str === 'nizke' || str === 'nízké') return 'Nízké';
    if (str === 'medium' || str === 'stredni' || str === 'střední') return 'Střední';
    if (str === 'heavy' || str === 'vysoka' || str === 'vysoke' || str === 'vysoké') return 'Vysoké';
    return value;
  };

  const translateFrequency = (value: any) => {
    if (!value) return undefined;
    const str = String(value).toLowerCase();
    if (str === 'weekly' || str === 'tydne' || str === 'týdně') return 'Týdně';
    if (str === 'biweekly' || str === 'ctyrtydne' || str === 'dvoutýdně') return 'Každé 2 týdny';
    if (str === 'monthly' || str === 'mesicne' || str === 'měsíčně') return 'Měsíčně';
    if (str.includes('jednoraz') || str === 'onetime') return 'Jednorázově';
    return value;
  };

  // Get value from booking details with multiple possible keys
  const getValue = (obj: any, ...keys: string[]): any => {
    for (const key of keys) {
      if (obj?.[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        return obj[key];
      }
    }
    return undefined;
  };

  if (loading) {
    return <LoadingOverlay message="Načítám rezervace..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="App Bookings"
          description="Spravujte rezervace z klientské aplikace"
          action={
            <Button
              onClick={() => navigate('/klient/sluzby')}
              variant="outline"
              className="shadow-sm hover:shadow-md transition-all rounded-xl border-primary/20 text-primary hover:bg-primary/5"
            >
              <Plus className="h-4 w-4 mr-2" />
              Vytvořit rezervaci
            </Button>
          }
        />

        <div className="grid gap-6">
          {bookings.map((booking) => {
            const isPending = booking.status === 'pending';
            const isApproved = booking.status === 'approved';
            const isDeclined = booking.status === 'declined';
            const isCompleted = booking.status === 'completed';
            const details = booking.booking_details;

            const statusColorClass = isPending ? 'from-amber-400 to-amber-500' : isApproved ? 'from-indigo-500 to-indigo-600' : isCompleted ? 'from-blue-500 to-blue-600' : 'from-rose-500 to-rose-600';

            return (
              <Card key={booking.id} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${statusColorClass}`} />
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-lg sm:text-2xl">
                        <span className="break-words">{details?.service_title || booking.service_type}</span>
                        {isPending && (
                          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-xs whitespace-nowrap">
                            Čeká na schválení
                          </Badge>
                        )}
                        {isApproved && (
                          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs whitespace-nowrap">Schváleno</Badge>
                        )}
                        {isCompleted && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs whitespace-nowrap">Dokončeno</Badge>
                        )}
                        {isDeclined && (
                          <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 text-xs whitespace-nowrap">Zamítnuto</Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground break-words">
                        Vytvořeno: {format(new Date(booking.created_at), 'PPp', { locale: cs })}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {isCompleted && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => navigate('/invoices/generator', { state: { bookingId: booking.id } })}
                          className="flex-1 sm:flex-none hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <FileText className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Vytvořit fakturu</span>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openBookingDialog(booking)}
                        className="flex-1 sm:flex-none"
                      >
                        <Eye className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Detail</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(booking.id)}
                        className="flex-1 sm:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Klient</h4>
                      <div className="space-y-1 text-xs sm:text-sm break-words">
                        <p className="flex items-start gap-2"><UserIcon className="h-4 w-4 mt-0.5 shrink-0" /><span className="break-words">{booking.clients?.name}</span></p>
                        <p className="flex items-start gap-2"><span className="shrink-0">📧</span><span className="break-all">{booking.clients?.email}</span></p>
                        <p className="flex items-start gap-2"><span className="shrink-0">📞</span><span className="break-words">{booking.clients?.phone}</span></p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Termín a místo</h4>
                      <div className="space-y-1 text-xs sm:text-sm break-words">
                        <p className="flex items-start gap-2"><CalendarIcon className="h-4 w-4 mt-0.5 shrink-0" /><span className="break-words">{format(new Date(booking.scheduled_date), 'PPP', { locale: cs })}</span></p>
                        <p className="flex items-start gap-2"><ClockIcon className="h-4 w-4 mt-0.5 shrink-0" /><span>{format(new Date(booking.scheduled_date), 'HH:mm')}</span></p>
                        <p className="flex items-start gap-2"><MapPinIcon className="h-4 w-4 mt-0.5 shrink-0" /><span className="break-words">{booking.address}</span></p>
                      </div>
                    </div>
                  </div>
                  {details?.priceEstimate && (
                    <div className="pt-2 border-t">
                      <p className="text-xs sm:text-sm">
                        <strong>Odhadovaná cena:</strong> {details.priceEstimate.priceMin} - {details.priceEstimate.priceMax} Kč
                      </p>
                    </div>
                  )}
                  {/* Cleaning Progress for approved bookings */}
                  {isApproved && booking.checklist_rooms && booking.checklist_rooms.length > 0 && (() => {
                    const completed = booking.checklist_rooms.filter(r => r.is_completed).length;
                    const total = booking.checklist_rooms.length;
                    return (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Stav úklidu</span>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {completed} / {total} místností
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mb-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(completed / total) * 100}%` }}
                          />
                        </div>
                        <div className="space-y-1">
                          {booking.checklist_rooms.map(room => (
                            <div key={room.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-muted last:border-0">
                              <div className="flex items-center gap-1.5">
                                {room.is_completed ? (
                                  <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                                ) : (
                                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                                <span className={room.is_completed ? 'text-muted-foreground line-through' : ''}>
                                  {room.room_name}
                                </span>
                              </div>
                              {room.is_completed && room.completed_at && (
                                <span className="text-muted-foreground text-[10px]">
                                  {format(new Date(room.completed_at), 'HH:mm', { locale: cs })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Timestamps summary */}
                        <div className="mt-3 pt-2 border-t border-muted space-y-1 text-xs text-muted-foreground">
                          {booking.started_at && (
                            <div className="flex items-center justify-between">
                              <span>Zahájeno:</span>
                              <span className="font-medium text-foreground">
                                {format(new Date(booking.started_at), 'HH:mm', { locale: cs })}
                              </span>
                            </div>
                          )}
                          {booking.checklist_rooms.every(r => r.is_completed) && booking.checklist_rooms.length > 0 && (() => {
                            const lastCompletedRoom = booking.checklist_rooms
                              .filter(r => r.completed_at)
                              .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];
                            return lastCompletedRoom?.completed_at ? (
                              <div className="flex items-center justify-between">
                                <span>Poslední místnost:</span>
                                <span className="font-medium text-foreground">
                                  {format(new Date(lastCompletedRoom.completed_at), 'HH:mm', { locale: cs })}
                                </span>
                              </div>
                            ) : null;
                          })()}
                          {booking.completed_at && (
                            <div className="flex items-center justify-between text-green-600 font-medium">
                              <span>Dokončeno:</span>
                              <span>
                                {format(new Date(booking.completed_at), 'HH:mm', { locale: cs })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {/* Client Feedback for completed bookings */}
                  {isCompleted && booking.feedback && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-sm">Hodnocení klienta</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          {booking.feedback.rating}/10
                        </span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${booking.feedback!.rating >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                              }`}
                          />
                        ))}
                      </div>
                      {booking.feedback.comment && (
                        <p className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">
                          "{booking.feedback.comment}"
                        </p>
                      )}
                    </div>
                  )}
                  {isPending && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        className="flex-1 w-full"
                        onClick={() => openBookingDialog(booking)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Schválit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1 w-full"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setAdminNotes(booking.admin_notes || '');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Zamítnout
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={() => { setSelectedBooking(null); setIsEditing(false); setEditFormData(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 w-[95vw] sm:w-full">
          <DialogHeader className="mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl">Detail rezervace</DialogTitle>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="h-8 px-3"
                >
                  Upravit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelEditing}
                    className="h-8 px-3"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Zrušit
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveEditing}
                    className="h-8 px-3"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Uložit
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 sm:space-y-6 px-1">
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-2">Informace o službě</h3>
                <div className="bg-muted p-3 rounded-lg space-y-3 text-xs sm:text-sm break-words">
                  {/* Service Title */}
                  <p><strong>Služba:</strong> <span className="break-words">{selectedBooking.booking_details?.service_title}</span></p>

                  {/* Date/Time - Editable */}
                  {isEditing && editFormData ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Datum</Label>
                        <Input
                          type="date"
                          value={editFormData.scheduled_date}
                          onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, scheduled_date: e.target.value }) : null)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Čas</Label>
                        <Input
                          type="time"
                          value={editFormData.scheduled_time}
                          onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, scheduled_time: e.target.value }) : null)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <p><strong>Datum:</strong> <span className="break-words">{format(new Date(selectedBooking.scheduled_date), 'PPPp', { locale: cs })}</span></p>
                  )}

                  {/* Address - Editable */}
                  {isEditing && editFormData ? (
                    <div>
                      <Label className="text-xs">Adresa</Label>
                      <Input
                        value={editFormData.address}
                        onChange={(e) => setEditFormData(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                        className="h-8 text-xs"
                      />
                    </div>
                  ) : (
                    <p><strong>Adresa:</strong> <span className="break-words">{selectedBooking.address}</span></p>
                  )}

                  {selectedBooking.started_at && (
                    <p><strong>Zahájeno:</strong> <span className="break-words">{format(new Date(selectedBooking.started_at), 'PPPp', { locale: cs })}</span></p>
                  )}

                  {/* Booking Details Section */}
                  <div className="pt-2 border-t mt-2">
                    <p className="font-semibold mb-2">Detail objednávky:</p>

                    {/* For cleaning service type - show cleaning_type and typ_domacnosti */}
                    {(selectedBooking.service_type === 'cleaning' || selectedBooking.service_type === 'home_cleaning' || selectedBooking.service_type === 'office_cleaning') && (
                      <div className="space-y-2 mb-3">
                        {/* Cleaning Type (Domácnost/Firma) */}
                        {isEditing && editFormData ? (
                          <div>
                            <Label className="text-xs">Typ úklidu</Label>
                            <Select
                              value={getValue(editFormData.booking_details, 'cleaning_type', 'typ_uklidu') || 'domacnosti'}
                              onValueChange={(v) => updateBookingDetail('cleaning_type', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="domacnosti">Domácnost</SelectItem>
                                <SelectItem value="firmy">Firma</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <p><strong>Typ úklidu:</strong> {translateCleaningType(getValue(selectedBooking.booking_details, 'cleaning_type', 'typ_uklidu'))}</p>
                        )}

                        {/* Typ domácnosti - only for home cleaning */}
                        {(getValue(selectedBooking.booking_details, 'cleaning_type', 'typ_uklidu') !== 'firmy' &&
                          getValue(selectedBooking.booking_details, 'cleaning_type', 'typ_uklidu') !== 'firemni' &&
                          selectedBooking.service_type !== 'office_cleaning') && (
                            isEditing && editFormData ? (
                              <div>
                                <Label className="text-xs">Typ domácnosti</Label>
                                <Select
                                  value={getValue(editFormData.booking_details, 'typ_domacnosti', 'household_type') || ''}
                                  onValueChange={(v) => updateBookingDetail('typ_domacnosti', v)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Vyberte typ" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="byt">Byt</SelectItem>
                                    <SelectItem value="rodinny_dum">Rodinný dům</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              getValue(selectedBooking.booking_details, 'typ_domacnosti', 'household_type') && (
                                <p><strong>Typ domácnosti:</strong> {translateHouseholdType(getValue(selectedBooking.booking_details, 'typ_domacnosti', 'household_type'))}</p>
                              )
                            )
                          )}

                        {/* Equipment option */}
                        {isEditing && editFormData ? (
                          <div>
                            <Label className="text-xs">Vybavení</Label>
                            <Select
                              value={getValue(editFormData.booking_details, 'equipment_option', 'vybaveni') || ''}
                              onValueChange={(v) => updateBookingDetail('equipment_option', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Vyberte" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mam">Mám vybavení</SelectItem>
                                <SelectItem value="nemam">Nemám vybavení (+290 Kč)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          getValue(selectedBooking.booking_details, 'equipment_option', 'vybaveni') && (
                            <p><strong>Vybavení:</strong> {translateEquipmentOption(getValue(selectedBooking.booking_details, 'equipment_option', 'vybaveni'))}</p>
                          )
                        )}
                      </div>
                    )}

                    {/* Rest of booking details */}
                    {isEditing && editFormData ? (
                      <div className="space-y-3">
                        {/* Area */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Plocha (m²)</Label>
                            <Input
                              type="number"
                              value={getValue(editFormData.booking_details, 'area', 'plocha_m2', 'plocha', 'officeArea') || ''}
                              onChange={(e) => updateBookingDetail('plocha_m2', Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Počet koupelen</Label>
                            <Input
                              type="number"
                              value={getValue(editFormData.booking_details, 'bathrooms', 'pocet_koupelen', 'pocet_wc', 'officeBathrooms') || ''}
                              onChange={(e) => updateBookingDetail('pocet_koupelen', Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Počet kuchyní</Label>
                            <Input
                              type="number"
                              value={getValue(editFormData.booking_details, 'kitchens', 'pocet_kuchyni', 'pocet_kuchynek', 'officeKitchens') || ''}
                              onChange={(e) => updateBookingDetail('pocet_kuchyni', Number(e.target.value))}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Znečištění</Label>
                            <Select
                              value={getValue(editFormData.booking_details, 'dirtiness', 'znecisteni', 'officeDirtiness') || ''}
                              onValueChange={(v) => updateBookingDetail('znecisteni', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Vyberte" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Nízké">Nízké</SelectItem>
                                <SelectItem value="Střední">Střední</SelectItem>
                                <SelectItem value="Vysoké">Vysoké</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Frekvence</Label>
                          <Select
                            value={getValue(editFormData.booking_details, 'frequency', 'frekvence', 'officeFrequency') || ''}
                            onValueChange={(v) => updateBookingDetail('frekvence', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Vyberte" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Jednorázově">Jednorázově</SelectItem>
                              <SelectItem value="Týdně">Týdně</SelectItem>
                              <SelectItem value="Každé 2 týdny">Každé 2 týdny</SelectItem>
                              <SelectItem value="Měsíčně">Měsíčně</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Price - Editable */}
                        <div className="pt-2 border-t grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs font-semibold">Cena (Kč)</Label>
                            <Input
                              type="number"
                              value={editFormData.booking_details?.priceEstimate?.price || editFormData.booking_details?.priceEstimate?.priceMin || ''}
                              onChange={(e) => {
                                const price = Number(e.target.value);
                                updateBookingDetail('priceEstimate', {
                                  price: price,
                                  priceMin: price,
                                  priceMax: price
                                });
                              }}
                              className="h-8 text-xs mt-1"
                              placeholder="Zadejte cenu"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Věrnostní body</Label>
                            <Input
                              type="number"
                              value={editFormData.booking_details?.manual_loyalty_points || ''}
                              onChange={(e) => updateBookingDetail('manual_loyalty_points', Number(e.target.value))}
                              className="h-8 text-xs mt-1"
                              placeholder="Body"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <BookingDetailsDisplay
                        bookingDetails={selectedBooking.booking_details}
                        serviceType={selectedBooking.service_type}
                        showPrice={true}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Kompletní profil klienta</h3>
                <div className="bg-muted p-3 rounded-lg space-y-1 text-xs sm:text-sm break-words">
                  <p><strong>Jméno:</strong> <span className="break-words">{selectedBooking.clients?.name}</span></p>
                  <p><strong>Email:</strong> <span className="break-all">{selectedBooking.clients?.email}</span></p>
                  <p><strong>Telefon:</strong> <span className="break-words">{selectedBooking.clients?.phone}</span></p>
                  {selectedBooking.clients?.address && (
                    <p><strong>Adresa:</strong> <span className="break-words">{selectedBooking.clients.address}</span></p>
                  )}
                  {selectedBooking.clients?.city && (
                    <p><strong>Město:</strong> <span className="break-words">{selectedBooking.clients.city}</span></p>
                  )}
                  <div className="pt-2 border-t mt-2">
                    <p className="font-semibold mb-1">Preference:</p>
                    <div className="space-y-1">
                      <p>👶 Děti: {selectedBooking.clients?.has_children ? 'Ano' : 'Ne'}</p>
                      <p>🐾 Domácí mazlíčci: {selectedBooking.clients?.has_pets ? 'Ano' : 'Ne'}</p>
                      <p>⚠️ Alergie: {selectedBooking.clients?.has_allergies ? 'Ano' : 'Ne'}</p>
                      {selectedBooking.clients?.has_allergies && selectedBooking.clients?.allergies_notes && (
                        <p className="text-xs bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded mt-1 break-words">
                          <strong>Poznámky k alergiím:</strong> <span className="break-words">{selectedBooking.clients.allergies_notes}</span>
                        </p>
                      )}
                      {selectedBooking.clients?.special_instructions && (
                        <p className="text-xs bg-blue-100 dark:bg-blue-900/20 p-2 rounded mt-1 break-words">
                          <strong>Speciální pokyny:</strong> <span className="break-words">{selectedBooking.clients.special_instructions}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedBooking.booking_details?.notes && (
                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Poznámky klienta</h3>
                  <div className="bg-muted p-3 rounded-lg text-xs sm:text-sm break-words whitespace-pre-wrap">
                    {selectedBooking.booking_details.notes}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Přiřadit členy týmu * (lze vybrat více)</Label>
                <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={member.id}
                        checked={selectedTeamMembers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          let newSelected;
                          if (checked) {
                            newSelected = [...selectedTeamMembers, member.id];
                          } else {
                            newSelected = selectedTeamMembers.filter(id => id !== member.id);
                          }
                          setSelectedTeamMembers(newSelected);

                          // If lead cleaner is removed from team, clear lead cleaner
                          if (!checked && selectedBooking?.booking_details?.lead_cleaner_id === member.id) {
                            updateBookingDetail('lead_cleaner_id', null);
                          }
                        }}
                      />
                      <label
                        htmlFor={member.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTeamMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Vedoucí úklidu (Privilegium "Hotovo")</Label>
                  <Select
                    value={selectedBooking?.booking_details?.lead_cleaner_id || selectedTeamMembers[0] || ''}
                    onValueChange={(value) => {
                      if (isEditing) {
                        updateBookingDetail('lead_cleaner_id', value);
                      } else {
                        // Direct update if not in edit mode but dialog is open? 
                        // Actually let's just use it in edit mode or handle it via a separate state.
                        // For simplicity in this UI, let's treat it as part of booking_details.
                        const updatedDetails = { ...selectedBooking.booking_details, lead_cleaner_id: value };
                        setSelectedBooking({ ...selectedBooking, booking_details: updatedDetails });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte vedoucího" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.filter(m => selectedTeamMembers.includes(m.id)).map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground italic">Tento člen týmu bude mít jako jediný právo označovat místnosti a zahájit/ukončit úklid.</p>
                </div>
              )}

              <div className="bg-green-50/50 dark:bg-green-950/20 p-4 rounded-xl border border-green-100 dark:border-green-900/50 space-y-3">
                <h3 className="text-sm font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
                  <Banknote className="h-4 w-4" /> Odměna pro tým
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Odměna (Kč)</Label>
                    <Input
                      type="number"
                      value={selectedBooking?.booking_details?.cleaner_earnings || ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        if (isEditing) {
                          updateBookingDetail('cleaner_earnings', val);
                        } else {
                          const updatedDetails = { ...selectedBooking.booking_details, cleaner_earnings: val };
                          setSelectedBooking({ ...selectedBooking, booking_details: updatedDetails });
                        }
                      }}
                      className="h-9"
                      placeholder="Zadejte částku"
                    />
                  </div>
                </div>
              </div>

              {selectedBooking.invoice && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Faktura: {selectedBooking.invoice.invoice_number}
                  </span>
                  <Badge className="ml-auto bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    {selectedBooking.invoice.status === 'paid' ? 'Zaplaceno' : selectedBooking.invoice.status === 'overdue' ? 'Po splatnosti' : 'Vystavena'}
                  </Badge>
                </div>
              )}

              {checklists.length > 0 && (
                <div className="space-y-2">
                  <Label>Checklist (volitelné)</Label>
                  <Select
                    value={selectedChecklistId || 'none'}
                    onValueChange={(value) => setSelectedChecklistId(value === 'none' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte checklist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Žádný checklist</SelectItem>
                      {checklists.map((checklist) => (
                        <SelectItem key={checklist.id} value={checklist.id}>
                          {[checklist.street, checklist.city, checklist.postal_code].filter(Boolean).join(', ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Skip Invoice Checkbox */}
              <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Checkbox
                  id="skip-invoice"
                  checked={skipInvoice}
                  onCheckedChange={(checked) => setSkipInvoice(checked === true)}
                />
                <label
                  htmlFor="skip-invoice"
                  className="text-sm font-medium leading-none cursor-pointer text-amber-800 dark:text-amber-300"
                >
                  Nepřiřazovat Fakturu (měsíční vyúčtování)
                </label>
              </div>

              <div className="space-y-2">
                <Label>Poznámky správce</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Interní poznámky..."
                  rows={3}
                />
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    className="flex-1 w-full"
                    onClick={() => handleApprove(selectedBooking.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="truncate">Schválit rezervaci</span>
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 w-full"
                    onClick={() => handleDecline(selectedBooking.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Zamítnout
                  </Button>
                </div>
              )}

              {selectedBooking.status === 'approved' && (
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Přiřazený tým
                    </h3>
                    {selectedBooking.team_members && selectedBooking.team_members.length > 0 ? (
                      <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                        {selectedBooking.team_members.map((member) => (
                          <div key={member.id} className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            {member.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Žádní členové týmu nebyli přiřazeni</p>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleUpdateTeamMembers(selectedBooking.id)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Uložit změny
                  </Button>
                </div>
              )}

              {/* Save button for completed bookings */}
              {selectedBooking.status === 'completed' && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateTeamMembers(selectedBooking.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uložit změny
                </Button>
              )}

              {selectedBooking.admin_notes && !isEditing && (
                <div>
                  <h3 className="font-semibold mb-2">Poznámky správce</h3>
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    {selectedBooking.admin_notes}
                  </div>
                </div>
              )}

              {/* Photo Gallery */}
              <PhotoGallery
                roomPhotos={selectedBooking.booking_details?.room_photos}
                checklist={{ rooms: selectedBooking.checklist_rooms || [] }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
