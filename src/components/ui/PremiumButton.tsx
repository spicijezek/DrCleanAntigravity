import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends ButtonProps {
    showBubbles?: boolean;
}

const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
    ({ className, children, showBubbles = true, asChild, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                asChild={asChild}
                className={cn(
                    "bg-silver-button border-0 shadow-lg font-bold relative overflow-hidden transition-all duration-300 active:scale-[0.98]",
                    className
                )}
                {...props}
            >
                {!asChild ? (
                    <>
                        {showBubbles && (
                            <>
                                {/* Micro bubbles inside button */}
                                <div className="absolute right-2 top-2 h-4 w-4 rounded-full bg-white/20 animate-float-circle-1" />
                                <div className="absolute left-4 top-1 h-2 w-2 rounded-full bg-white/15 animate-float-circle-2" />
                                <div className="absolute left-2 bottom-2 h-3 w-3 rounded-full bg-white/10 animate-float-circle-1" />
                                <div className="absolute right-1/4 bottom-1 h-2 w-2 rounded-full bg-white/12 animate-float-circle-2" />
                            </>
                        )}
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {children}
                        </span>
                    </>
                ) : (
                    children
                )}
            </Button>
        );
    }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton };
