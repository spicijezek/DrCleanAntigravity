import { cn } from '@/lib/utils';

interface AnimatedClockIconProps {
  className?: string;
  isActive?: boolean;
}

export function AnimatedClockIcon({ className, isActive }: AnimatedClockIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
    >
      {/* Clock circle */}
      <circle cx="12" cy="12" r="10" className={isActive ? "fill-primary/20" : ""} />
      
      {/* Hour hand - slower tick */}
      <line 
        x1="12" 
        y1="12" 
        x2="12" 
        y2="8" 
        className="origin-center animate-clock-hour"
        style={{ transformOrigin: '12px 12px' }}
      />
      
      {/* Minute hand - faster tick */}
      <line 
        x1="12" 
        y1="12" 
        x2="16" 
        y2="12" 
        className="origin-center animate-clock-minute"
        style={{ transformOrigin: '12px 12px' }}
      />
    </svg>
  );
}
