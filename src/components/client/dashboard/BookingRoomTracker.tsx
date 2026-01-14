import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingRoomTrackerProps {
    checklist: {
        id: string;
        street: string;
        rooms: Array<{
            id: string;
            room_name: string;
            is_completed: boolean;
            completed_at: string | null;
            sort_order?: number;
        }>;
    };
}

export function BookingRoomTracker({ checklist }: BookingRoomTrackerProps) {
    if (!checklist || !checklist.rooms || checklist.rooms.length === 0) return null;

    const sortedRooms = [...checklist.rooms].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const completedCount = sortedRooms.filter(r => r.is_completed).length;

    return (
        <div className="mt-4 pt-4 border-t border-border/50 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 text-foreground/70">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Průběh úklidu
                </h4>
                <span className="text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                    {Math.round((completedCount / sortedRooms.length) * 100)}%
                </span>
            </div>

            {/* Single Continuous Progress Bar */}
            <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-inner">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    style={{ width: `${(completedCount / sortedRooms.length) * 100}%` }}
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer opacity-30" />
                </div>
            </div>

            <div className="flex justify-between mt-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest px-1">
                <span>Start</span>
                <span>{completedCount} z {sortedRooms.length} místností hotovo</span>
                <span>Cíl</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                {sortedRooms.map(room => (
                    <div key={room.id} className={cn(
                        "flex items-center gap-1.5 p-1.5 rounded-lg border text-[10px] transition-all duration-300",
                        room.is_completed
                            ? "bg-green-50/40 border-green-100 text-green-700 dark:bg-green-900/10 dark:border-green-900/30 shadow-sm"
                            : "bg-muted/5 border-transparent text-muted-foreground/60"
                    )}>
                        <div className={cn(
                            "h-4 w-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500",
                            room.is_completed ? "bg-green-100 text-green-600 dark:bg-green-900/40" : "bg-muted/40"
                        )}>
                            {room.is_completed ? (
                                <CheckCircle2 className="h-2.5 w-2.5" />
                            ) : (
                                <Circle className="h-2 w-2 opacity-20" />
                            )}
                        </div>
                        <span className="truncate font-semibold flex-1">
                            {room.room_name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
