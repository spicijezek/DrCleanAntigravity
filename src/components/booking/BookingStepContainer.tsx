import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStepContainerProps {
    currentStep: number;
    totalSteps: number;
    title: string;
    onNext: () => void;
    onBack: () => void;
    isNextDisabled?: boolean;
    isLastStep?: boolean;
    children: React.ReactNode;
    mediaSlot?: React.ReactNode;
    isSolo?: boolean;
}

export function BookingStepContainer({
    currentStep,
    totalSteps,
    title,
    onNext,
    onBack,
    isNextDisabled = false,
    isLastStep = false,
    children,
    mediaSlot,
    isSolo = false
}: BookingStepContainerProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-500",
            isSolo ? "lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:space-y-0 space-y-6" : "space-y-6"
        )}>
            {/* Left Side (Desktop Solo) or Top (Mobile) */}
            <div className={cn(
                "space-y-6",
                isSolo && "lg:sticky lg:top-6"
            )}>
                {/* Progress Header */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Krok {currentStep} z {totalSteps}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap ml-2">
                            {Math.round(progress)}% hotovo
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Title */}
                <h2 className={cn(
                    "text-xl font-bold text-foreground",
                    isSolo ? "lg:text-left text-center" : "text-center"
                )}>
                    {title}
                </h2>

                {/* Standardized Media Slot */}
                <div className="relative aspect-video w-full rounded-2xl bg-muted/30 border-2 border-dashed border-muted-foreground/20 overflow-hidden flex items-center justify-center group transition-colors hover:border-primary/30">
                    {mediaSlot ? (
                        mediaSlot
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <span className="text-xl">✨</span>
                            </div>
                            <span className="text-xs font-medium uppercase tracking-tight">Placeholder pro media</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side (Desktop Solo) or Bottom (Mobile) */}
            <div className={cn(
                "space-y-6",
                isSolo && "lg:pt-0"
            )}>
                {/* Form Content */}
                <div className="space-y-6 min-h-[200px]">
                    {children}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border/50 lg:sticky lg:bottom-0 lg:bg-background/80 lg:backdrop-blur-sm lg:pb-0">
                    <Button
                        type="button"
                        onClick={onNext}
                        disabled={isNextDisabled}
                        className={cn(
                            "h-16 rounded-xl font-bold shadow-lg transition-all active:scale-95 w-full border-0",
                            isLastStep
                                ? "bg-[#059669] hover:bg-[#047857]"
                                : "bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 hover:from-slate-800 hover:via-slate-700 hover:to-indigo-900 text-white shadow-slate-900/20"
                        )}
                    >
                        {isLastStep ? (
                            <>
                                Odeslat poptávku
                                <Check className="ml-2 h-5 w-5" />
                            </>
                        ) : (
                            <>
                                {currentStep === totalSteps - 1 ? "Poslední krok" : "Pokračovat"}
                                <ChevronRight className="ml-2 h-5 w-5" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
