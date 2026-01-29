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
    mediaSlot
}: BookingStepContainerProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            <h2 className="text-xl font-bold text-foreground text-center">
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

            {/* Form Content */}
            <div className="space-y-6 pt-2">
                {children}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
                <Button
                    type="button"
                    onClick={onNext}
                    disabled={isNextDisabled}
                    className={cn(
                        "h-12 rounded-xl font-bold shadow-lg transition-all active:scale-95 w-full",
                        isLastStep ? "bg-[#059669] hover:bg-[#047857]" : "bg-primary hover:bg-primary/90"
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
    );
}
