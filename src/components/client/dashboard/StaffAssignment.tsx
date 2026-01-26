import { Users, Sparkles } from 'lucide-react';
import maidImage from '@/assets/maid.png';
import { CleanerCard } from '@/components/client/CleanerCard';
import { Booking } from '@/types/client-dashboard';

interface StaffAssignmentProps {
    booking: Booking;
}

export function StaffAssignment({ booking }: StaffAssignmentProps) {
    const isPending = booking.status === 'pending';

    return (
        <div className="pt-4 border-t border-border/50">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" /> Váš úklidový tým
            </h4>

            {booking.team_members && booking.team_members.length > 0 ? (
                <div className="grid gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {booking.team_members.map((member, idx) => (
                        <CleanerCard
                            key={idx}
                            name={member.name}
                            userId={member.user_id}
                            avatarPath={member.profile?.avatar_url}
                            fullName={member.profile?.full_name}
                            bio={member.bio}
                        />
                    ))}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-muted via-muted to-muted/50 p-6 border border-border/50 shadow-sm group hover:shadow-md transition-all duration-300">
                    {/* Background decoration */}
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-xl group-hover:bg-primary/10 transition-colors duration-500" />
                    <div className="absolute -left-2 -bottom-2 h-20 w-20 rounded-full bg-primary/5 blur-lg" />

                    <div className="relative flex items-center gap-5">
                        {/* Static maid placeholder */}
                        <div className="flex-shrink-0 drop-shadow-lg">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/10 rounded-full blur-md" />
                                <img
                                    src={maidImage}
                                    alt="Uklízečka"
                                    className="h-20 w-20 object-contain relative z-10"
                                />
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-24 bg-primary/20 rounded-full animate-pulse" />
                                <Sparkles className="h-3 w-3 text-primary/40 animate-pulse" />
                            </div>
                            <div className="space-y-1.5">
                                <div className="h-2 w-full bg-primary/10 rounded-full" />
                                <div className="h-2 w-3/4 bg-primary/10 rounded-full" />
                            </div>
                            <p className="text-xs text-muted-foreground italic font-medium">
                                {isPending
                                    ? 'Přidělíme vám profesionála jakmile rezervaci schválíme'
                                    : 'Brzy vám přiřadíme profesionálního člena týmu'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
