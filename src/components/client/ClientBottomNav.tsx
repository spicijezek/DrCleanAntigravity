import { Home, Gift } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import plusIconTransparent from '@/assets/plus-icon-transparent.png';
import { AnimatedClockIcon } from './AnimatedClockIcon';
import { AnimatedChecklistIcon } from './AnimatedChecklistIcon';

const navItems = [
  { icon: Home, label: 'Domů', path: '/klient' },
  { type: 'clock' as const, label: 'Úklidy', path: '/klient/fakturace' },
  { type: 'plus' as const, path: '/klient/sluzby' },
  { type: 'checklist' as const, label: 'Checklist', path: '/klient/checklist' },
  { icon: Gift, label: 'Věrnost', path: '/klient/vernost' },
];

export function ClientBottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item, index) => {
          if ('type' in item && item.type === 'plus') {
            return (
              <Link
                key="plus"
                to={item.path!}
                className="flex items-center justify-center"
              >
                <img
                  src={plusIconTransparent}
                  alt="Nová objednávka"
                  className="h-12 w-12 object-contain animate-breathe brightness-[0.6]"
                />
              </Link>
            );
          }

          // Animated clock icon for Historie
          if ('type' in item && item.type === 'clock') {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AnimatedClockIcon isActive={isActive} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          }

          // Animated checklist icon
          if ('type' in item && item.type === 'checklist') {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path!}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AnimatedChecklistIcon isActive={isActive} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          }

          // Regular icons (Home, Gift)
          if ('icon' in item && item.icon) {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          }

          return null;
        })}
      </div>
    </nav>
  );
}
