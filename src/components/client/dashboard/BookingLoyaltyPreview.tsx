import { Gift, Coins, Sparkles } from 'lucide-react';

interface BookingLoyaltyPreviewProps {
  price: number;
}

const POINTS_PER_CZK = 0.27;

export function BookingLoyaltyPreview({ price }: BookingLoyaltyPreviewProps) {
  const pointsToEarn = Math.round(price * POINTS_PER_CZK);

  if (pointsToEarn <= 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 border-2 border-amber-200 dark:border-amber-700 p-4 shadow-lg">
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

      {/* Sparkle decorations */}
      <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-600/70 dark:text-amber-300/60 animate-pulse" />
      <Sparkles className="absolute left-8 bottom-2 h-2.5 w-2.5 text-orange-400/50 animate-pulse" style={{ animationDelay: '0.5s' }} />

      <div className="relative flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0 animate-phone-shake">
          <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">Věrnostní body</h3>
          <p className="text-xs text-muted-foreground">
            Za tento úklid získáte
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 border border-amber-200/50 dark:border-amber-700/50 shadow-sm">
          <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span className="text-base font-bold text-amber-700 dark:text-amber-400">
            +{pointsToEarn}
          </span>
        </div>
      </div>
    </div>
  );
}
