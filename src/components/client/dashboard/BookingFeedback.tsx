import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BookingFeedbackProps {
    bookingId: string;
    onSubmit: (bookingId: string, rating: number, comment: string) => Promise<void>;
    onDecline?: (bookingId: string) => Promise<void>;
}

export function BookingFeedback({ bookingId, onSubmit, onDecline }: BookingFeedbackProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Prosím vyberte počet hvězdiček');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(bookingId, rating, comment);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="rounded-xl bg-gradient-to-br from-primary/5 via-primary/5 to-transparent p-5 text-center space-y-4 border border-primary/10">
                <h4 className="font-semibold text-lg text-primary">Jak jste byli spokojeni s úklidem?</h4>

                <div className="flex flex-col items-center gap-3">
                    <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                            <button
                                key={star}
                                onClick={() => {
                                    setRating(star);
                                    setIsExpanded(true);
                                }}
                                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full transition-transform hover:scale-110 active:scale-95"
                            >
                                <Star
                                    className={cn(
                                        "h-7 w-7 transition-all duration-300",
                                        star <= rating
                                            ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                            : "fill-transparent text-muted-foreground/30 hover:text-yellow-400/70"
                                    )}
                                />
                            </button>
                        ))}
                    </div>

                    {!isExpanded && onDecline && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDecline(bookingId)}
                            className="text-muted-foreground hover:text-primary transition-all text-xs font-bold uppercase tracking-widest h-auto py-1"
                        >
                            Nechci hodnotit
                        </Button>
                    )}
                </div>

                <div className={cn(
                    "grid transition-all duration-500 ease-in-out",
                    isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                )}>
                    <div className="min-h-0 space-y-3">
                        <Textarea
                            placeholder="Napište nám krátké hodnocení (nepovinné)..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="bg-background/80 resize-none min-h-[80px]"
                        />

                        <div className="flex justify-end gap-2">
                            {onDecline && (
                                <Button variant="ghost" size="sm" onClick={() => onDecline(bookingId)} disabled={isSubmitting}>
                                    Nechci hodnotit
                                </Button>
                            )}
                            <PremiumButton
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-4"
                            >
                                {isSubmitting ? 'Odesílání...' : 'Odeslat hodnocení'}
                            </PremiumButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
