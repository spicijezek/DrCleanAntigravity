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
    <Link to="/klient/vernost" className="block">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 border-2 border-amber-200 dark:border-amber-700 p-4 shadow-lg">
        {/* Animated decorative bubbles - 11 bubbles with clear but balanced visibility */}
        <div className="absolute right-4 top-3 h-20 w-20 rounded-full bg-white/38 dark:bg-amber-300/40 animate-float-circle-1" />
        <div className="absolute right-8 top-14 h-14 w-14 rounded-full bg-orange-600/38 dark:bg-orange-300/42 animate-float-circle-2" />
        <div className="absolute left-4 bottom-3 h-16 w-16 rounded-full bg-white/40 dark:bg-amber-400/38 animate-float-circle-1" />
        <div className="absolute left-12 top-10 h-10 w-10 rounded-full bg-amber-600/38 dark:bg-orange-400/40 animate-float-circle-2" />
        <div className="absolute right-12 bottom-6 h-18 w-18 rounded-full bg-white/35 dark:bg-amber-300/38 animate-float-circle-1" />
        <div className="absolute left-1/2 top-8 h-12 w-12 rounded-full bg-orange-600/38 dark:bg-orange-300/40 animate-float-circle-2" />
        <div className="absolute left-8 bottom-12 h-14 w-14 rounded-full bg-white/38 dark:bg-amber-400/38 animate-float-circle-1" />
        <div className="absolute right-16 top-1/2 h-11 w-11 rounded-full bg-amber-700/38 dark:bg-orange-300/40 animate-float-circle-2" />
        <div className="absolute left-20 top-14 h-9 w-9 rounded-full bg-white/40 dark:bg-amber-300/38 animate-float-circle-1" />
        <div className="absolute right-10 top-10 h-12 w-12 rounded-full bg-orange-600/38 dark:bg-orange-300/42 animate-float-circle-2" />
        <div className="absolute left-6 top-6 h-10 w-10 rounded-full bg-white/38 dark:bg-amber-400/38 animate-float-circle-1" />

        {/* Sparkle decorations */}
        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-600/70 dark:text-amber-300/60 animate-pulse" />
        <Sparkles className="absolute left-8 bottom-2 h-2.5 w-2.5 text-orange-600/60 dark:text-orange-300/50 animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative space-y-3">
          {/* Header with points */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/60 shrink-0 animate-phone-shake shadow-md">
              <Gift className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900 dark:text-white drop-shadow-sm">Věrnostní program</h3>
              <p className="text-sm text-amber-800 dark:text-amber-100 font-medium">
                {currentCredits > 0
                  ? `Máte ${animatedCredits} bodů`
                  : 'Sbírejte body za každý úklid'
                }
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/60 shadow-md">
                <Coins className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300 animate-pulse" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-100">{animatedCredits.toLocaleString('cs-CZ')}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-amber-800 dark:text-amber-200" />
            </div>
          </div>

          {/* Progress to next prize */}
          <div className="space-y-2 pt-2 border-t border-amber-400/40 dark:border-amber-500/40">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-amber-800 dark:text-amber-200 font-medium">
                <Target className="h-3 w-3" />
                <span>Další odměna</span>
              </div>
              <span className="font-bold text-amber-900 dark:text-white drop-shadow-sm">
                {nextMilestone.reward}
              </span>
            </div>

            {/* Animated progress bar */}
            <div className="relative h-2 bg-amber-300/40 dark:bg-amber-900/40 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 rounded-full transition-all duration-100 shadow-sm"
                style={{ width: `${animatedProgress}%` }}
              />
              {/* Shimmer effect */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full animate-shimmer"
                style={{ width: `${animatedProgress}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-amber-800 dark:text-amber-200 font-medium">
              <span>{animatedCredits.toLocaleString('cs-CZ')} bodů</span>
              <span>{nextMilestone.amount.toLocaleString('cs-CZ')} bodů</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
