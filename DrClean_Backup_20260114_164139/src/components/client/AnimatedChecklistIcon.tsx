import { cn } from '@/lib/utils';

interface AnimatedChecklistIconProps {
  className?: string;
  isActive?: boolean;
}

export function AnimatedChecklistIcon({ className, isActive }: AnimatedChecklistIconProps) {
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
      {/* Clipboard background */}
      <rect 
        x="3" 
        y="4" 
        width="18" 
        height="18" 
        rx="2"
        className={isActive ? "fill-primary/20" : ""}
      />
      
      {/* Clipboard top clip */}
      <path d="M9 2h6v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V2z" />
      
      {/* Checkmark - animated drawing */}
      <path 
        d="M9 12l2 2 4-4" 
        className="animate-check-draw"
        strokeDasharray="10"
        strokeDashoffset="10"
      />
      
      {/* List lines */}
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}
