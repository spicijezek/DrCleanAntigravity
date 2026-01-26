import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gift, ArrowRight, Coins, Target, Sparkles } from 'lucide-react';

interface LoyaltyBannerWithProgressProps {
  currentCredits: number;
}

// Milestones matching ClientLoyalty.tsx
const milestones = [
  { amount: 2700, reward: 'Vonná svíčka' },
  { amount: 4500, reward: 'Poukaz na večeři' },
  { amount: 13500, reward: 'Masáž' }
];

// Animated counter hook
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (end === 0 || animatedRef.current) {
      setCount(end);
      return;
    }

    animatedRef.current = true;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      const currentCount = Math.round(easeOutQuart * end);

      setCount(currentCount);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

// Animated progress bar hook
function useProgressAnimation(targetPercentage: number, duration: number = 1500) {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animatedRef = useRef(false);

  useEffect(() => {
    if (targetPercentage === 0 || animatedRef.current) {
      setProgress(targetPercentage);
      return;
    }

    animatedRef.current = true;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const percentage = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - percentage, 4);
      const currentProgress = easeOutQuart * targetPercentage;

      setProgress(currentProgress);

      if (percentage < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Small delay before starting animation
    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 300);

    return () => clearTimeout(timer);
  }, [targetPercentage, duration]);

  return progress;
}

export function LoyaltyBannerWithProgress({ currentCredits }: LoyaltyBannerWithProgressProps) {
  const animatedCredits = useCountUp(currentCredits);

  // Find the next milestone
  const nextMilestone = milestones.find(m => m.amount > currentCredits) || milestones[milestones.length - 1];
  const previousMilestone = milestones.filter(m => m.amount <= currentCredits).pop();

  const startAmount = previousMilestone?.amount || 0;
  const progressRange = nextMilestone.amount - startAmount;
  const progressInRange = currentCredits - startAmount;
  const targetProgressPercentage = nextMilestone.amount > 0 ? Math.min((currentCredits / nextMilestone.amount) * 100, 100) : 100;

  const animatedProgress = useProgressAnimation(targetProgressPercentage);

  return (
    <Link to="/klient/vernost">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-4">
        {/* Decorative circles */}
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
        <div className="absolute -right-2 top-8 h-10 w-10 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />
        <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-amber-100/40 dark:bg-amber-800/20" />

        {/* Sparkle decorations */}
        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-400/60 animate-pulse" />
        <Sparkles className="absolute left-8 bottom-2 h-2.5 w-2.5 text-orange-400/50 animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative space-y-3">
          {/* Header with points */}
          <div className="flex items-center gap-3">
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
                  <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{animatedCredits}</span>
                </div>
              )}
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Progress to next prize */}
          {currentCredits > 0 && (
            <div className="space-y-2 pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>Další odměna</span>
                </div>
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {nextMilestone.reward}
                </span>
              </div>

              {/* Animated progress bar */}
              <div className="relative h-2 bg-amber-200/50 dark:bg-amber-900/50 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-100"
                  style={{ width: `${animatedProgress}%` }}
                />
                {/* Shimmer effect */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer"
                  style={{ width: `${animatedProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{animatedCredits} bodů</span>
                <span>{nextMilestone.amount} bodů</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
