import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Coins } from 'lucide-react';

interface LoyaltyPreviewProps {
  currentCredits: number;
}

// Animated counter hook - same as ClientLoyalty page
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    countRef.current = 0;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      const currentCount = Math.round(easeOutQuart * end);
      
      setCount(currentCount);
      countRef.current = currentCount;

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export function LoyaltyPreview({ currentCredits }: LoyaltyPreviewProps) {
  const animatedCredits = useCountUp(currentCredits);

  return (
    <Link to="/klient/vernost">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-4">
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
        <div className="absolute -right-2 top-8 h-10 w-10 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />
        
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0 animate-phone-shake">
            <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">Věrnostní program</h3>
            <p className="text-sm text-muted-foreground">
              {currentCredits > 0 
                ? `Máte ${animatedCredits} bodů`
                : 'Sbírejte body za každý úklid'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {currentCredits > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{animatedCredits}</span>
              </div>
            )}
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}
