import { useState } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
    Calendar as CalendarIcon, Clock as ClockIcon, MapPin as MapPinIcon, Clock, Sparkles,
    User, Baby, Dog, HeartPulse, FileText, Banknote, Phone, HeadphonesIcon, ChevronRight,
    CheckCircle2, MoreVertical, Star, ChevronDown, ChevronUp, Users, Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DynamicCollapsible } from '@/components/client/DynamicCollapsible';
import { BookingDetailsDisplay } from '@/components/bookings/BookingDetailsDisplay';
import { InvoicePreview } from '@/components/invoices/InvoicePreview';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { downloadPDF } from '@/utils/pdfUtils';
import { Booking } from '@/types/client-dashboard';
import { BookingTimeline } from './BookingTimeline';
import { StaffAssignment } from './StaffAssignment';
import { BookingFeedback } from './BookingFeedback';
import { BookingRoomTracker } from './BookingRoomTracker';

import { AnimatedPoints } from './AnimatedPoints';
import { LoyaltyTracker } from './LoyaltyTracker';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { downloadFile } from '@/utils/downloadUtils';

interface BookingCardProps {
    booking: Booking;
    onRatingSubmit: (bookingId: string, rating: number, comment: string) => Promise<void>;
    onDecline?: (bookingId: string) => Promise<void>;
    currentLoyaltyPoints?: number;
    isCollapsible?: boolean;
    onDownload?: (invoice: any, companyInfo: any) => Promise<void>;
}

export function BookingCard({ booking, onRatingSubmit, onDecline, currentLoyaltyPoints, isCollapsible = false, onDownload }: BookingCardProps) {
    const navigate = useNavigate();
    const details = booking.booking_details;
    const isCompleted = booking.status === 'completed';
    const isApproved = booking.status === 'approved' || booking.status === 'in_progress' || booking.status === 'completed';
    const isInProgress = booking.status === 'in_progress';
    const isDeclined = booking.status === 'declined';
    const isPending = booking.status === 'pending';
    const isStarted = !!booking.started_at || isInProgress;

    // Use manual points calculation if available, otherwise 27% of price
    let singlePointsMin = 0;
    let singlePointsMax = 0;
    let isRange = false;

    if (details?.manual_loyalty_points) {
        singlePointsMin = details.manual_loyalty_points;
        singlePointsMax = details.manual_loyalty_points;
    } else {
        const price = booking.invoice?.total || details?.priceEstimate?.price;
        if (price) {
            singlePointsMin = Math.round(price * 0.27);
            singlePointsMax = singlePointsMin;
        } else if (details?.priceEstimate?.priceMin && details?.priceEstimate?.priceMax && details?.priceEstimate?.priceMin !== details?.priceEstimate?.priceMax) {
            singlePointsMin = Math.round(details.priceEstimate.priceMin * 0.27);
            singlePointsMax = Math.round(details.priceEstimate.priceMax * 0.27);
            isRange = true;
        } else {
            const basePrice = details?.priceEstimate?.price || details?.priceEstimate?.priceMin || 0;
            singlePointsMin = Math.round(basePrice * 0.27);
            singlePointsMax = singlePointsMin;
        }
    }

    const statusConfig = {
        pending: { label: 'Čeká na schválení', color: 'bg-amber-50 text-amber-700 border-amber-100' },
        approved: { label: 'Schváleno & Naplánováno', color: 'bg-primary/10 text-primary border-primary/20' },
        in_progress: { label: 'Probíhá', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' },
        completed: { label: 'Dokončeno', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        declined: { label: 'Zamítnuto', color: 'bg-red-50 text-red-700 border-red-100' }
    };

    // Override label if started but status is still approved
    let displayStatus = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;

    // Sync with invoice "paid" status
    const isPaid = booking.invoice?.status === 'paid';
    if (isPaid) {
        displayStatus = { label: 'Zaplaceno', color: 'bg-green-50 text-green-700 border-green-100' };
    } else if (isStarted && !isCompleted && !isDeclined) {
        displayStatus = statusConfig.in_progress;
    }

    // Internal state for history view toggle
    const [isOpen, setIsOpen] = useState(!isCollapsible);
    const [isDeclinedRating, setIsDeclinedRating] = useState(false);

    const handleDownload = async () => {
        if (onDownload && booking.invoice) {
            await onDownload(booking.invoice, booking.company_info);
            return;
        }

        if (!booking.invoice?.id) {
            toast.error("Faktura není k dispozici");
            return;
        }

        toast.error("Stahování není v tomto kontextu dostupné");
    };

    return (
        <Card className="relative overflow-hidden border-0 shadow-lg rounded-3xl bg-card group transition-all duration-500 hover:shadow-2xl">
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2 transition-all duration-500 z-20",
                isPending ? "bg-amber-400" :
                    (isStarted && !isCompleted) ? "bg-[linear-gradient(to_bottom,hsl(var(--primary))_0%,hsl(var(--primary)_/_0.2)_100%)] shadow-[2px_0_10px_hsl(var(--primary)_/_0.3)] animate-pulse" :
                        (isApproved) ? "bg-[linear-gradient(to_bottom,hsl(var(--primary))_0%,hsl(var(--primary)_/_0.2)_100%)] shadow-[2px_0_10px_hsl(var(--primary)_/_0.3)]" :
                            isCompleted ? "bg-[linear-gradient(to_bottom,hsl(var(--primary))_0%,hsl(var(--primary)_/_0.2)_100%)] shadow-[2px_0_10px_hsl(var(--primary)_/_0.3)]" : "bg-red-500"
            )} />

            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CardContent className="p-6 space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-4">
                        <div className="space-y-1.5 flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-foreground/90 tracking-tight leading-none">
                                {(() => {
                                    const type = booking.service_type;

                                    if (type === 'home_cleaning') return 'Úklid domácnosti';
                                    if (type === 'commercial_cleaning' || type === 'office_cleaning') return 'Firemní úklid';
                                    if (type === 'window_cleaning') return 'Mytí oken';
                                    if (type === 'upholstery_cleaning') return 'Čištění čalounění';
                                    if (type === 'post_construction_cleaning') return 'Generální úklid po stavbě';

                                    if (type === 'cleaning') {
                                        const cleaningType = details?.cleaning_type || details?.typ_uklidu;
                                        if (cleaningType === 'firmy' || cleaningType === 'firemni' || cleaningType === 'office') return 'Firemní úklid';
                                        return 'Úklid domácnosti';
                                    }

                                    return details?.service_title || booking.service_type;
                                })()}
                            </h3>
                            <div className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium">
                                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <CalendarIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span>{format(new Date(booking.scheduled_date), 'd. MMMM yyyy', { locale: cs })}</span>
                                    </div>
                                    <span className="text-muted-foreground/30 font-light mx-0.5">|</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <ClockIcon className="h-3.5 w-3.5 text-primary" />
                                        <span>{format(new Date(booking.scheduled_date), 'HH:mm')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                                {booking.feedback && !booking.feedback.declined && (
                                    <Badge variant="secondary" className="px-2.5 py-1 text-[11px] font-bold rounded-full border shadow-sm bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                        {booking.feedback.rating}/10
                                    </Badge>
                                )}
                                <Badge variant="secondary" className={cn("px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm whitespace-normal text-center h-auto capitalize", displayStatus.color)}>
                                    {displayStatus.label}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* ALWAYS VISIBLE SUMMARY IF COLLAPSIBLE OR REGULAR CONTENT */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-slate-900/20 border border-primary/10 dark:border-primary/20 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-white dark:bg-primary/20 flex items-center justify-center shadow-sm shrink-0 text-primary">
                                <MapPinIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-[10px] text-primary dark:text-primary uppercase tracking-widest mb-0.5">Místo úklidu</p>
                                <p className="text-base font-medium break-words leading-snug">{booking.address}</p>
                            </div>
                        </div>

                        {/* PROMOTED ACTIONS (Rating / Payment / Skip Status) - Right under address */}
                        {/* Only show Payment Info here if NOT paid. If paid, it goes into detail collapsible */}
                        {(isCompleted || booking.invoice || booking.skip_invoice) && !isPaid && (
                            <div className="space-y-4">
                                {(booking.invoice) ? (
                                    <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700 transition-all hover:shadow-md">
                                        {/* Decorative circles to match loyalty section look */}
                                        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
                                        <div className="absolute -right-2 top-8 h-8 w-8 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />

                                        {/* Sparkle decoration */}
                                        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-400/60 animate-pulse" />

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-white/80 dark:bg-amber-900/40 flex items-center justify-center shadow-sm text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
                                                    <Banknote className={`h-5 w-5 ${booking.invoice.status === 'overdue' ? 'text-red-600' : 'text-amber-600'}`} />
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">Platební údaje</span>
                                            </div>
                                            <Badge variant="secondary" className={cn(
                                                "px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm",
                                                booking.invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' :
                                                    booking.invoice.status === 'overdue' ? 'bg-red-100 text-red-800 border-red-200 shadow-sm animate-pulse' :
                                                        'bg-amber-100 text-amber-800 border-amber-200 shadow-sm'
                                            )}>
                                                {booking.invoice.status === 'paid' ? 'Zaplaceno' : booking.invoice.status === 'overdue' ? 'Po splatnosti' : 'K úhradě'}
                                            </Badge>
                                        </div>
                                        <div className="relative space-y-2.5 text-sm">
                                            {booking.company_info?.bank_account && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-amber-800/70 dark:text-amber-400/70 font-medium">Číslo účtu:</span>
                                                    <span className="font-bold tabular-nums text-amber-900 dark:text-amber-100">{booking.company_info.bank_account}/{booking.company_info.bank_code}</span>
                                                </div>
                                            )}
                                            {booking.invoice.variable_symbol && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-amber-800/70 dark:text-amber-400/70 font-medium">Variabilní symbol:</span>
                                                    <span className="font-bold tabular-nums text-amber-900 dark:text-amber-100">{booking.invoice.variable_symbol}</span>
                                                </div>
                                            )}
                                            {booking.invoice.date_due && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-amber-800/70 dark:text-amber-400/70 font-medium">Splatnost do:</span>
                                                    <span className="font-bold tabular-nums text-amber-900 dark:text-amber-100">
                                                        {format(new Date(booking.invoice.date_due), 'd. M. yyyy', { locale: cs })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center border-t border-amber-200/50 dark:border-amber-700/30 pt-3 mt-3">
                                                <span className="text-amber-800/80 dark:text-amber-300 font-bold">Celkem k úhradě:</span>
                                                <span className="font-black text-2xl text-amber-900 dark:text-amber-100">{(booking.invoice.total || 0).toLocaleString('cs-CZ')} Kč</span>
                                            </div>

                                            {(booking.invoice.pdf_path || booking.invoice.id) && (
                                                <div className="pt-2 animate-in fade-in zoom-in duration-500 flex justify-center">
                                                    <Button
                                                        variant="default"
                                                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                                        onClick={handleDownload}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Stáhnout fakturu
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (isCompleted && !booking.invoice && !booking.skip_invoice) ? (
                                    <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700 transition-all hover:shadow-md">
                                        {/* Decorative circles to match loyalty section look */}
                                        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
                                        <div className="absolute -right-2 top-8 h-8 w-8 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />

                                        {/* Sparkle decoration */}
                                        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-400/60 animate-pulse" />

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-white/80 dark:bg-amber-900/40 flex items-center justify-center shadow-sm text-amber-600/50 dark:text-amber-400/50 border border-amber-100/50 dark:border-amber-800/50">
                                                    <Banknote className="h-5 w-5" />
                                                </div>
                                                <span className="text-sm font-bold uppercase tracking-wider text-amber-800/70 dark:text-amber-200/70">Platební údaje</span>
                                            </div>
                                            <Badge variant="outline" className="px-3 py-1 text-[11px] font-bold rounded-full border-amber-200 text-amber-700/70 bg-white/50 backdrop-blur-sm">
                                                Čeká na vystavení
                                            </Badge>
                                        </div>
                                        <div className="relative text-center py-4 space-y-2">
                                            <div className="h-12 w-12 rounded-full bg-white/80 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-2 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100/50">
                                                <FileText className="h-6 w-6 animate-pulse" />
                                            </div>
                                            <p className="font-bold text-amber-900 dark:text-amber-100">Faktura se připravuje</p>
                                            <p className="text-sm text-amber-800/70 dark:text-amber-400/70 max-w-[250px] mx-auto leading-relaxed">
                                                Zde najdete platební údaje a fakturu ihned po jejím vystavení.
                                            </p>
                                        </div>
                                    </div>
                                ) : (isCompleted && booking.skip_invoice) ? (
                                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-700">
                                        <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-slate-400">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">Hotovo</p>
                                            <p className="text-sm text-muted-foreground">Fakturace k tomuto úklidu byla přeskočena.</p>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Rating Section - Only show if NOT in history view OR no feedback yet */}
                                {isCompleted && !booking.feedback && !isDeclinedRating && !isCollapsible && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-700">
                                        <BookingFeedback
                                            bookingId={booking.id}
                                            onSubmit={onRatingSubmit}
                                            onDecline={async (id) => {
                                                if (onDecline) await onDecline(id);
                                                setIsDeclinedRating(true);
                                            }}
                                        />
                                    </div>
                                )}

                            </div>
                        )}

                        {isCollapsible && (
                            <div className="flex justify-center px-4">
                                <CollapsibleTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-primary hover:text-primary font-bold text-sm tracking-tight transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
                                    >
                                        {isOpen ? "Skrýt detail úklidu" : "Detail úklidu"}
                                    </Button>
                                </CollapsibleTrigger>
                            </div>
                        )}
                    </div>

                    <CollapsibleContent className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Move Payment Info here if PAID */}
                        {isPaid && booking.invoice && (
                            <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700 transition-all hover:shadow-md">
                                {/* Decorative circles to match loyalty section look */}
                                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
                                <div className="absolute -right-2 top-8 h-8 w-8 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />

                                {/* Sparkle decoration */}
                                <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-400/60 animate-pulse" />

                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-xl bg-white/80 dark:bg-amber-900/40 flex items-center justify-center shadow-sm text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                                            <Banknote className="h-5 w-5" />
                                        </div>
                                        <span className="text-sm font-bold uppercase tracking-wider text-amber-800 dark:text-amber-200">Platební údaje</span>
                                    </div>
                                    <Badge variant="secondary" className="px-3 py-1 text-[11px] font-bold rounded-full border shadow-sm bg-green-100 text-green-800 border-green-200">
                                        Zaplaceno
                                    </Badge>
                                </div>
                                <div className="relative space-y-2.5 text-sm">
                                    {booking.company_info?.bank_account && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-amber-800/70 dark:text-amber-400/70 font-medium">Číslo účtu:</span>
                                            <span className="font-bold tabular-nums text-amber-900 dark:text-amber-100">{booking.company_info.bank_account}/{booking.company_info.bank_code}</span>
                                        </div>
                                    )}
                                    {booking.invoice.variable_symbol && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-amber-800/70 dark:text-amber-400/70 font-medium">Variabilní symbol:</span>
                                            <span className="font-bold tabular-nums text-amber-900 dark:text-amber-100">{booking.invoice.variable_symbol}</span>
                                        </div>
                                    )}
                                    {booking.invoice.date_due && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-amber-800/70 dark:text-amber-400/70 font-medium">Splatnost:</span>
                                            <span className="font-bold tabular-nums text-amber-900 dark:text-amber-100 italic opacity-70">
                                                {format(new Date(booking.invoice.date_due), 'd. M. yyyy', { locale: cs })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center border-t border-amber-200/50 dark:border-amber-700/30 pt-3 mt-3">
                                        <span className="text-amber-800/80 dark:text-amber-300 font-bold">Celkem uhrazeno:</span>
                                        <span className="font-black text-2xl text-emerald-900 dark:text-emerald-100">{(booking.invoice.total || 0).toLocaleString('cs-CZ')} Kč</span>
                                    </div>

                                    {(booking.invoice.pdf_path || booking.invoice.id) && (
                                        <div className="pt-2 animate-in fade-in zoom-in duration-500 flex justify-center">
                                            <Button
                                                variant="default"
                                                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                                onClick={handleDownload}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Stáhnout fakturu
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {isCompleted && booking.feedback && !booking.feedback.declined && (
                            <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 space-y-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700 text-center">
                                <div className="flex justify-center gap-0.5 mb-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                        <Star
                                            key={star}
                                            className={cn(
                                                "h-4 w-4",
                                                star <= booking.feedback!.rating
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "fill-transparent text-amber-200"
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="font-bold text-amber-900 dark:text-amber-100">Děkujeme za Vaše hodnocení!</p>
                                {booking.feedback.comment && (
                                    <p className="text-sm text-amber-800 dark:text-amber-200/70 italic">"{booking.feedback.comment}"</p>
                                )}
                            </div>
                        )}
                        {/* Timeline for started/approved bookings (always above price) */}
                        {(isStarted || isApproved) && !isCompleted && !isDeclined && (
                            <div className="pt-2">
                                <BookingTimeline booking={booking} />
                            </div>
                        )}

                        {/* Pricing, Room Tracker & Loyalty Section */}
                        {!isDeclined && (
                            <div className="flex flex-col gap-4">
                                {/* 1. Price Container - Hidden if invoice is present to avoid redundancy */}
                                {details?.priceEstimate && !booking.invoice && (
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm text-emerald-600 border border-emerald-100">
                                            <Banknote className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cena úklidu</p>
                                            <p className="text-lg font-bold">
                                                {booking.invoice ? (
                                                    `${(booking.invoice.total || 0).toLocaleString('cs-CZ')} Kč`
                                                ) : details?.priceEstimate?.price ? (
                                                    `${details.priceEstimate.price} Kč`
                                                ) : details?.priceEstimate?.priceMin && details?.priceEstimate?.priceMax && details?.priceEstimate?.priceMin !== details?.priceEstimate?.priceMax ? (
                                                    `${details.priceEstimate.priceMin} - ${details.priceEstimate.priceMax} Kč`
                                                ) : (
                                                    `${details?.priceEstimate?.price || details?.priceEstimate?.priceMin || 0} Kč`
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* 2. Room Tracker (Moved between Price and Loyalty) */}
                                {(isStarted || isApproved || isCompleted) && !isDeclined && booking.checklist?.rooms && booking.checklist.rooms.length > 0 && (
                                    <BookingRoomTracker
                                        checklist={booking.checklist}
                                        isStarted={isStarted}
                                    />
                                )}

                                {/* 3. Loyalty Points container - Dynamic text based on payment status */}
                                {singlePointsMax > 0 && (
                                    <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 flex flex-col gap-3 transition-all duration-300 shadow-sm hover:shadow-md">
                                        {/* Decorative circles to match home screen richer look */}
                                        <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
                                        <div className="absolute -right-2 top-8 h-8 w-8 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />

                                        {/* Sparkle decoration */}
                                        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-400/60 animate-pulse" />

                                        <div className="relative flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-white/80 dark:bg-amber-900/40 flex items-center justify-center shadow-sm text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 animate-phone-shake">
                                                <Sparkles className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-widest">
                                                    {booking.invoice?.status === 'paid' ? 'ZA TENTO JSTE ZÍSKALI' : 'ZA TENTO ÚKLID ZÍSKÁTE'}
                                                </p>
                                                <div className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-baseline gap-1">
                                                    {isRange ? (
                                                        <span>{singlePointsMin} - {singlePointsMax}</span>
                                                    ) : (
                                                        <span><AnimatedPoints end={singlePointsMin} /></span>
                                                    )}
                                                    <span className="text-xs font-medium">bodů</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Show prize tracker always if current credits are available */}
                                        {currentLoyaltyPoints !== undefined && (
                                            <LoyaltyTracker currentCredits={currentLoyaltyPoints} />
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Staff Assignment */}
                        {!isDeclined && (
                            <div className="pt-2">
                                <StaffAssignment booking={booking} />
                            </div>
                        )}

                        {/* Household & Preferences Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="h-4 w-4" /> Vaše preference
                            </h4>

                            <div className="grid grid-cols-1 gap-3">
                                {(booking.client?.has_children || booking.client?.has_pets || booking.client?.has_allergies) && (
                                    <div className="flex flex-wrap gap-2">
                                        {booking.client?.has_children && (
                                            <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100 flex items-center gap-1">
                                                <Baby className="h-3.5 w-3.5" /> <span>Děti</span>
                                            </Badge>
                                        )}
                                        {booking.client?.has_pets && (
                                            <Badge variant="outline" className="bg-orange-50/50 text-orange-700 border-orange-100 flex items-center gap-1">
                                                <Dog className="h-3.5 w-3.5" /> <span>Mazlíčci</span>
                                            </Badge>
                                        )}
                                        {booking.client?.has_allergies && (
                                            <Badge variant="outline" className="bg-red-50/50 text-red-700 border-red-100 flex items-center gap-1">
                                                <HeartPulse className="h-3.5 w-3.5" /> <span>Alergie</span>
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {booking.client?.special_instructions && (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs shadow-sm">
                                        <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1">
                                            <Sparkles className="h-3 w-3 text-primary" /> Osobní preference:
                                        </p>
                                        <p className="text-muted-foreground italic leading-relaxed">"{booking.client.special_instructions}"</p>
                                    </div>
                                )}

                                {(details?.notes || details?.poznamky) && (
                                    <div className="p-3 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30 text-xs">
                                        <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1">
                                            <FileText className="h-3 w-3 text-blue-500" /> Poznámka k úklidu:
                                        </p>
                                        <p className="text-muted-foreground italic">"{details.notes || details.poznamky}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Collapsible Details */}
                        {details && (
                            <div className="pt-2">
                                <DynamicCollapsible
                                    closedTitle="Zobrazit detail úklidu"
                                    openTitle="Skrýt detail úklidu"
                                    className="bg-muted/5 border-none"
                                >
                                    <div className="mt-3 bg-muted/20 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                                        <BookingDetailsDisplay bookingDetails={details} serviceType={booking.service_type} showPrice={false} />
                                    </div>
                                </DynamicCollapsible>
                            </div>
                        )}

                        {/* Support Card */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 group hover:shadow-md transition-all">
                            <div className="relative z-10 flex flex-col items-center text-center space-y-3">
                                <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center border border-slate-100 dark:border-slate-700 text-primary group-hover:scale-110 transition-transform duration-300">
                                    <HeadphonesIcon className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm">Potřebujete s něčím pomoci?</h4>
                                </div>
                                <a
                                    href="tel:+420777645610"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                >
                                    <Phone className="h-3.5 w-3.5 fill-current" />
                                    <span>Zavolat podporu</span>
                                </a>
                            </div>
                        </div>
                    </CollapsibleContent>
                </CardContent>
            </Collapsible>
            {/* Removed local hidden generation container - now managed centrally by parent page */}
        </Card>
    );
}
