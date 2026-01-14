import { cn } from '@/lib/utils';

interface AnimatedGiftIconProps {
  className?: string;
  isActive?: boolean;
}

export function AnimatedGiftIcon({ className, isActive }: AnimatedGiftIconProps) {
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
      {/* Gift box body */}
      <rect 
        x="3" 
        y="12" 
        width="18" 
        height="9" 
        rx="1"
        className={isActive ? "fill-primary/20" : ""}
      />
      
      {/* Vertical ribbon on box */}
      <line x1="12" y1="12" x2="12" y2="21" />
      
      {/* Gift lid - static */}
      <rect 
        x="2" 
        y="7" 
        width="20" 
        height="5" 
        rx="1"
        className={isActive ? "fill-primary/20" : ""}
      />
      {/* Horizontal ribbon on lid */}
      <line x1="12" y1="7" x2="12" y2="12" />
      
      {/* Bow - left loop - animated wiggle */}
      <path 
        d="M12 7c-1.5-2-4-2-4 0s2.5 2 4 0" 
        className="animate-bow-wiggle-left"
        style={{ transformOrigin: '12px 6px' }}
      />
      
      {/* Bow - right loop - animated wiggle */}
      <path 
        d="M12 7c1.5-2 4-2 4 0s-2.5 2-4 0" 
        className="animate-bow-wiggle-right"
        style={{ transformOrigin: '12px 6px' }}
      />
    </svg>
  );
}
