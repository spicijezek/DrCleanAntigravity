import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { CheckCircle2, Clock } from 'lucide-react';
import { Booking } from '@/types/client-dashboard';

interface BookingTimelineProps {
    booking: Booking;
}

export function BookingTimeline({ booking }: BookingTimelineProps) {
    const isPending = booking.status === 'pending';
    const isApproved = booking.status === 'approved';
    const isCompleted = booking.status === 'completed';
    const hasStarted = !!booking.started_at;

    const getProgressHeight = () => {
        if (isPending) return '0%';
        if (isApproved && !hasStarted) return '33%';
        if (isApproved && hasStarted) return '66%';
        if (isCompleted) return '100%';
        return '0%';
    };

    const currentStep = isCompleted ? 4 : (isApproved && hasStarted) ? 3 : (isApproved) ? 2 : 1;

    const steps = [
        {
            id: 1,
            label: 'Objednávka přijata',
            subtext: isPending ? 'Čekáme na schválení adminem' : '',
            active: isPending || isApproved || isCompleted,
            current: isPending
        },
        {
            id: 2,
            label: 'Schváleno & Naplánováno',
            subtext: isApproved && !hasStarted && !isCompleted
                ? `Plánovaný termín: ${format(new Date(booking.scheduled_date), 'PPP', { locale: cs })}`
                : '',
            active: isApproved || isCompleted,
            current: isApproved && !hasStarted && !isCompleted
        },
        {
            id: 3,
            label: 'Úklid byl zahájen',
            subtext: isApproved && hasStarted && !isCompleted ? 'Právě probíhá úklid...' : '',
            active: (isApproved && hasStarted) || isCompleted,
            current: isApproved && hasStarted && !isCompleted
        },
        {
            id: 4,
            label: 'Dokončeno',
            subtext: isCompleted ? 'Děkujeme za Vaši důvěru!' : '',
            active: isCompleted,
            current: isCompleted
        }
    ];

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-muted/80 via-muted to-muted/80 p-4">
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-[11px] top-3 h-[calc(100%-24px)] w-0.5 bg-muted-foreground/20 -z-10" />
                <div
                    className="absolute left-[11px] top-3 w-0.5 bg-primary transition-all duration-500 ease-in-out -z-10"
                    style={{ height: `calc(${getProgressHeight()} * (100% - 24px) / 100%)` }}
                />

                <div className="space-y-4 relative z-10">
                    {steps.map((step) => (
                        <div key={step.id} className="flex items-start gap-3 group">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${step.active
                                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-100'
                                    : 'bg-muted-foreground/20 text-muted-foreground scale-90 opacity-70'
                                }`}>
                                {step.current ? (
                                    <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-primary-foreground" />
                                ) : step.active ? (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                    <span className="text-xs font-semibold">{step.id}</span>
                                )}
                            </div>
                            <div className="flex-1 pt-0.5">
                                <p className={`text-sm font-medium transition-colors duration-300 ${step.active ? 'text-foreground' : 'text-muted-foreground'
                                    }`}>
                                    {step.label}
                                </p>
                                {step.subtext && (
                                    <p className="text-xs text-primary mt-0.5 animate-in fade-in slide-in-from-top-1 duration-300">
                                        {step.subtext}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
