import { useState, useEffect, useMemo } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
    Calendar as CalendarIcon, MapPin as MapPinIcon, User as UserIcon, Clock, Save, X, CheckCircle2,
    Trash2, XCircle, Users, Star, FileText, Download, Shield, Sparkles,
    Banknote, Baby, Dog, HeartPulse, Flag, Mail, Phone, ChevronRight, Settings, Info, Play, DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookingDetailsDisplay } from '@/components/bookings/BookingDetailsDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useInvoiceDownload } from '@/hooks/useInvoiceDownload';
import { HiddenInvoiceContainer } from '@/components/invoices/HiddenInvoiceContainer';
import { calculateTimeEstimate } from '@/utils/bookingCalculations';

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
    checklist?: {
        id: string;
        street: string;
        rooms: {
            id: string;
            room_name: string;
            is_completed: boolean;
            completed_at: string | null;
            sort_order?: number;
        }[];
    };
    checklist_rooms?: {
        id: string;
        room_name: string;
        is_completed: boolean;
        completed_at: string | null;
        sort_order?: number;
    }[];
    job_earnings?: {
        amount: number;
        team_member_id: string;
    }[];
    feedback?: {
        rating: number;
        comment: string | null;
    } | null;
    invoices?: {
        id: string;
        invoice_number: string;
        status: string;
        pdf_path: string | null;
        total: number;
        variable_symbol: string | null;
    }[];
}

interface BookingDetailDialogProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
    teamMembers: { id: string; name: string }[];
}

export function BookingDetailDialog({ booking, isOpen, onClose, onUpdate, teamMembers }: BookingDetailDialogProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [companyInfo, setCompanyInfo] = useState<any>(null);
    const { downloadInvoice, generatingInvoiceId, invoiceItems: hookItems, previewInvoice: hookInvoice } = useInvoiceDownload();

    // Core states
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
    const [adminNotes, setAdminNotes] = useState('');
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [skipInvoice, setSkipInvoice] = useState(false);
    const [checklists, setChecklists] = useState<any[]>([]);
    const [associatedInvoice, setAssociatedInvoice] = useState<any>(null);
    const [fetchingInvoice, setFetchingInvoice] = useState(false);

    const invoice = associatedInvoice;

    // Form state for editing
    const [editFormData, setEditFormData] = useState({
        scheduled_date: '',
        scheduled_time: '',
        address: '',
        price: 0,
        manual_loyalty_points: 0,
        team_reward: 0,
        status: '',
        estimated_hours: 0
    });

    // Initialize state when booking changes
    useEffect(() => {
        if (booking && isOpen) {
            setIsEditing(false);

            // Team Members
            const initialTeamMembers = booking.team_member_ids?.length > 0
                ? booking.team_member_ids
                : booking.team_members?.map(tm => tm.id) || [];
            setSelectedTeamMembers(initialTeamMembers);

            // Admin Notes
            setAdminNotes(booking.admin_notes || '');

            // Checklist
            setSelectedChecklistId(booking.checklist_id || '');

            // Invoice
            setSkipInvoice(booking.skip_invoice || false);

            // Fetch checklists for this client
            fetchChecklists(booking.client_id);
            fetchCompanyInfo();

            // Fetch Invoice if missing but invoice_id exists
            if (!booking.invoices?.length && booking.invoice_id) {
                fetchInvoice(booking.invoice_id);
            } else {
                setAssociatedInvoice(booking.invoices?.[0] || null);
            }
            const dateObj = new Date(booking.scheduled_date);
            const isValidDate = isValid(dateObj);

            setEditFormData({
                scheduled_date: isValidDate ? format(dateObj, 'yyyy-MM-dd') : '',
                scheduled_time: isValidDate ? format(dateObj, 'HH:mm') : '',
                address: booking.address || '',
                price: booking.booking_details?.priceEstimate?.price ??
                    booking.booking_details?.priceEstimate?.priceMin ?? 0,
                manual_loyalty_points: booking.booking_details?.manual_loyalty_points ?? 0,
                team_reward: booking.booking_details?.manual_team_reward ??
                    booking.job_earnings?.reduce((sum, item) => sum + (item.amount || 0), 0) ?? 0,
                status: booking.status || 'pending',
                estimated_hours: booking.booking_details?.priceEstimate?.hoursMin || 0
            });
        }
    }, [booking, isOpen]);

    // Automatic Estimated Time Calculation
    useEffect(() => {
        if (!isEditing || !booking) return;

        const price = editFormData.price;
        if (!price) return;

        const est = calculateTimeEstimate({
            service_type: booking.service_type,
            booking_details: booking.booking_details,
            team_member_ids: selectedTeamMembers
        }, price, selectedTeamMembers.length);

        if (est && est.totalHours) {
            const val = Number(est.totalHours.toFixed(1));
            // Only update if different
            if (val !== editFormData.estimated_hours) {
                setEditFormData(prev => ({ ...prev, estimated_hours: val }));
            }
        }
    }, [editFormData.price, booking?.service_type, isEditing, selectedTeamMembers]);

    const fetchInvoice = async (invoiceId: string) => {
        setFetchingInvoice(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .maybeSingle();
            if (data) setAssociatedInvoice(data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
        } finally {
            setFetchingInvoice(false);
        }
    };

    const fetchChecklists = async (clientId: string) => {
        try {
            const { data } = await supabase
                .from('client_checklists')
                .select('*')
                .eq('client_id', clientId);
            setChecklists(data || []);
        } catch (error) {
            console.error('Error fetching checklists:', error);
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data } = await supabase
                .from("company_info")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (data) setCompanyInfo(data);
        } catch (error) {
            console.error('Error fetching company info:', error);
        }
    };

    // Derived Data (Defensive)
    const stats = useMemo(() => {
        if (!booking) return { completed: 0, total: 0, percentage: 0, rooms: [] };

        // Try rooms from both potential sources
        const rawRooms = booking.checklist?.rooms || booking.checklist_rooms || [];
        const sortedRooms = [...rawRooms].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        const total = sortedRooms.length;
        const completed = sortedRooms.filter(r => r.is_completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { completed, total, percentage, rooms: sortedRooms };
    }, [booking]);

    const pricing = useMemo(() => {
        const p = isEditing ? editFormData.price : (booking?.booking_details?.priceEstimate?.price ?? booking?.booking_details?.priceEstimate?.priceMin ?? 0);
        const autoPoints = Math.round(p * 0.27);
        const effectivePoints = (isEditing ? editFormData.manual_loyalty_points : (booking?.booking_details?.manual_loyalty_points)) || autoPoints;

        const baseTeamReward = booking?.job_earnings?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
        const teamReward = isEditing ? editFormData.team_reward : (booking?.booking_details?.manual_team_reward ?? baseTeamReward);

        return { price: p, autoPoints, effectivePoints, teamReward };
    }, [booking, isEditing, editFormData.price, editFormData.manual_loyalty_points, editFormData.team_reward]);

    const displayTeamMembers = useMemo(() => {
        if (!booking) return [];
        // If team_members relation is present, use it
        if (booking.team_members && booking.team_members.length > 0) return booking.team_members;
        // Otherwise map team_member_ids using the full teamMembers list
        if (booking.team_member_ids && booking.team_member_ids.length > 0) {
            return teamMembers.filter(tm => booking.team_member_ids.includes(tm.id));
        }
        return [];
    }, [booking, teamMembers]);

    if (!booking) return null;

    const handleSave = async (quickStatus?: string) => {
        setIsSaving(true);
        try {
            // Reconstruct Date
            let scheduledDateTime = booking.scheduled_date;
            if (editFormData.scheduled_date && editFormData.scheduled_time) {
                const [y, m, d] = editFormData.scheduled_date.split('-').map(Number);
                const [hh, mm] = editFormData.scheduled_time.split(':').map(Number);
                scheduledDateTime = new Date(y, m - 1, d, hh, mm).toISOString();
            }

            const updatedDetails = {
                ...booking.booking_details,
                manual_loyalty_points: editFormData.manual_loyalty_points,
                manual_team_reward: editFormData.team_reward,
                priceEstimate: {
                    ...booking.booking_details?.priceEstimate,
                    price: editFormData.price,
                    hoursMin: editFormData.estimated_hours,
                    hoursMax: editFormData.estimated_hours
                }
            };

            const newChecklistId = (selectedChecklistId && selectedChecklistId !== 'none_selection') ? selectedChecklistId : null;
            const checklistChanged = newChecklistId !== booking.checklist_id;

            const { error } = await supabase
                .from('bookings')
                .update({
                    scheduled_date: scheduledDateTime,
                    address: editFormData.address,
                    status: quickStatus || editFormData.status,
                    booking_details: updatedDetails,
                    team_member_ids: selectedTeamMembers,
                    admin_notes: adminNotes,
                    checklist_id: newChecklistId,
                    skip_invoice: skipInvoice
                })
                .eq('id', booking.id);

            if (error) throw error;

            // Handle booking_rooms snapshots when checklist changes
            // Only update snapshots if the booking is NOT completed
            if (checklistChanged && !isCompleted) {
                if (newChecklistId) {
                    // Create fresh room snapshots from the new checklist
                    const { createBookingRoomSnapshots } = await import('@/utils/bookingRoomUtils');
                    await createBookingRoomSnapshots(booking.id, newChecklistId);
                } else {
                    // Checklist removed - delete room snapshots
                    const { deleteBookingRoomSnapshots } = await import('@/utils/bookingRoomUtils');
                    await deleteBookingRoomSnapshots(booking.id);
                }
            }

            toast({ title: 'Uloženo', description: 'Změny byly úspěšně uloženy.' });
            setIsEditing(false);
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Chyba', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const isStarted = !!booking.started_at || booking.status === 'in_progress';
    const isCompleted = ['completed', 'paid'].includes(booking.status);

    const calculateDuration = (start: string | null, end: string | null) => {
        if (!start || !end) return null;
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffMs = endTime - startTime;
        if (diffMs <= 0) return null;

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}min`;
        }
        return `${minutes} min`;
    };

    const realDuration = calculateDuration(booking.started_at, booking.completed_at);

    // Calculate estimate for display (Per Person Range)
    const estDisplay = calculateTimeEstimate(booking);
    const estimatedHours = estDisplay ? `Čas na osobu: ${estDisplay.formattedRange}` : '-';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 border border-border bg-background shadow-soft rounded-xl overflow-hidden flex flex-col">
                {/* Header Section */}
                <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">
                                {booking.clients?.name || 'Neznámý klient'}
                            </h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-bold">
                                    ID: {booking.id.split('-')[0]}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Vytvořeno: {isValid(new Date(booking.created_at)) ? format(new Date(booking.created_at), 'd. M. yyyy', { locale: cs }) : '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pr-8">
                        <Button
                            variant={isEditing ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEditing(!isEditing)}
                            className={cn(
                                "flex items-center gap-2 h-9 rounded-lg transition-all font-semibold",
                                isEditing ? "shadow-inner" : "text-muted-foreground"
                            )}
                        >
                            <Settings className={cn("h-4 w-4", isEditing && "animate-spin-slow")} />
                            {isEditing ? "Zobrazit náhled" : "Upravit rezervaci"}
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN: Main Information */}
                        <div className="col-span-12 lg:col-span-7 space-y-6">

                            {/* Card: Termín a Adresa */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Termín a adresa</h3>
                                    </div>
                                    <Badge variant={isCompleted ? "success" : isStarted ? "warning" : "default"}>
                                        {booking.status}
                                    </Badge>
                                </div>

                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">DATUM</Label>
                                            <Input
                                                type="date"
                                                value={editFormData.scheduled_date}
                                                onChange={e => setEditFormData({ ...editFormData, scheduled_date: e.target.value })}
                                                className="h-11 rounded-lg border-border focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">ČAS</Label>
                                            <Input
                                                type="time"
                                                value={editFormData.scheduled_time}
                                                onChange={e => setEditFormData({ ...editFormData, scheduled_time: e.target.value })}
                                                className="h-11 rounded-lg border-border focus:ring-primary/20"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">STATUS REZERVACE</Label>
                                            <Select
                                                value={editFormData.status}
                                                onValueChange={val => setEditFormData({ ...editFormData, status: val })}
                                            >
                                                <SelectTrigger className="h-11 rounded-lg border-border font-semibold">
                                                    <SelectValue placeholder="Zvolte status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Čeká na schválení</SelectItem>
                                                    <SelectItem value="approved">Schváleno</SelectItem>
                                                    <SelectItem value="in_progress">Probíhá</SelectItem>
                                                    <SelectItem value="completed">Dokončeno</SelectItem>
                                                    <SelectItem value="paid">Zaplaceno</SelectItem>
                                                    <SelectItem value="cancelled">Zrušeno</SelectItem>
                                                    <SelectItem value="declined">Zamítnuto</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">ADRESA ÚKLIDU</Label>
                                            <Input
                                                value={editFormData.address}
                                                onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                                                className="h-11 rounded-lg border-border focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <CalendarIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">
                                                    {isValid(new Date(booking.scheduled_date)) ? format(new Date(booking.scheduled_date), 'EEEE, d. MMMM yyyy', { locale: cs }) : 'Neplatné datum'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Naplánovaný den</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-foreground">
                                                        {isValid(new Date(booking.scheduled_date)) ? format(new Date(booking.scheduled_date), 'HH:mm') : '--:--'}
                                                    </p>
                                                    {isStarted && (
                                                        <Badge variant="success" className="text-[10px] py-0 px-1.5 h-4">
                                                            PŘÍJEZD: {booking.started_at ? format(new Date(booking.started_at), 'HH:mm') : 'OK'}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">Čas zahájení</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 animate-in fade-in slide-in-from-top-2">
                                            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                <Clock className="h-5 w-5" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                <div>
                                                    <p className="text-sm font-bold text-foreground">
                                                        {estimatedHours}
                                                    </p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-bold">Odhadovaný čas</p>
                                                </div>
                                                {isCompleted && realDuration && (
                                                    <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                            {realDuration}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-bold">Skutečný čas</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 border border-border/50">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <MapPinIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-foreground truncate">
                                                    {booking.address}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Místo úklidu</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card: Customer Info */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Informace o zákazníkovi</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50 flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">E-mail</p>
                                            <p className="text-sm font-semibold truncate">{booking.clients?.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg border border-border/50 flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Telefon</p>
                                            <p className="text-sm font-semibold">{booking.clients?.phone || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                {booking.feedback && (
                                    <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">Hodnocení zákazníka</p>
                                            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-black">
                                                <Star className="h-3.5 w-3.5 fill-current" />
                                                <span>{booking.feedback.rating}/10</span>
                                            </div>
                                        </div>
                                        {booking.feedback.comment && (
                                            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-xs italic text-amber-900 leading-relaxed">
                                                "{booking.feedback.comment}"
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4 pt-2">
                                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">Preference a omezení</p>

                                    <div className="grid grid-cols-1 gap-3">
                                        {booking.clients?.has_allergies && (
                                            <div className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg flex items-start gap-3">
                                                <HeartPulse className="h-4 w-4 text-destructive mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-destructive">POZOR: ALERGIE</p>
                                                    <p className="text-xs text-destructive/80 leading-relaxed">{booking.clients.allergies_notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {booking.clients?.special_instructions && (
                                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex items-start gap-3">
                                                <Info className="h-4 w-4 text-primary mt-0.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-primary">POZNÁMKA KLIENTA</p>
                                                    <p className="text-xs italic text-muted-foreground leading-relaxed">"{booking.clients.special_instructions}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 px-1">
                                        <Badge variant="outline" className={cn("gap-1.5 py-1 px-3 rounded-full border-2", booking.clients?.has_children ? "text-blue-600 border-blue-100 bg-blue-50/50" : "opacity-30 grayscale")}>
                                            <Baby className="h-3.5 w-3.5" /> Děti
                                        </Badge>
                                        <Badge variant="outline" className={cn("gap-1.5 py-1 px-3 rounded-full border-2", booking.clients?.has_pets ? "text-orange-600 border-orange-100 bg-orange-50/50" : "opacity-30 grayscale")}>
                                            <Dog className="h-3.5 w-3.5" /> Mazlíčci
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Service & Management */}
                        <div className="col-span-12 lg:col-span-5 space-y-6">

                            {/* Card: Live Progress Tracker (Matching BookingCard) */}
                            {stats.total > 0 && (
                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Postup úklidu</h3>
                                        </div>
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                            {stats.completed} / {stats.total} Místností
                                        </span>
                                    </div>

                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000 ease-out"
                                            style={{ width: `${stats.percentage}%` }}
                                        />
                                    </div>

                                    {/* List view of rooms */}
                                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2 mt-4 custom-scrollbar">
                                        {stats.rooms.map(room => (
                                            <div key={room.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "h-6 w-6 rounded-full flex items-center justify-center border transition-all",
                                                        room.is_completed ? "bg-emerald-100 border-emerald-200 text-emerald-600" : "bg-slate-50 border-slate-100 text-slate-400"
                                                    )}>
                                                        {room.is_completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3 w-3" />}
                                                    </div>
                                                    <span className={cn("text-xs font-medium", room.is_completed ? "text-foreground" : "text-muted-foreground")}>
                                                        {room.room_name}
                                                    </span>
                                                </div>
                                                {room.completed_at && (
                                                    <span className="text-[10px] font-bold text-slate-400">{format(new Date(room.completed_at), 'HH:mm')}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Card: Finance Section */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-success" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Cena a věrnost</h3>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4 animate-in fade-in">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">CENA ÚKLIDU (Kč)</Label>
                                            <Input
                                                type="number"
                                                value={editFormData.price}
                                                onChange={e => setEditFormData({ ...editFormData, price: Number(e.target.value) })}
                                                className="h-11 rounded-lg border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">VĚRNOSTNÍ BODY (Override)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={editFormData.manual_loyalty_points || ''}
                                                    placeholder={`Automaticky: ${pricing.autoPoints}`}
                                                    onChange={e => setEditFormData({ ...editFormData, manual_loyalty_points: Number(e.target.value) })}
                                                    className="h-11 rounded-lg border-border pr-12"
                                                />
                                                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-muted-foreground/70 ml-1">ODHADOVANÝ ČAS (h)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={editFormData.estimated_hours}
                                                    onChange={e => setEditFormData({ ...editFormData, estimated_hours: Number(e.target.value) })}
                                                    className="h-11 rounded-lg border-border pr-12"
                                                />
                                                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 pt-1">
                                            <Checkbox
                                                id="skip-inv"
                                                checked={skipInvoice}
                                                onCheckedChange={(c) => setSkipInvoice(!!c)}
                                                className="h-5 w-5 rounded border-2 border-border"
                                            />
                                            <Label htmlFor="skip-inv" className="text-sm cursor-pointer font-medium text-foreground/80">
                                                Přeskočit automatickou fakturaci
                                            </Label>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-6 items-end">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Celková cena</p>
                                            <p className="text-2xl font-black text-success tracking-tight">{pricing.price} Kč</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Věrnostní body</p>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Sparkles className="h-4 w-4 text-amber-500" />
                                                <p className="text-lg font-bold text-foreground">{pricing.effectivePoints}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card: Fakturace Section */}
                            {invoice && (
                                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-emerald-600" />
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Fakturace</h3>
                                        </div>
                                        <Badge variant={invoice.status === 'paid' ? 'success' : 'default'} className="font-bold">
                                            {invoice.status === 'paid' ? 'Zaplaceno' : invoice.status === 'overdue' ? 'Po splatnosti' : 'K úhradě'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Číslo faktury</p>
                                            <p className="text-lg font-bold text-foreground">{invoice.invoice_number}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Celková částka</p>
                                            <p className="text-lg font-bold text-foreground">{(invoice.total || 0).toLocaleString('cs-CZ')} Kč</p>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => downloadInvoice(invoice, companyInfo)}
                                        disabled={generatingInvoiceId === invoice.id}
                                        className="w-full h-11 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold group"
                                    >
                                        <Download className={cn("h-4 w-4 mr-2 group-hover:scale-110 transition-transform", generatingInvoiceId === invoice.id && "animate-bounce")} />
                                        {generatingInvoiceId === invoice.id ? "Generuji PDF..." : "Stáhnout fakturu"}
                                    </Button>
                                </div>
                            )}

                            {/* Card: Team Assignment */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Přiřazený tým</h3>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-5 animate-in fade-in">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">VÝBĚR CLEANERŮ</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {teamMembers.map(m => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            const current = [...selectedTeamMembers];
                                                            if (current.includes(m.id)) {
                                                                setSelectedTeamMembers(current.filter(id => id !== m.id));
                                                            } else {
                                                                setSelectedTeamMembers([...current, m.id]);
                                                            }
                                                        }}
                                                        className={cn(
                                                            "px-4 py-2 rounded-lg border-2 cursor-pointer transition-all text-xs font-bold uppercase tracking-tight",
                                                            selectedTeamMembers.includes(m.id)
                                                                ? "bg-primary/5 border-primary text-primary shadow-sm"
                                                                : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
                                                        )}
                                                    >
                                                        {m.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">ODMĚNA TÝMU (Kč)</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    value={editFormData.team_reward}
                                                    onChange={e => setEditFormData({ ...editFormData, team_reward: Number(e.target.value) })}
                                                    className="h-11 rounded-lg border-border pr-12 font-bold"
                                                />
                                                <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">ŠABLONA CHECKLISTU</Label>
                                            <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                                                <SelectTrigger className="h-11 rounded-lg border-border font-bold">
                                                    <SelectValue placeholder="Beze šablony" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none_selection">Žádný checklist</SelectItem>
                                                    {checklists.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.street} {booking.clients?.email ? `(${booking.clients.email})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">PŘIŘAZENÍ CLEANERŮ</p>
                                            <div className="flex flex-wrap gap-2">
                                                {displayTeamMembers.length > 0 ? (
                                                    displayTeamMembers.map(tm => (
                                                        <Badge key={tm.id} variant="secondary" className="gap-2 px-3 py-1.5 text-xs font-bold rounded-lg bg-secondary/50 border-transparent shadow-sm">
                                                            <UserIcon className="h-3.5 w-3.5" />
                                                            {tm.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground italic pl-1">Nikdo není přiřazen...</span>
                                                )}
                                            </div>
                                        </div>

                                        {(booking.checklist || selectedChecklistId) && (
                                            <div className="pt-4 border-t border-border/40 space-y-2">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">AKTIVNÍ CHECKLIST</p>
                                                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                                                    <FileText className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-bold text-foreground">
                                                        {booking.checklist?.street || checklists.find(c => c.id === selectedChecklistId)?.street || 'Vlastní checklist'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Odměna týmu</p>
                                            <p className="text-xl font-black text-foreground">{pricing.teamReward} Kč</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card: Internal Notes */}
                            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Podrobnosti a poznámky</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-muted/10 rounded-xl border border-border/50">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase">Služba</p>
                                            <Badge variant="outline" className="font-bold border-2">{booking.service_type}</Badge>
                                        </div>

                                        <BookingDetailsDisplay
                                            bookingDetails={booking.booking_details}
                                            serviceType={booking.service_type}
                                            showPrice={false}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest pl-1">INTERNÍ POZNÁMKA</Label>
                                        {isEditing ? (
                                            <Textarea
                                                value={adminNotes}
                                                onChange={e => setAdminNotes(e.target.value)}
                                                rows={4}
                                                className="rounded-xl border-border resize-none text-sm font-medium focus:ring-primary/20"
                                                placeholder="Viditelné pouze pro administrátory a cleanerům v aplikaci..."
                                            />
                                        ) : (
                                            <div className="text-sm text-foreground bg-muted/5 p-4 rounded-xl border border-dashed border-border/60 italic leading-relaxed text-muted-foreground">
                                                {adminNotes || "Žádná interní poznámka nebyla přidána..."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <HiddenInvoiceContainer
                        generatingInvoiceId={generatingInvoiceId}
                        previewInvoice={hookInvoice}
                        companyInfo={companyInfo}
                        invoiceItems={hookItems}
                        bookings={[booking as any]}
                    />
                </div>

                {/* Footer Actions (Sticky for visibility) */}
                {isEditing && (
                    <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border p-6 -mx-6 -mb-6 flex flex-col gap-4 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-5">
                        <div className="flex items-center justify-between gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                className="text-muted-foreground hover:bg-muted font-bold tracking-tight px-6"
                            >
                                ZRUŠIT ZMĚNY
                            </Button>

                            <div className="flex items-center gap-3">
                                {booking.status === 'pending' && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleSave('declined')}
                                            disabled={isSaving}
                                            className="h-12 rounded-xl text-destructive hover:bg-destructive/5 border-destructive/20 font-bold uppercase tracking-wide transition-all"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            ZAMÍTNOUT
                                        </Button>
                                        <Button
                                            variant="default"
                                            onClick={() => handleSave('approved')}
                                            disabled={isSaving}
                                            className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 font-bold uppercase tracking-wide transition-all mr-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                SCHVÁLIT
                                            </div>
                                        </Button>
                                    </>
                                )}

                                <Button
                                    onClick={() => handleSave()}
                                    disabled={isSaving}
                                    className="h-12 px-12 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold uppercase tracking-wide transition-all"
                                >
                                    {isSaving ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            AKTUALIZUJI...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Save className="h-4 w-4" />
                                            ULOŽIT ZMĚNY
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
