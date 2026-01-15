import { ArrowLeft, Calendar, History, Star, Clock, Trophy, BadgeCheck, MapPin, FileText, ChevronDown, HeadphonesIcon, PhoneIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClientHeroHeader } from "@/components/client/ClientHeroHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookingDetailsDisplay } from "@/components/bookings/BookingDetailsDisplay";
import { LoadingOverlay } from "@/components/LoadingOverlay";

interface Booking {
    id: string;
    scheduled_date: string;
    service_type: string;
    address: string;
    booking_details: any;
    completed_at: string | null;
    started_at: string | null;
    status: string;
    client_id: string;
    user_id: string;
    admin_notes?: string | null;
    team_member_ids?: string[];
    feedback?: {
        rating: number;
        comment: string | null;
    } | null;
    client?: {
        has_children: boolean;
        has_pets: boolean;
        has_allergies: boolean;
        allergies_notes: string | null;
        special_instructions: string | null;
    };
}

const calculateActualTime = (booking: Booking) => {
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
    return null;
};

const calculateTimeEstimate = (booking: Booking) => {
    const price = booking.booking_details?.priceEstimate?.price || booking.booking_details?.priceEstimate?.priceMin || 0;
    if (!price) return null;

    let rate = 500;
    if (booking.service_type === 'upholstery_cleaning' || booking.booking_details?.service_id?.includes('upholstery') || booking.booking_details?.service_title?.toLowerCase().includes('čalounění')) {
        rate = 1500;
    }

    const totalHours = price / rate;
    const numCleaners = booking.team_member_ids?.length || 1;
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



export default function CleanerHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [history, setHistory] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState<Record<string, { id: string, user_id: string, name: string, profile?: { avatar_url: string | null, full_name: string | null } }>>({});
    const [currentMemberId, setCurrentMemberId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;
        try {
            const { data: teamMember } = await supabase
                .from('team_members')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!teamMember) {
                setLoading(false);
                return;
            }
            setCurrentMemberId(teamMember.id);

            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .contains('team_member_ids', [teamMember.id])
                .order('scheduled_date', { ascending: false });

            if (error) throw error;

            if (data) {
                // Collect all team member IDs
                const allTeamMemberIds = Array.from(new Set(data.flatMap(b => b.team_member_ids || [])));
                if (allTeamMemberIds.length > 0) {
                    const { data: membersData } = await supabase
                        .from('team_members')
                        .select('id, name, user_id')
                        .in('id', allTeamMemberIds);

                    if (membersData) {
                        const membersWithProfiles = await Promise.all(membersData.map(async m => {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('avatar_url, full_name')
                                .eq('user_id', m.user_id)
                                .maybeSingle();
                            return { [m.id]: { id: m.id, user_id: m.user_id, name: m.name, profile } };
                        }));
                        const membersMap = Object.assign({}, ...membersWithProfiles);
                        setTeamMembers(membersMap);
                    }
                }

                const historyEnhanced = await Promise.all(data.map(async (booking: any) => {
                    const { data: feedback } = await supabase
                        .from('booking_feedback')
                        .select('rating, comment')
                        .eq('booking_id', booking.id)
                        .maybeSingle();

                    // Fetch client instructions
                    const { data: client } = await supabase
                        .from('clients')
                        .select('has_children, has_pets, has_allergies, allergies_notes, special_instructions')
                        .eq('id', booking.client_id)
                        .maybeSingle();

                    return {
                        ...booking,
                        feedback,
                        client
                    };
                }));
                setHistory(historyEnhanced);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalJobs = history.length;
        const totalEarnings = history.reduce((sum, b) => sum + (b.booking_details?.cleaner_earnings || 0), 0);
        const ratings = history.map(b => b.feedback?.rating).filter((r): r is number => r !== undefined && r !== null);
        const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : "0.0";

        return { totalJobs, totalEarnings, avgRating };
    }, [history]);

    if (loading) {
        return <LoadingOverlay message="Načítám Vaši historii..." />;
    }

    return (
        <div className="container mx-auto p-4 pb-24 space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Header */}
            <ClientHeroHeader
                icon={History}
                title="Vaše historie"
                subtitle="Přehled všech úklidů a výdělků"
                variant="primary"
                stats={[
                    { icon: BadgeCheck, label: "Celkem", value: stats.totalJobs },
                    { icon: Trophy, label: "Hodnocení", value: stats.avgRating },
                    { icon: Clock, label: "Výdělek", value: `${stats.totalEarnings} Kč` }
                ]}
            />

            <div className="space-y-4 pt-4">

                {history.length === 0 ? (
                    <Card className="border-dashed border-2 rounded-3xl bg-slate-50/50">
                        <CardContent className="py-12 text-center text-muted-foreground whitespace-pre-wrap">
                            Zatím nemáte žádné dokončené úklidy.
                        </CardContent>
                    </Card>
                ) : (
                    history.map((booking) => (
                        <Card key={booking.id} className="relative overflow-hidden border-0 shadow-sm rounded-3xl bg-card group transition-all hover:shadow-md">
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                                booking.status === 'completed' ? "bg-green-500" :
                                    booking.status === 'approved' ? "bg-indigo-500" :
                                        booking.status === 'pending' ? "bg-amber-400" : "bg-red-500"
                            )} />

                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold text-foreground/90">
                                            {booking.booking_details?.service_title || booking.service_type}
                                        </CardTitle>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                                            <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-lg">
                                                <Calendar className="h-3.5 w-3.5" />
                                                <span>{format(new Date(booking.scheduled_date), 'PPP', { locale: cs })}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-muted/60 px-2 py-0.5 rounded-lg">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span>{format(new Date(booking.scheduled_date), 'HH:mm')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    {booking.status === 'in_progress' || (booking.started_at && !booking.completed_at) ? (
                                        <Badge variant="default" className="w-fit bg-emerald-500 hover:bg-emerald-600 border-0 px-3 py-1 text-sm shadow-md flex items-center gap-1.5 transition-all">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                            </span>
                                            Probíhá
                                        </Badge>
                                    ) : booking.status === 'completed' ? (
                                        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900 font-bold">
                                            Dokončeno
                                        </Badge>
                                    ) : booking.status === 'approved' ? (
                                        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-900 font-bold">
                                            Schváleno
                                        </Badge>
                                    ) : booking.status === 'pending' ? (
                                        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-900 font-bold">
                                            Čeká
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary" className="w-fit px-3 py-1 text-sm bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900 font-bold">
                                            Zrušeno
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4">
                                    {booking.booking_details?.cleaner_earnings !== undefined && (
                                        <div className="bg-green-600/10 text-green-700 border border-green-200/50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                            <Trophy className="h-3.5 w-3.5" />
                                            Odměna: {booking.booking_details.cleaner_earnings} Kč
                                        </div>
                                    )}
                                    {booking.feedback && (
                                        <div className="bg-amber-100/50 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                            {booking.feedback.rating}/10
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-2">
                                        {calculateActualTime(booking) && (
                                            <div className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                                                <Clock className="h-3.5 w-3.5" />
                                                {calculateActualTime(booking)}
                                            </div>
                                        )}
                                        {calculateTimeEstimate(booking) && (booking.status !== 'completed' || (booking.team_member_ids && booking.team_member_ids.length > 1)) && (
                                            <div className="bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                                                <Clock className="h-3.5 w-3.5" />
                                                {calculateTimeEstimate(booking)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-5 pt-3 space-y-4">
                                <div className="flex items-start gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                    <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                        <MapPin className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium leading-normal break-words">{booking.address}</p>
                                    </div>
                                </div>

                                {booking.feedback?.comment && (
                                    <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/50 italic text-sm text-amber-900/90 dark:text-amber-200/80">
                                        "{booking.feedback.comment}"
                                    </div>
                                )}

                                <Collapsible>
                                    <CollapsibleTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-between h-auto py-2.5 px-3 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl border border-transparent hover:border-primary/10 transition-all group"
                                        >
                                            <span>Zobrazit detaily úklidu</span>
                                            <ChevronDown className="h-3.5 w-3.5 opacity-70 group-data-[state=open]:rotate-180 transition-transform" />
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="mt-2 space-y-3">
                                        <div className="bg-muted/30 p-4 rounded-2xl border text-sm">
                                            <BookingDetailsDisplay bookingDetails={booking.booking_details} serviceType={booking.service_type} showPrice={false} />
                                        </div>

                                        {/* Household & Instructions Section inside collapsible */}
                                        {booking.client && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {(booking.client.has_children || booking.client.has_pets || booking.client.has_allergies) && (
                                                    <div className="flex flex-wrap gap-2 px-1">
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
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px]">
                                                        <p className="font-semibold text-slate-900 dark:text-slate-200 mb-1 flex items-center gap-1">
                                                            <FileText className="h-3 w-3 text-primary" /> Pokyny klienta:
                                                        </p>
                                                        <p className="text-muted-foreground italic leading-relaxed">"{booking.client.special_instructions}"</p>
                                                    </div>
                                                )}
                                                {booking.client.has_allergies && booking.client.allergies_notes && (
                                                    <div className="p-3 bg-red-50/50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 text-[11px] text-red-800 dark:text-red-300">
                                                        <strong>Poznámka k alergiím:</strong> {booking.client.allergies_notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {booking.team_member_ids && booking.team_member_ids.length > 1 && (
                                            <div className="pt-2 border-t mt-2">
                                                <Collapsible>
                                                    <CollapsibleTrigger asChild>
                                                        <Button variant="ghost" className="w-full justify-between h-auto py-1 px-1 text-[10px] text-muted-foreground hover:bg-transparent group/team">
                                                            <span className="font-semibold uppercase tracking-wider">Kolegové ({booking.team_member_ids.length - 1})</span>
                                                            <ChevronDown className="h-3 w-3 opacity-50 group-data-[state=open]/team:rotate-180 transition-transform" />
                                                        </Button>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent className="mt-2 flex flex-wrap gap-2">
                                                        {booking.team_member_ids
                                                            .filter(id => id !== currentMemberId)
                                                            .map(id => {
                                                                const member = teamMembers[id];
                                                                if (!member) return null;
                                                                return (
                                                                    <div key={id} className="flex items-center gap-1.5 bg-background border px-2 py-1 rounded-lg">
                                                                        {member.profile?.avatar_url ? (
                                                                            <img src={member.profile.avatar_url} alt={member.name} className="h-4 w-4 rounded-full object-cover" />
                                                                        ) : (
                                                                            <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                                {member.name.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                        <span className="text-[10px] font-medium">{member.name}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </div>
                                        )}
                                        {booking.admin_notes && (
                                            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs">
                                                <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> Poznámky od správce:
                                                </p>
                                                <p className="text-blue-700/80 dark:text-blue-400/80">{booking.admin_notes}</p>
                                            </div>
                                        )}
                                    </CollapsibleContent>
                                </Collapsible>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Support Container */}
            <div className="pt-6 border-t border-border/50">
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900/50 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 transition-all hover:shadow-md group">
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
        </div>
    );
}
