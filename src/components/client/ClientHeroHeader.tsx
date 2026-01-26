import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

interface ClientHeroHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  stats?: StatItem[];
  children?: React.ReactNode;
  className?: string;
  /** 
   * Visual variant:
   * - 'primary' (default): solid gradient primary background
   * - 'light': light primary tinted background (for pages like Loyalty)
   */
  variant?: 'primary' | 'light';
  /** Custom icon container class for special styling */
  iconClassName?: string;
}

export function ClientHeroHeader({
  icon: Icon,
  title,
  subtitle,
  stats,
  children,
  className,
  variant = 'primary',
  iconClassName
}: ClientHeroHeaderProps) {
  const isPrimary = variant === 'primary';

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-5",
      isPrimary
        ? "bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(var(--primary)_/_0.8)_40%,hsl(var(--primary)_/_0.05)_100%)] text-white shadow-xl border-2 border-white/10"
        : "bg-[linear-gradient(to_right,hsl(var(--primary)_/_0.08),hsl(var(--primary)_/_0.03))] dark:bg-[linear-gradient(to_right,hsl(var(--primary)_/_0.15),hsl(var(--primary)_/_0.08))] border border-primary/20 dark:border-primary/30",
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />

      {/* Animated decorative circles */}
      <div className={cn(
        "absolute -right-8 -top-8 h-28 w-28 rounded-full animate-float-circle-1",
        isPrimary ? "bg-white/10" : "bg-primary/10 dark:bg-primary/20"
      )} />
      <div className={cn(
        "absolute -right-2 top-14 h-14 w-14 rounded-full animate-float-circle-2",
        isPrimary ? "bg-white/15" : "bg-primary/15 dark:bg-primary/25"
      )} />

      <div className="relative z-10 space-y-4">
        {/* Header with icon */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isPrimary ? "bg-white/20" : "bg-amber-100 dark:bg-amber-900/50",
            iconClassName
          )}>
            <Icon className={cn(
              "h-6 w-6",
              !isPrimary && "text-amber-600 dark:text-amber-400"
            )} />
          </div>
          <div>
            <h1 className={cn(
              "text-2xl font-bold",
              !isPrimary && "text-foreground"
            )}>{title}</h1>
            <p className={cn(
              "text-sm",
              isPrimary ? "text-white/80" : "text-muted-foreground"
            )}>{subtitle}</p>
          </div>
        </div>

        {/* Stats grid */}
        {stats && stats.length > 0 && (
          <div className={cn(
            "grid gap-3",
            stats.length === 1 && "grid-cols-1",
            stats.length === 2 && "grid-cols-2",
            stats.length >= 3 && "grid-cols-2 sm:grid-cols-3"
          )}>
            {stats.map((stat, index) => (
              <div
                key={index}
                className={cn(
                  "backdrop-blur-sm rounded-xl p-3 space-y-1",
                  isPrimary
                    ? "bg-white/10"
                    : "bg-white/60 dark:bg-black/20 border border-primary/20 dark:border-primary/30"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 text-xs",
                  isPrimary ? "text-white/70" : "text-muted-foreground"
                )}>
                  <stat.icon className="h-3.5 w-3.5" />
                  {stat.label}
                </div>
                <div className={cn(
                  "text-xl font-bold",
                  !isPrimary && "text-primary dark:text-primary"
                )}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Additional content slot */}
        {children}
      </div>
    </div>
  );
}

