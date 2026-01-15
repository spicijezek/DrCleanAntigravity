import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, MapPin, Users, FileText, AlertCircle, Baby, Dog, ChevronDown, ClipboardList, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CleanerCard } from '@/components/client/CleanerCard';
import { BookingDetailsDisplay } from '@/components/bookings/BookingDetailsDisplay';
import { RoomPhotoUpload } from '@/components/cleaner/RoomPhotoUpload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { CalendarIcon, Clock, Percent, HeadphonesIcon, Phone as PhoneIcon } from 'lucide-react';
import { LoadingOverlay } from '@/components/LoadingOverlay';
interface TeamMember {
  id: string;
  name: string;
  user_id: string;
  bio?: string | null;
  profile?: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
}
interface Booking {
  id: string;
  scheduled_date: string;
  service_type: string;
  address: string;
  admin_notes: string | null;
  team_member_ids: string[];
  booking_details: any;
  client_id: string;
  user_id: string;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  checklist_id: string | null;
  client?: {
    has_children: boolean;
    has_pets: boolean;
    has_allergies: boolean;
    allergies_notes: string | null;
    special_instructions: string | null;
  };
  profile?: {
    avatar_url: string | null;
    full_name: string | null;
  } | null;
  checklist?: {
    id: string;
    street: string;
    city: string | null;
    postal_code: string | null;
    special_requirements: string | null;
    rooms: Array<{
      id: string;
      room_name: string;
      is_completed: boolean;
      completed_at: string | null;
      completed_by: string | null;
      tasks: Array<{
        id: string;
        task_text: string;
        notes: string | null;
        added_by_role: string;
      }>;
    }>;
  };
}
const categoryLabels: Record<string, string> = {
  basic_cleaning: 'Základní úklid',
  deep_cleaning: 'Hloubkový úklid',
  window_cleaning: 'Mytí oken',
  move_in_out: 'Stěhování',
  office_cleaning: 'Kancelářský úklid'
};
export default function CleanerDashboard() {
  const {
    user
  } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember>>({});
  const [loading, setLoading] = useState(true);
  const [roomToComplete, setRoomToComplete] = useState<{
    bookingId: string;
    roomId: string;
  } | null>(null);
  const [currentUserTeamMember, setCurrentUserTeamMember] = useState<TeamMember | null>(null);

  const calculateTimeEstimate = (booking: Booking) => {
    // Show real time if started and completed
    if (booking.started_at && booking.completed_at) {
      const start = new Date(booking.started_at).getTime();
      const end = new Date(booking.completed_at).getTime();
      const diffMs = end - start;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      const hrsStr = diffHrs > 0 ? `${diffHrs} h ` : '';
      const minsStr = diffMins > 0 || diffHrs === 0 ? `${diffMins} min` : '';
      return `Skutečný čas: ${hrsStr}${minsStr}`.trim();
    }

    const price = booking.booking_details?.priceEstimate?.price || booking.booking_details?.priceEstimate?.priceMin || 0;
    if (!price) return null;

    let rate = 500;
    if (booking.service_type === 'upholstery_cleaning' || booking.booking_details?.service_id?.includes('upholstery') || booking.booking_details?.service_title?.toLowerCase().includes('čalounění')) {
      rate = 1500;
    }

    const totalHours = price / rate;
    const numCleaners = booking.team_member_ids.length || 1;
    const hoursPerPerson = totalHours / numCleaners;

    const minHours = hoursPerPerson * 0.85;
    const maxHours = hoursPerPerson * 1.15;

    const formatHours = (h: number) => {
      const hrs = Math.floor(h);
      const mins = Math.round((h - hrs) * 60);
      if (hrs === 0) return `${mins} min`;
      if (mins === 0) return `${hrs} h`;
      return `${hrs} h ${mins} min`;
    };

    return `Čas na osobu: ${formatHours(minHours)} - ${formatHours(maxHours)}`;
  };

  const isLeadCleaner = (booking: Booking) => {
    // If no lead is assigned, lead is the first person in team_member_ids
    const leadId = booking.booking_details?.lead_cleaner_id || booking.team_member_ids[0];
    return currentUserTeamMember?.id === leadId;
  };
  const [bookingToComplete, setBookingToComplete] = useState<string | null>(null);
  const [bookingToStart, setBookingToStart] = useState<string | null>(null);
  const [completingRoom, setCompletingRoom] = useState(false);
  const [completingBooking, setCompletingBooking] = useState(false);
  const [startingBooking, setStartingBooking] = useState(false);
  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user]);
  const loadBookings = async () => {
    if (!user) return;
    try {
      // Get team member record for current user
      const {
        data: teamMember
      } = await supabase.from('team_members').select('id, name, user_id, bio').eq('user_id', user.id).maybeSingle();
      if (!teamMember) {
        setLoading(false);
        return;
      }

      // Fetch profile for current user
      const { data: profile } = await supabase.from('profiles').select('avatar_url, full_name').eq('user_id', user.id).maybeSingle();
      const fullTeamMember = { ...teamMember, profile };
      setCurrentUserTeamMember(fullTeamMember);

      // Get bookings where this team member is assigned
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .contains('team_member_ids', [teamMember.id])
        .in('status', ['approved', 'in_progress'])
        .order('scheduled_date', { ascending: true });
      if (error) throw error;
      if (data) {
        // Fetch client preferences for each booking
        const bookingsWithClient = await Promise.all(data.map(async booking => {
          // Client preferences (same source as admin: public.clients)
          const {
            data: clientById,
            error: clientByIdError
          } = await supabase.from('clients').select('has_children, has_pets, has_allergies, allergies_notes, special_instructions').eq('id', booking.client_id).maybeSingle();
          if (clientByIdError) {
            console.error('Error loading client preferences (by id):', clientByIdError);
          }

          // Fallback: some older rows might store auth user id in bookings.user_id
          let client = clientById;
          if (!client && booking.user_id) {
            const {
              data: clientByUserId,
              error: clientByUserIdError
            } = await supabase.from('clients').select('has_children, has_pets, has_allergies, allergies_notes, special_instructions').eq('user_id', booking.user_id).maybeSingle();
            if (clientByUserIdError) {
              console.error('Error loading client preferences (by user_id):', clientByUserIdError);
            }
            client = clientByUserId;
          }
          if (!client) {
            console.warn('Client preferences not found for booking', booking.id, {
              client_id: booking.client_id,
              booking_user_id: booking.user_id
            });
          }

          // Fetch checklist using the assigned checklist_id
          let checklistWithRooms = null;
          if (booking.checklist_id) {
            const {
              data: checklist
            } = await supabase.from('client_checklists').select('id, street, city, postal_code, special_requirements').eq('id', booking.checklist_id).maybeSingle();
            if (checklist) {
              // Fetch rooms for this checklist
              const {
                data: rooms
              } = await supabase.from('checklist_rooms').select('id, room_name, sort_order, is_completed, completed_at, completed_by').eq('checklist_id', checklist.id).order('sort_order', {
                ascending: true
              });
              if (rooms) {
                // Fetch tasks for each room
                const roomsWithTasks = await Promise.all(rooms.map(async room => {
                  const {
                    data: tasks
                  } = await supabase.from('checklist_tasks').select('id, task_text, notes, added_by_role, sort_order').eq('room_id', room.id).order('sort_order', {
                    ascending: true
                  });
                  return {
                    id: room.id,
                    room_name: room.room_name,
                    is_completed: room.is_completed,
                    completed_at: room.completed_at,
                    completed_by: room.completed_by,
                    tasks: tasks || []
                  };
                }));
                checklistWithRooms = {
                  id: checklist.id,
                  street: checklist.street,
                  city: checklist.city,
                  postal_code: checklist.postal_code,
                  special_requirements: checklist.special_requirements,
                  rooms: roomsWithTasks
                };
              }
            }
          }

          // Fetch team member details with profiles
          const uniqueTeamMemberIds = Array.from(new Set(booking.team_member_ids));
          const {
            data: teamMembersData
          } = await supabase.from('team_members').select('id, name, user_id, bio').in('id', uniqueTeamMemberIds);
          if (teamMembersData) {
            const teamWithProfiles = await Promise.all(teamMembersData.map(async member => {
              const {
                data: profile
              } = await supabase.from('profiles').select('avatar_url, full_name').eq('user_id', member.user_id).maybeSingle();
              return {
                ...member,
                profile
              };
            }));
            const membersMap: Record<string, TeamMember> = {};
            teamWithProfiles.forEach(member => {
              membersMap[member.id] = member;
            });
            setTeamMembers(prev => ({
              ...prev,
              ...membersMap
            }));
          }
          return {
            ...booking,
            client: client || undefined,
            checklist: checklistWithRooms
          };
        }));
        setBookings(bookingsWithClient);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };
  const getOtherCleaners = (booking: Booking, currentUserId: string) => {
    // Get team member id for current user
    const currentTeamMemberId = Object.keys(teamMembers).find(id => teamMembers[id].user_id === currentUserId);
    return booking.team_member_ids.filter(id => id !== currentTeamMemberId && id in teamMembers).map(id => teamMembers[id]).filter(Boolean);
  };
  const handleCompleteRoom = async () => {
    if (!roomToComplete || !user) return;
    setCompletingRoom(true);
    try {
      const {
        error
      } = await supabase.from('checklist_rooms').update({
        is_completed: true,
        completed_by: user.id,
        completed_at: new Date().toISOString()
      }).eq('id', roomToComplete.roomId);
      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(booking => {
        if (booking.id === roomToComplete.bookingId && booking.checklist) {
          return {
            ...booking,
            checklist: {
              ...booking.checklist,
              rooms: booking.checklist.rooms.map(room => room.id === roomToComplete.roomId ? {
                ...room,
                is_completed: true,
                completed_at: new Date().toISOString(),
                completed_by: user.id
              } : room)
            }
          };
        }
        return booking;
      }));
      toast.success('Místnost označena jako hotová');
      setRoomToComplete(null);
    } catch (error) {
      console.error('Error completing room:', error);
      toast.error('Nepodařilo se označit místnost jako hotovou');
    } finally {
      setCompletingRoom(false);
    }
  };
  const handleCompleteBooking = async () => {
    if (!bookingToComplete) return;
    setCompletingBooking(true);
    try {
      const {
        error
      } = await supabase.from('bookings').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', bookingToComplete);
      if (error) throw error;

      // Remove booking from list
      setBookings(prev => prev.filter(b => b.id !== bookingToComplete));
      toast.success('Zakázka úspěšně ukončena');
      setBookingToComplete(null);
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Nepodařilo se ukončit zakázku');
    } finally {
      setCompletingBooking(false);
    }
  };
  const handleStartBooking = async () => {
    if (!bookingToStart) return;
    setStartingBooking(true);
    try {
      const {
        error
      } = await supabase.from('bookings').update({
        started_at: new Date().toISOString(),
        status: 'in_progress'
      }).eq('id', bookingToStart);
      if (error) throw error;

      // Update local state
      setBookings(prev => prev.map(b => b.id === bookingToStart ? {
        ...b,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      } as Booking : b));
      toast.success('Zakázka zahájena');

      const startedId = bookingToStart;
      setBookingToStart(null);

      // Auto-scroll to checklist after a short delay to allow re-render
      setTimeout(() => {
        const checklistElement = document.getElementById(`checklist-${startedId}`);
        if (checklistElement) {
          checklistElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    } catch (error) {
      console.error('Error starting booking:', error);
      toast.error('Nepodařilo se zahájit zakázku');
    } finally {
      setStartingBooking(false);
    }
  };
  const handlePhotoUpdate = async (bookingId: string, roomId: string, type: 'before' | 'after', newUrl: string, action: 'add' | 'remove') => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const currentDetails = booking.booking_details || {};
    const roomPhotos = currentDetails.room_photos || {};
    const roomEntry = roomPhotos[roomId] || { before: [], after: [] };
    const currentList = roomEntry[type] || [];

    let updatedList;
    if (action === 'add') {
      updatedList = [...currentList, newUrl];
    } else {
      updatedList = currentList.filter((url: string) => url !== newUrl);
    }

    const updatedDetails = {
      ...currentDetails,
      room_photos: {
        ...roomPhotos,
        [roomId]: {
          ...roomEntry,
          [type]: updatedList
        }
      }
    };

    // Optimistic update
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, booking_details: updatedDetails } : b));

    // Persist
    const { error } = await supabase
      .from('bookings')
      .update({ booking_details: updatedDetails })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating photos:', error);
      toast.error('Nepodařilo se uložit změny fotografií');
      // Revert logic could be added here if critical
    }
  };

  const areAllRoomsCompleted = (checklist: Booking['checklist']) => {
    if (!checklist?.rooms || checklist.rooms.length === 0) return false;
    return checklist.rooms.every(room => room.is_completed);
  };
  if (loading) {
    return <LoadingOverlay message="Načítám Váš dashboard..." />;
  }
  return <div className="container mx-auto p-4 pb-24 space-y-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
    <ClientHeroHeader
      icon={CalendarIcon}
      title="Moje úklidy"
      subtitle="Přehled vašich dnešních a nadcházejících zakázek"
      className="mb-8"
    />

    {bookings.length === 0 ? <Card className="border-dashed border-2 rounded-3xl bg-slate-50/50">
      <CardContent className="py-16 text-center space-y-4">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
          <Calendar className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium text-foreground">Žádné zakázky</p>
        <p className="text-muted-foreground">Momentálně nemáte žádné přidělené zakázky</p>
      </CardContent>
    </Card> : <div className="grid gap-6">
      {bookings.map(booking => {
        const otherCleaners = user ? getOtherCleaners(booking, user.id) : [];
        const clientNotes = booking.booking_details?.notes;
        const client = booking.client;
        return <Card key={booking.id} className="relative overflow-hidden border-0 shadow-lg rounded-3xl group transition-all duration-300 hover:shadow-xl bg-card">
          {/* Decorative gradient border via pseudo-element is handled by wrapper or simple border-l */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary/80 to-primary/60" />

          <CardHeader className="p-6 pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <CardTitle className="text-xl sm:text-2xl leading-tight font-bold text-foreground/90">
                  {booking.booking_details?.service_title || categoryLabels[booking.service_type] || booking.service_type}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {format(new Date(booking.scheduled_date), 'PPP', { locale: cs })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{format(new Date(booking.scheduled_date), 'HH:mm')}</span>
                  </div>
                </div>
              </div>

              {booking.status === 'in_progress' || booking.started_at ? (
                <Badge variant="default" className="w-fit bg-emerald-500 hover:bg-emerald-600 border-0 px-3 py-1 text-sm shadow-md flex items-center gap-1.5 transition-all">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                  </span>
                  Probíhá
                </Badge>
              ) : (
                <Badge variant="secondary" className="w-fit px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900">
                  Naplánováno
                </Badge>
              )}
            </div>

            {/* Time Estimate & Earnings */}
            <div className="flex flex-wrap gap-2 mt-2">
              {calculateTimeEstimate(booking) && (
                <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{calculateTimeEstimate(booking)}</span>
                </div>
              )}
              {booking.booking_details?.cleaner_earnings && (
                <div className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50 px-2.5 py-1 rounded-full text-xs font-semibold">
                  <Percent className="h-3.5 w-3.5" />
                  <span>Vaše odměna: {booking.booking_details.cleaner_earnings} Kč</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">

            {/* Address Card */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/40 dark:to-slate-900/40 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
              <div className="h-10 w-10 rounded-full bg-white dark:bg-indigo-950 flex items-center justify-center shadow-sm shrink-0 text-indigo-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-indigo-900 dark:text-indigo-200 uppercase tracking-wide mb-0.5">Adresa úklidu</p>
                <p className="text-base font-medium break-words leading-snug">{booking.address}</p>
              </div>
            </div>

            {/* Service Details */}
            {booking.booking_details && <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Detail služby
              </h4>
              <div className="bg-muted/30 p-4 rounded-2xl border text-sm">
                <BookingDetailsDisplay bookingDetails={booking.booking_details} serviceType={booking.service_type} showPrice={false} />
              </div>
            </div>}

            {/* Household & Instructions Section */}
            {booking.client && (
              <div className="grid grid-cols-1 gap-3">
                {(booking.client.has_children || booking.client.has_pets || booking.client.has_allergies) && (
                  <div className="flex flex-wrap gap-2">
                    {booking.client.has_children && (
                      <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 flex items-center gap-1">
                        <span>👶 Děti</span>
                      </Badge>
                    )}
                    {booking.client.has_pets && (
                      <Badge variant="outline" className="bg-orange-50/50 text-orange-700 border-orange-100 flex items-center gap-1">
                        <span>🐾 Mazlíčci</span>
                      </Badge>
                    )}
                    {booking.client.has_allergies && (
                      <Badge variant="outline" className="bg-red-50/50 text-red-700 border-red-100 flex items-center gap-1">
                        <span>⚠️ Alergie</span>
                      </Badge>
                    )}
                  </div>
                )}

                {booking.client.special_instructions && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                    <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <FileText className="h-3 w-3 text-primary" /> Pokyny klienta:
                    </p>
                    <p className="text-muted-foreground italic leading-relaxed">"{booking.client.special_instructions}"</p>
                  </div>
                )}
                {booking.client.has_allergies && booking.client.allergies_notes && (
                  <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 text-xs text-red-800 dark:text-red-300">
                    <strong>Poznámka k alergiím:</strong> {booking.client.allergies_notes}
                  </div>
                )}
              </div>
            )}



            {/* Checklist & Tasks */}
            {booking.checklist && (
              <div id={`checklist-${booking.id}`} className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" /> Checklist
                  </h4>
                  {booking.started_at && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Aktivní
                    </span>
                  )}
                </div>

                <Collapsible key={booking.started_at ? 'open' : 'closed'} defaultOpen={!!booking.started_at}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3 px-4 rounded-xl border-dashed hover:border-solid hover:bg-muted/30 hover:text-primary transition-all group"
                    >
                      <span className="font-semibold text-sm">Zobrazit seznam úkolů</span>
                      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4 space-y-4">
                    {booking.checklist.special_requirements && (
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 text-sm text-indigo-900 dark:text-indigo-300">
                        <strong>Speciální požadavky:</strong> {booking.checklist.special_requirements}
                      </div>
                    )}

                    {booking.checklist.rooms.map(room => (
                      <div key={room.id} className="border rounded-xl overflow-hidden bg-card shadow-sm">
                        <div className="bg-muted/30 px-4 py-3 flex items-center justify-between border-b">
                          <h5 className="font-medium text-foreground">{room.room_name}</h5>
                          {room.is_completed ? (
                            <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-50">Hotovo</Badge>
                          ) : isLeadCleaner(booking) ? (
                            <Button
                              size="sm"
                              variant={booking.started_at ? "default" : "secondary"}
                              disabled={!booking.started_at}
                              onClick={() => setRoomToComplete({ bookingId: booking.id, roomId: room.id })}
                              className={cn("h-7 text-xs rounded-lg transition-all px-3", booking.started_at ? "shadow-md hover:shadow-lg" : "opacity-30")}
                            >
                              Hotovo
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] opacity-50">Jen pro vedoucího</Badge>
                          )}
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-950">
                          {room.tasks.length > 0 ? (
                            <ul className="space-y-2 mb-4">
                              {room.tasks.map(task => (
                                <li key={task.id} className="text-sm flex gap-3 text-muted-foreground">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                                  <span>{task.task_text}</span>
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-xs text-muted-foreground italic mb-4">Žádné úkoly</p>}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Collapsible Tým / Kolegové Section */}
            {otherCleaners.length > 0 && (
              <div className="pt-2 border-t">
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between h-auto py-2 px-1 text-sm text-muted-foreground hover:bg-transparent group">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">Kolegové na zakázce ({otherCleaners.length})</span>
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 grid gap-3 animate-in slide-in-from-top-2 duration-300">
                    {otherCleaners.map(member => (
                      <div key={member.id} className="relative">
                        <CleanerCard
                          name={member.name}
                          userId={member.user_id}
                          avatarPath={member.profile?.avatar_url}
                          fullName={member.profile?.full_name}
                          bio={member.bio}
                        />
                        {booking.booking_details?.lead_cleaner_id === member.id && (
                          <Badge variant="secondary" className="absolute top-3 right-3 text-[9px] h-4 px-1.5 bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm">Vedoucí</Badge>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2">
              {!booking.started_at ? (
                isLeadCleaner(booking) ? (
                  <Button
                    onClick={() => setBookingToStart(booking.id)}
                    className="w-full h-12 text-lg font-semibold rounded-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    Zahájit Úklid
                  </Button>
                ) : (
                  <div className="text-center p-3 bg-muted/30 rounded-2xl border border-dashed text-sm text-muted-foreground italic">
                    Zahájit úklid může pouze vedoucí úklidu
                  </div>
                )
              ) : (
                booking.checklist && areAllRoomsCompleted(booking.checklist) && (
                  isLeadCleaner(booking) ? (
                    <Button
                      onClick={() => setBookingToComplete(booking.id)}
                      className="w-full h-12 text-lg font-semibold rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-green-500/25 transition-all animate-in zoom-in duration-300"
                    >
                      Ukončit Zakázku
                    </Button>
                  ) : (
                    <div className="text-center p-3 bg-green-50/30 rounded-2xl border border-dashed text-sm text-green-700/70 italic">
                      Vše hotovo. Ukončit zakázku může pouze vedoucí úklidu.
                    </div>
                  )
                )
              )}
            </div>


          </CardContent>
        </Card >;
      })}
    </div >}

    {/* Support Container */}
    <div className="pt-6 border-t border-border/50">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900/50 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 transition-all hover:shadow-md group">
        {/* Bubble Animation Background */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 animate-float-circle-1 pointer-events-none" />
        <div className="absolute -right-2 top-16 h-16 w-16 rounded-full bg-primary/10 animate-float-circle-2 pointer-events-none" />
        <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-xl animate-pulse pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-indigo-100 dark:border-indigo-800 text-primary group-hover:scale-110 transition-transform duration-300">
            <HeadphonesIcon className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-lg text-foreground tracking-tight">Potřebujete pomoc?</h4>
            <p className="text-sm text-muted-foreground">Dispečink je vám k dispozici pro řešení problémů na místě.</p>
          </div>

          <a
            href="tel:+420777645610"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <PhoneIcon className="h-4 w-4 fill-current" />
            <span>Zavolat dispečink</span>
          </a>
        </div>
      </div>
    </div>

    {/* Room Completion Dialog */}
    <AlertDialog open={!!roomToComplete} onOpenChange={() => setRoomToComplete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dokončit místnost?</AlertDialogTitle>
          <AlertDialogDescription>
            Opravdu chcete označit tuto místnost jako hotovou?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={completingRoom}>Ne</AlertDialogCancel>
          <AlertDialogAction onClick={handleCompleteRoom} disabled={completingRoom}>
            {completingRoom ? 'Ukládám...' : 'Ano'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Booking Completion Dialog */}
    <AlertDialog open={!!bookingToComplete} onOpenChange={() => setBookingToComplete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ukončit zakázku?</AlertDialogTitle>
          <AlertDialogDescription>
            Všechny místnosti jsou hotové. Opravdu chcete ukončit tuto zakázku? Klient bude informován o dokončení.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={completingBooking}>Ne</AlertDialogCancel>
          <AlertDialogAction onClick={handleCompleteBooking} disabled={completingBooking}>
            {completingBooking ? 'Ukládám...' : 'Ano'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Start Booking Dialog */}
    <AlertDialog open={!!bookingToStart} onOpenChange={() => setBookingToStart(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Zahájit zakázku?</AlertDialogTitle>
          <AlertDialogDescription>
            Opravdu chcete zahájit tuto zakázku? Čas zahájení bude zaznamenán.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={startingBooking}>Ne</AlertDialogCancel>
          <AlertDialogAction onClick={handleStartBooking} disabled={startingBooking}>
            {startingBooking ? 'Zahajuji...' : 'Ano'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div >;
}