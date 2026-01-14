import React from 'react';
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export function AdminPageHeader({ title, description, action, className }: AdminPageHeaderProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border shadow-sm", className)}>
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent animate-in slide-in-from-left duration-500">
                    {title}
                </h1>
                {description && <p className="text-sm text-muted-foreground animate-in slide-in-from-left duration-700 delay-100">{description}</p>}
            </div>
            {action && <div className="animate-in slide-in-from-right duration-500">{action}</div>}
        </div>
    );
}
