import React from 'react';
import { cn } from "@/lib/utils";
import drcleanIcon from '@/assets/drclean-icon-blue.png';

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    variant?: 'default' | 'luxurious';
}

export function AdminPageHeader({ title, description, action, className, variant = 'default' }: AdminPageHeaderProps) {
    const isLuxurious = variant === 'luxurious';

    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-6 rounded-3xl backdrop-blur-sm border shadow-sm transition-all duration-700",
            isLuxurious
                ? "bg-gradient-to-br from-[#14293C] via-[#1e1b4b] to-[#4c1d95] border-white/10 shadow-xl shadow-primary/20"
                : "bg-white/50 dark:bg-slate-900/50",
            className
        )}>
            <div className="flex items-center gap-4">
                <div className="relative h-12 w-12 flex-shrink-0 hidden sm:block">
                    <div className={cn(
                        "absolute inset-0 blur-xl rounded-full scale-110",
                        isLuxurious ? "bg-white/20" : "bg-primary/10"
                    )} />
                    <img
                        src={drcleanIcon}
                        alt="DrClean"
                        className={cn(
                            "h-full w-full object-contain relative z-10 animate-in zoom-in duration-500",
                            isLuxurious && "brightness-0 invert opacity-90"
                        )}
                    />
                </div>
                <div className="space-y-1">
                    <h1 className={cn(
                        "text-2xl sm:text-3xl font-bold tracking-tight animate-in slide-in-from-left duration-500",
                        isLuxurious
                            ? "text-white"
                            : "bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent"
                    )}>
                        {title}
                    </h1>
                    {description && (
                        <p className={cn(
                            "text-sm animate-in slide-in-from-left duration-700 delay-100",
                            isLuxurious ? "text-blue-100/80" : "text-muted-foreground"
                        )}>
                            {description}
                        </p>
                    )}
                </div>
            </div>
            {action && <div className="animate-in slide-in-from-right duration-500">{action}</div>}
        </div>
    );
}
