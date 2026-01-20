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
        pending: { label: 'Čeká na schválení', color: 'bg-warning', ghostColor: 'bg-warning-light text-warning border-warning-border' },
        approved: { label: 'Schváleno', color: 'bg-info', ghostColor: 'bg-info-light text-info border-info-border' },
        in_progress: { label: 'Probíhá', color: 'bg-success shadow-[2px_0_10px_rgba(16,185,129,0.2)] animate-pulse', ghostColor: 'bg-success-light text-success border-success-border animate-pulse' },
        completed: { label: 'Dokončeno', color: 'bg-success', ghostColor: 'bg-success-light text-success border-success-border' },
        paid: { label: 'Zaplaceno', color: 'bg-success', ghostColor: 'bg-success-light text-success border-success-border' },
        declined: { label: 'Zamítnuto', color: 'bg-destructive', ghostColor: 'bg-destructive-light text-destructive border-destructive-border' }
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
        <Card className="group relative overflow-hidden border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl bg-card">
            {/* Thick left accent strip */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 z-20 transition-all duration-standard",
                currentStatus.color
            )} />

            <div className="p-7 space-y-6">
                {/* Header: Service & Status */}
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold tracking-tight text-foreground leading-tight">
                            {details?.service_title || booking.service_type || 'Úklid'}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                            Vytvořeno: {format(new Date(booking.created_at), 'd. M. yyyy', { locale: cs })}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge variant={isPending ? 'warning' : isCompleted ? 'success' : isDeclined ? 'destructive' : 'default'} className="uppercase tracking-wide">
                            {currentStatus.label}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetail(booking)}
                            className="flex items-center gap-2"
                        >
                            <Eye className="h-4 w-4" /> Detail
                        </Button>
                    </div>
                </div>

                {/* Main Info Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Client & Address Container */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-3">
                        {/* Client Row */}
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <UserIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">Zákazník</p>
                                <p className="text-sm font-semibold text-foreground truncate">{booking.clients?.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <a href={`tel:${booking.clients?.phone}`} className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border">
                                    <Phone className="h-3.5 w-3.5" />
                                </a>
                                <a href={`mailto:${booking.clients?.email}`} className="h-8 w-8 rounded-lg bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border border-border">
                                    <Mail className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>

                        {/* Location/Time Row */}
                        <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                            <div className="h-9 w-9 rounded-lg bg-success/10 flex items-center justify-center text-success shrink-0">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground">Termín a adresa</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-foreground">
                                        {format(new Date(booking.scheduled_date), 'd. MMMM yyyy, HH:mm', { locale: cs })}
                                    </span>
                                    {isStarted && (
                                        <Badge variant="success" className="text-[10px] h-5 px-1.5">
                                            <Play className="h-2 w-2 mr-1 fill-current" /> {booking.started_at ? format(new Date(booking.started_at), 'HH:mm') : 'Zahájeno'}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{booking.address}</p>
                            </div>
                        </div>

                        {/* Price & Loyalty Row */}
                        <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground">Cena úklidu</p>
                                    <p className="text-lg font-bold text-emerald-600 leading-tight">{displayPrice}</p>
                                </div>
                                {loyaltyPoints > 0 && (
                                    <Badge variant="outline" className="h-8 px-3 bg-emerald-50/50 border-emerald-100/50 text-emerald-700 font-black gap-1.5 rounded-lg uppercase tracking-tight text-[10px]">
                                        <Sparkles className="h-3 w-3" />
                                        {loyaltyPoints} Bodů
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer: Progress Tracker */}
                {totalRooms > 0 && (
                    <div className="pt-2">
                        <div className="space-y-2">
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
                    </div>
                )}
            </div>
        </Card>
    );
}
