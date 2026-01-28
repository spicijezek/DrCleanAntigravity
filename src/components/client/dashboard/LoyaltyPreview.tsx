import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Coins, Sparkles } from 'lucide-react';

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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 border-2 border-amber-200 dark:border-amber-700 p-4 shadow-lg hover:shadow-xl transition-all duration-300">
        {/* Animated decorative bubbles - 11 bubbles matching dashboard refinement */}
        <div className="absolute right-4 top-3 h-20 w-20 rounded-full bg-white/38 dark:bg-amber-300/40 animate-float-circle-1" />
        <div className="absolute right-8 top-14 h-12 w-12 rounded-full bg-orange-600/38 dark:bg-orange-300/42 animate-float-circle-2" />
        <div className="absolute left-4 bottom-3 h-14 w-14 rounded-full bg-white/40 dark:bg-amber-400/38 animate-float-circle-1" />
        <div className="absolute left-12 top-10 h-9 w-9 rounded-full bg-amber-600/38 dark:bg-orange-400/40 animate-float-circle-2" />
        <div className="absolute right-12 bottom-6 h-16 w-16 rounded-full bg-white/35 dark:bg-amber-300/38 animate-float-circle-1" />
        <div className="absolute left-1/2 top-8 h-11 w-11 rounded-full bg-orange-600/38 dark:bg-orange-300/40 animate-float-circle-2" />
        <div className="absolute left-8 bottom-12 h-12 w-12 rounded-full bg-white/38 dark:bg-amber-400/38 animate-float-circle-1" />
        <div className="absolute right-16 top-1/2 h-10 w-10 rounded-full bg-amber-700/38 dark:bg-orange-300/40 animate-float-circle-2" />
        <div className="absolute left-20 top-14 h-7 w-7 rounded-full bg-white/40 dark:bg-amber-300/38 animate-float-circle-1" />
        <div className="absolute right-10 top-10 h-11 w-11 rounded-full bg-orange-600/38 dark:bg-orange-300/42 animate-float-circle-2" />
        <div className="absolute left-6 top-6 h-9 w-9 rounded-full bg-white/38 dark:bg-amber-400/38 animate-float-circle-1" />

        {/* Sparkle decoration */}
        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-600/70 dark:text-amber-300/60 animate-pulse" />

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
