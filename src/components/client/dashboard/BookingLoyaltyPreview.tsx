import { Gift, Coins, Sparkles } from 'lucide-react';

interface BookingLoyaltyPreviewProps {
  price: number;
}

const POINTS_PER_CZK = 0.27;

export function BookingLoyaltyPreview({ price }: BookingLoyaltyPreviewProps) {
  const pointsToEarn = Math.round(price * POINTS_PER_CZK);
  
  if (pointsToEarn <= 0) return null;
  
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-4">
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
      <div className="absolute -right-2 top-8 h-10 w-10 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />
      <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-amber-100/40 dark:bg-amber-800/20" />
      
      {/* Sparkle decorations */}
      <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-400/60 animate-pulse" />
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
