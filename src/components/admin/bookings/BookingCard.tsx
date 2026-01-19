import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
    Calendar as CalendarIcon,
    Clock as ClockIcon,
    MapPin as MapPinIcon,
    User as UserIcon,
    Eye,
    Mail,
    Phone,
    Clock,
    Sparkles,
    Play
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    };
    team_members?: {
        id: string;
        name: string;
    }[];
    checklist_rooms?: {
        id: string;
        room_name: string;
        is_completed: boolean;
        completed_at: string | null;
    }[];
    feedback?: {
        rating: number;
        comment: string | null;
    } | null;
}

interface BookingCardProps {
    booking: Booking;
    onViewDetail: (booking: Booking) => void;
    onDelete: (bookingId: string) => void;
    onCreateInvoice: (bookingId: string) => void;
}

export function BookingCard({ booking, onViewDetail, onDelete, onCreateInvoice }: BookingCardProps) {
    const isPending = booking.status === 'pending';
    const isApproved = booking.status === 'approved';
    const isInProgress = booking.status === 'in_progress';
    const isCompleted = booking.status === 'completed' || booking.status === 'paid';
    const isDeclined = booking.status === 'declined';

    const details = booking.booking_details;
    const isStarted = !!booking.started_at || isInProgress;

    const statusConfig = {
        pending: { label: 'Čeká na schválení', color: 'bg-amber-400', ghostColor: 'bg-amber-50 text-amber-700 border-amber-100' },
        approved: { label: 'Schváleno', color: 'bg-indigo-500', ghostColor: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        in_progress: { label: 'Probíhá', color: 'bg-emerald-500 shadow-[2px_0_10px_rgba(16,185,129,0.3)] animate-pulse', ghostColor: 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' },
        completed: { label: 'Dokončeno', color: 'bg-emerald-500', ghostColor: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        paid: { label: 'Zaplaceno', color: 'bg-emerald-600', ghostColor: 'bg-green-50 text-green-700 border-green-100' },
        declined: { label: 'Zamítnuto', color: 'bg-red-500', ghostColor: 'bg-red-50 text-red-700 border-red-100' }
    };

    const currentStatus = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;

    // Pricing Logic
    const hasFixedPrice = details?.priceEstimate?.price !== undefined && details?.priceEstimate?.price !== null;
    const priceMin = details?.priceEstimate?.priceMin || 0;
    const priceMax = details?.priceEstimate?.priceMax || 0;
    const displayPrice = hasFixedPrice
        ? `${details.priceEstimate.price} Kč`
        : priceMin === priceMax
            ? `${priceMin} Kč`
            : `${priceMin} - ${priceMax} Kč`;

    // Loyalty Points Logic (27%)
    const price = details?.priceEstimate?.price || details?.priceEstimate?.priceMin || 0;
    const loyaltyPoints = Math.round(price * 0.27);

    // Room completion logic
    const totalRooms = booking.checklist_rooms?.length || 0;
    const completedRooms = booking.checklist_rooms?.filter(r => r.is_completed).length || 0;

    return (
        <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-card">
            {/* Thick left accent strip */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2.5 z-20 transition-all duration-500",
                currentStatus.color
            )} />

            <div className="p-7 space-y-6">
                {/* Header: Service & Status */}
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black tracking-tight text-foreground/90 leading-tight">
                            {details?.service_title || booking.service_type || 'Úklid'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                            Vytvořeno: {format(new Date(booking.created_at), 'd. M. yyyy', { locale: cs })}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge className={cn("px-4 py-1.5 text-[11px] font-black rounded-full border shadow-sm uppercase tracking-wider", currentStatus.ghostColor)}>
                            {currentStatus.label}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(booking)}
                            className="h-9 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs"
                        >
                            <Eye className="h-4 w-4 mr-2" /> Detail
                        </Button>
                    </div>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Client & Address Container */}
                    <div className="p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100/50 space-y-4 shadow-sm group-hover:bg-slate-50 transition-colors duration-500">
                        {/* Client Row */}
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-indigo-500 shrink-0 border border-indigo-50">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-indigo-900/40 uppercase tracking-widest leading-none mb-1">Zákazník</p>
                                <p className="text-base font-bold text-slate-900 truncate">{booking.clients?.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <a href={`tel:${booking.clients?.phone}`} className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors shadow-sm border border-slate-100">
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                                <a href={`mailto:${booking.clients?.email}`} className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors shadow-sm border border-slate-100">
                                    <Mail className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>

                        {/* Location/Time Row */}
                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100/50">
                            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-emerald-500 shrink-0 border border-emerald-50">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-emerald-900/40 uppercase tracking-widest leading-none mb-1">Termín a adresa</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                                        {format(new Date(booking.scheduled_date), 'd. MMMM yyyy, HH:mm', { locale: cs })}
                                    </span>
                                    {isStarted && (
                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-bold h-5 px-1.5 uppercase">
                                            <Play className="h-2 w-2 mr-1 fill-current" /> {booking.started_at ? format(new Date(booking.started_at), 'HH:mm') : 'Zahájeno'}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 truncate mt-0.5 leading-tight">{booking.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Price, Loyalty & Progress */}
                <div className="flex items-end justify-between gap-6 pt-2">
                    {/* Price & Loyalty */}
                    <div className="space-y-3 shrink-0">
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Cena úklidu</p>
                            <p className="text-2xl font-black text-emerald-600 leading-none">{displayPrice}</p>
                        </div>
                        {loyaltyPoints > 0 && (
                            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-100 shadow-sm">
                                <Sparkles className="h-3 w-3 fill-amber-400" />
                                {loyaltyPoints} Bodů
                            </div>
                        )}
                    </div>

                    {/* Progress Tracker (If assigned) */}
                    {totalRooms > 0 && (
                        <div className="flex-1 max-w-[180px] space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                    <Clock className="h-3 w-3" /> Postup
                                </span>
                                <span className="text-emerald-600">
                                    {completedRooms} / {totalRooms}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out"
                                    style={{ width: `${(completedRooms / totalRooms) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
