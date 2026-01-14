import { cn } from '@/lib/utils';

interface AnimatedHomeIconProps {
  className?: string;
  isActive?: boolean;
}

export function AnimatedHomeIcon({ className, isActive }: AnimatedHomeIconProps) {
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
      {/* House roof */}
      <path 
        d="M3 9l9-7 9 7" 
        className={isActive ? "fill-primary/20" : ""}
      />
      
      {/* House walls */}
      <path 
        d="M9 22V12h6v10"
        className={isActive ? "fill-primary/20" : ""}
      />
      
      {/* House base */}
      <path d="M5 9v13h14V9" />
      
      {/* Door - animated open/close */}
      <g className="animate-door-swing" style={{ transformOrigin: '9px 17px' }}>
        <rect 
          x="9" 
          y="12" 
          width="6" 
          height="10" 
          rx="0.5"
          className={isActive ? "fill-primary/20" : ""}
        />
        {/* Door handle */}
        <circle cx="13.5" cy="17" r="0.5" fill="currentColor" />
      </g>
    </svg>
  );
}
