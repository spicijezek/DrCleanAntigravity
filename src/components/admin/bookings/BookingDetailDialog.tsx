import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import {
    Calendar as CalendarIcon, MapPin as MapPinIcon, User as UserIcon, Clock, Save, X, CheckCircle2,
    Trash2, XCircle, Users, Star, FileText, Download, Shield, Sparkles,
    Banknote, Baby, Dog, HeartPulse, Flag, Mail, Phone, ChevronRight, Settings, Info
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
    job_earnings?: {
        amount: number;
        team_member_id: string;
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
    const [activeTab, setActiveTab] = useState<'overview' | 'editor' | 'details'>('overview');
    const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
    const [adminNotes, setAdminNotes] = useState('');
    const [checklists, setChecklists] = useState<any[]>([]);
    const [selectedChecklistId, setSelectedChecklistId] = useState('');
    const [skipInvoice, setSkipInvoice] = useState(false);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (booking) {
            // Initialize team members from ids or fallback to relation data
            const initialTeamMembers = booking.team_member_ids && booking.team_member_ids.length > 0
                ? booking.team_member_ids
                : booking.team_members?.map(tm => tm.id) || [];

            setSelectedTeamMembers(initialTeamMembers);
            setAdminNotes(booking.admin_notes || '');
            setSelectedChecklistId(booking.checklist_id || '');
            setSkipInvoice(booking.skip_invoice || false);

            const scheduledDateTime = new Date(booking.scheduled_date);
            setEditFormData({
                scheduled_date: format(scheduledDateTime, 'yyyy-MM-dd'),
                scheduled_time: format(scheduledDateTime, 'HH:mm'),
                address: booking.address,
                status: booking.status,
                booking_details: { ...booking.booking_details },
                service_type: booking.service_type,
                manual_loyalty_points: booking.booking_details?.manual_loyalty_points || 0
            });

            fetchChecklists();
        }
    }, [booking]);

    const fetchChecklists = async () => {
        if (!booking) return;
        try {
            const { data } = await supabase
                .from('client_checklists')
                .select('*')
                .eq('client_id', booking.client_id);
            setChecklists(data || []);
        } catch (error) {
            console.error('Error fetching checklists:', error);
        }
    };

    if (!booking || !editFormData) return null;

    const isStarted = !!booking.started_at || booking.status === 'in_progress';
    const isInProgress = booking.status === 'in_progress';
    const isCompleted = booking.status === 'completed' || booking.status === 'paid';

    const teamReward = booking.job_earnings?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

    // Auto points (27%)
    const price = editFormData.booking_details?.priceEstimate?.price || editFormData.booking_details?.priceEstimate?.priceMin || 0;
    const autoPoints = Math.round(price * 0.27);
    const effectivePoints = editFormData.manual_loyalty_points || autoPoints;

    const handleSave = async (quickStatus?: string) => {
        setIsSaving(true);
        try {
            const [year, month, day] = editFormData.scheduled_date.split('-').map(Number);
            const [hours, minutes] = editFormData.scheduled_time.split(':').map(Number);
            const scheduledDateTime = new Date(year, month - 1, day, hours, minutes).toISOString();

            const finalDetails = {
                ...editFormData.booking_details,
                manual_loyalty_points: editFormData.manual_loyalty_points
            };

            const { error } = await supabase
                .from('bookings')
                .update({
                    scheduled_date: scheduledDateTime,
                    address: editFormData.address,
                    status: quickStatus || editFormData.status,
                    booking_details: finalDetails,
                    team_member_ids: selectedTeamMembers,
                    admin_notes: adminNotes,
                    checklist_id: selectedChecklistId || null,
                    skip_invoice: skipInvoice
                })
                .eq('id', booking.id);

            if (error) throw error;
            toast({ title: 'Uloženo', description: 'Rezervace byla úspěšně aktualizována' });
            if (activeTab === 'editor') setActiveTab('overview');
            onUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Chyba', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[95vw] max-w-[1000px] h-[85vh] max-h-[85vh] p-0 border-0 bg-transparent shadow-2xl rounded-[3rem] overflow-hidden focus:outline-none data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2">
                <div className="relative h-full flex flex-col bg-white">

                    {/* Header Strip */}
                    <div className="flex items-center justify-between p-6 pb-4 border-b bg-slate-50/50">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center justify-center text-white">
                                <UserIcon className="h-7 w-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-none mb-1">
                                    {booking.clients?.name}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-white/80 border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-lg shadow-sm">
                                        ID: {booking.id.split('-')[0]}
                                    </Badge>
                                    <span className="text-sm font-bold text-slate-400">
                                        {format(new Date(booking.created_at), 'd. M. yyyy', { locale: cs })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-2xl mr-4 shadow-inner">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveTab('overview');
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative z-20",
                                        activeTab === 'overview' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <Info className="h-4 w-4" /> Přehled
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveTab('editor');
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative z-20",
                                        activeTab === 'editor' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <Settings className="h-4 w-4" /> Správa
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setActiveTab('details');
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative z-20",
                                        activeTab === 'details' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    <FileText className="h-4 w-4" /> Detaily
                                </button>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-100 transition-all active:scale-90">
                                <X className="h-5 w-5 text-slate-400" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6 minimal-scrollbar">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-12 gap-8 items-start">
                                {/* Left Column: Live Progress & Service */}
                                <div className="col-span-12 lg:col-span-7 space-y-8">

                                    {/* Quick Summary Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100/50 space-y-3 shadow-sm">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Termín úklidu</p>
                                            <div className="flex items-center gap-3">
                                                <CalendarIcon className="h-5 w-5 text-indigo-500" />
                                                <p className="text-lg font-black text-indigo-900 leading-none">
                                                    {format(new Date(booking.scheduled_date), 'd. M. yyyy')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-5 w-5 text-indigo-500" />
                                                <p className="text-lg font-black text-indigo-900 leading-none">
                                                    {format(new Date(booking.scheduled_date), 'HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100/50 space-y-3 shadow-sm">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Finanční přehled</p>
                                            <div className="flex items-center gap-3">
                                                <Banknote className="h-5 w-5 text-emerald-500" />
                                                <p className="text-xl font-black text-emerald-900 leading-none">
                                                    {price} Kč
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <p className="text-sm font-black text-amber-700">
                                                    {effectivePoints} věrnostních bodů
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Progress Hub */}
                                    {(isInProgress || isCompleted) && booking.checklist?.rooms && (
                                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                            {/* Glow effect */}
                                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />

                                            <div className="flex items-center justify-between mb-8 relative z-10">
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black tracking-tight leading-none uppercase">Průběh úklidu</h3>
                                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em]">Živý přenos z aplikace</p>
                                                </div>
                                                {isInProgress && (
                                                    <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px] px-3 py-1 animate-pulse">
                                                        Probíhá právě teď
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide relative z-10">
                                                {booking.checklist.rooms.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map(room => (
                                                    <div key={room.id} className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl border transition-all duration-500",
                                                        room.is_completed
                                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5 rotate-y-[-5deg]"
                                                            : "bg-white/5 border-white/10 text-slate-400 opacity-60"
                                                    )}>
                                                        <div className="flex items-center gap-4">
                                                            <div className={cn(
                                                                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-transform duration-500",
                                                                room.is_completed ? "border-emerald-500 bg-emerald-500/20 scale-110" : "border-slate-700 bg-slate-800"
                                                            )}>
                                                                {room.is_completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-4 w-4 opacity-30" />}
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                <span className="text-base font-bold tracking-tight block leading-none">{room.room_name}</span>
                                                                {room.is_completed && <span className="text-[10px] font-black uppercase opacity-60">Dokončeno</span>}
                                                            </div>
                                                        </div>
                                                        {room.completed_at && (
                                                            <div className="text-right">
                                                                <span className="text-[10px] block opacity-40 font-bold uppercase mb-0.5">Timestamp</span>
                                                                <span className="text-sm font-black tabular-nums">{format(new Date(room.completed_at), 'HH:mm')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Summary Progress bar */}
                                            <div className="mt-8 pt-6 border-t border-white/10 relative z-10">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Celkový postup</span>
                                                    <span className="text-sm font-black">{Math.round((booking.checklist.rooms.filter(r => r.is_completed).length / booking.checklist.rooms.length) * 100)}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                    <div className="h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                                        style={{ width: `${(booking.checklist.rooms.filter(r => r.is_completed).length / booking.checklist.rooms.length) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Preferences & Allergies Highlight */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Specifické požadavky</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {booking.clients?.has_allergies && (
                                                <div className="col-span-2 p-5 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-left-4 duration-500">
                                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-red-500 shrink-0 border border-red-50">
                                                        <HeartPulse className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Pozor: ALERGIE</p>
                                                        <p className="text-sm font-bold text-red-900 leading-snug">
                                                            {booking.clients.allergies_notes || 'Zákazník hlásí alergie, dbejte zvýšené opatrnosti.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            {booking.clients?.special_instructions && (
                                                <div className="col-span-2 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-start gap-5">
                                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-50">
                                                        <Star className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Osobní preference</p>
                                                        <p className="text-sm font-bold text-indigo-900 italic leading-snug">
                                                            "{booking.clients.special_instructions}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="p-4 bg-slate-50 border rounded-[1.5rem] flex items-center gap-3">
                                                <Baby className={cn("h-5 w-5", booking.clients?.has_children ? "text-blue-500" : "text-slate-300")} />
                                                <span className={cn("text-xs font-bold", booking.clients?.has_children ? "text-slate-900" : "text-slate-400")}>Děti v domácnosti</span>
                                            </div>
                                            <div className="p-4 bg-slate-50 border rounded-[1.5rem] flex items-center gap-3">
                                                <Dog className={cn("h-5 w-5", booking.clients?.has_pets ? "text-orange-500" : "text-slate-300")} />
                                                <span className={cn("text-xs font-bold", booking.clients?.has_pets ? "text-slate-900" : "text-slate-400")}>S domácími mazlíčky</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Client Info & Internal Notes */}
                                <div className="col-span-12 lg:col-span-5 space-y-8">

                                    {/* Client Contact Hub */}
                                    <div className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Kontakt na klienta</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border group-hover:text-indigo-500 transition-colors"><Mail className="h-5 w-5" /></div>
                                                    <span className="text-sm font-bold truncate max-w-[180px]">{booking.clients?.email}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border group-hover:text-green-500 transition-colors"><Phone className="h-5 w-5" /></div>
                                                    <span className="text-sm font-bold">{booking.clients?.phone}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300" />
                                            </div>
                                            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-colors">
                                                <div className="flex items-start gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border group-hover:text-amber-500 transition-colors shrink-0"><MapPinIcon className="h-5 w-5" /></div>
                                                    <span className="text-sm font-bold leading-snug pt-2.5">{booking.address}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-slate-300 mt-2.5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Internal Team Info */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Interní informace</h3>
                                        <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2rem] space-y-6">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Přiřazený tým</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {booking.team_members && booking.team_members.length > 0 ? (
                                                        booking.team_members.map(tm => (
                                                            <div key={tm.id} className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl border shadow-sm font-bold text-xs text-slate-700">
                                                                <Users className="h-3.5 w-3.5 text-indigo-500" />
                                                                {tm.name}
                                                            </div>
                                                        ))
                                                    ) : <span className="text-xs font-bold text-slate-400 italic">Nepřiřazeno žádné personální obsazení</span>}
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Odměna týmu</p>
                                                <div className="bg-white p-4 rounded-2xl border flex items-center justify-between">
                                                    <span className="text-2xl font-black text-slate-900">{teamReward} Kč</span>
                                                    <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black underline uppercase text-indigo-500">Změnit výpočet</Button>
                                                </div>
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Tým • Poznámky správce</p>
                                                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 italic text-sm text-amber-900/70 leading-relaxed shadow-sm">
                                                    {booking.admin_notes || 'Bez interních poznámek...'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {activeTab === 'editor' && (
                            <div className="grid grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-500">
                                <div className="col-span-12 lg:col-span-8 space-y-8">
                                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-8">
                                        <h3 className="text-xl font-black text-slate-900">Editor Rezervace</h3>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Datum</Label>
                                                <Input
                                                    type="date"
                                                    value={editFormData.scheduled_date}
                                                    onChange={e => setEditFormData({ ...editFormData, scheduled_date: e.target.value })}
                                                    className="h-14 rounded-2xl border-2 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Čas</Label>
                                                <Input
                                                    type="time"
                                                    value={editFormData.scheduled_time}
                                                    onChange={e => setEditFormData({ ...editFormData, scheduled_time: e.target.value })}
                                                    className="h-14 rounded-2xl border-2 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Adresa úklidu</Label>
                                                <Input
                                                    value={editFormData.address}
                                                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                                                    className="h-14 rounded-2xl border-2 focus:border-indigo-500 font-bold"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Výběr Týmu</Label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {teamMembers.map(m => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            if (selectedTeamMembers.includes(m.id)) setSelectedTeamMembers(selectedTeamMembers.filter(id => id !== m.id))
                                                            else setSelectedTeamMembers([...selectedTeamMembers, m.id])
                                                        }}
                                                        className={cn(
                                                            "flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95",
                                                            selectedTeamMembers.includes(m.id)
                                                                ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm"
                                                                : "bg-slate-50 border-transparent text-slate-500 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                                        )}
                                                    >
                                                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center border-2", selectedTeamMembers.includes(m.id) ? "border-indigo-500 bg-white" : "border-slate-300")}>
                                                            {selectedTeamMembers.includes(m.id) && <CheckCircle2 className="h-3 w-3 fill-indigo-500 text-white" />}
                                                        </div>
                                                        <span className="text-xs font-black uppercase tracking-tight">{m.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Přiřazení Checklistu</Label>
                                            <Select value={selectedChecklistId} onValueChange={setSelectedChecklistId}>
                                                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold focus:ring-0 focus:border-indigo-500">
                                                    <SelectValue placeholder="Bez přiřazeného checklistu" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-2 shadow-2xl">
                                                    <SelectItem value="">Žádný checklist</SelectItem>
                                                    {checklists.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>
                                                            {c.street} {booking.clients?.email ? `(${booking.clients.email})` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Cena (Kč)</Label>
                                                <Input
                                                    type="number"
                                                    value={editFormData.booking_details?.priceEstimate?.price || 0}
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value);
                                                        setEditFormData({
                                                            ...editFormData,
                                                            booking_details: {
                                                                ...editFormData.booking_details,
                                                                priceEstimate: { ...editFormData.booking_details.priceEstimate, price: newVal }
                                                            }
                                                        });
                                                    }}
                                                    className="h-14 rounded-2xl border-2 border-emerald-100 focus:border-emerald-500 font-black text-xl text-emerald-600"
                                                />
                                            </div>
                                            <div className="space-y-2 text-right">
                                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mr-1">Věrnostní body (Override)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        value={editFormData.manual_loyalty_points || ''}
                                                        placeholder={`Auto: ${autoPoints}`}
                                                        onChange={e => setEditFormData({ ...editFormData, manual_loyalty_points: Number(e.target.value) })}
                                                        className="h-14 rounded-2xl border-2 border-amber-100 focus:border-amber-500 font-black text-xl text-amber-600 text-right pr-12"
                                                    />
                                                    <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-300" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Interní poznámka (Vidí úklidovec)</Label>
                                            <Textarea
                                                value={adminNotes}
                                                onChange={e => setAdminNotes(e.target.value)}
                                                rows={4}
                                                className="rounded-[1.5rem] border-2 focus:border-indigo-500 font-medium resize-none"
                                                placeholder="Specifické instrukce k tomuto úklidu..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-12 lg:col-span-4 space-y-6">
                                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl sticky top-0">
                                        <h4 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-400">Akce CMS</h4>
                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            {booking.status === 'pending' && (
                                                <div className="space-y-3">
                                                    <Button
                                                        onClick={() => handleSave('approved')}
                                                        disabled={isSaving}
                                                        className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 font-black uppercase tracking-widest text-xs shadow-[0_10px_20px_rgba(99,102,241,0.3)] transition-all active:scale-95"
                                                    >
                                                        {isSaving ? 'Schvaluji...' : 'Schválit a Uložit'}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => handleSave('declined')}
                                                        disabled={isSaving}
                                                        className="w-full h-14 rounded-2xl bg-white/5 hover:bg-red-500 hover:text-white font-black uppercase tracking-widest text-xs text-red-400 border border-white/5"
                                                    >
                                                        Zamítnout
                                                    </Button>
                                                </div>
                                            )}

                                            <Button
                                                onClick={() => handleSave()}
                                                disabled={isSaving}
                                                variant="default"
                                                className="w-full h-14 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95"
                                            >
                                                {isSaving ? 'Ukládám...' : 'Pouze uložit změny'}
                                            </Button>

                                            <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-2xl border border-white/10 mt-4">
                                                <Checkbox
                                                    id="skip-invoice"
                                                    checked={skipInvoice}
                                                    onCheckedChange={(c) => setSkipInvoice(!!c)}
                                                    className="border-white/50 data-[state=checked]:bg-indigo-500"
                                                />
                                                <Label htmlFor="skip-invoice" className="text-xs font-bold leading-tight cursor-pointer select-none">Přeskočit automatickou fakturaci (Paid in Cash / Other)</Label>
                                            </div>
                                        </div>

                                        <div className="pt-6 space-y-4">
                                            <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] text-center">Historie akcí</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 text-xs opacity-60">
                                                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                    <span>Vytvořeno automaticky</span>
                                                </div>
                                                {isStarted && (
                                                    <div className="flex items-center gap-3 text-xs text-emerald-400 font-bold">
                                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span>Zasláno k provedení</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'details' && (
                            <div className="bg-slate-50 border rounded-[3rem] p-12 min-h-[500px] animate-in slide-in-from-bottom-8 duration-700">
                                <h3 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-200 pb-6 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><Info className="h-5 w-5" /></div>
                                    Podrobnosti Klientské Objednávky
                                </h3>
                                <BookingDetailsDisplay
                                    bookingDetails={booking.booking_details}
                                    serviceType={booking.service_type}
                                    showPrice={true}
                                />

                                <div className="mt-12 p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                    <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">Technické Metadata</h4>
                                    <div className="grid grid-cols-2 gap-8 text-sm">
                                        <div className="space-y-1">
                                            <span className="block text-[10px] font-black opacity-30 uppercase">Právní subjekt</span>
                                            <span className="font-bold">{booking.clients?.city || 'Fyzická osoba'}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="block text-[10px] font-black opacity-30 uppercase">User context ID</span>
                                            <span className="font-mono text-[10px] opacity-60">{booking.client_id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
