import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientDashboardData } from '@/hooks/useClientDashboardData';
import { Gift, Share2, CheckCircle2, Phone, Flame, UtensilsCrossed, Sparkles, Trophy, Target, History as HistoryIcon, Coins, ArrowRight, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { toast as sonnerToast } from 'sonner';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { cn } from '@/lib/utils';

interface LoyaltyData {
  current_credits: number;
  total_earned: number;
  total_spent: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'earned' | 'redeemed';
  description: string;
  created_at: string;
}

interface Redemption {
  id: string;
  prize_name: string;
  points_cost: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  created_at: string;
}

const milestones = [
  { amount: 2700, reward: 'Vonná svíčka', icon: Flame },
  { amount: 4500, reward: 'Poukaz na večeři', icon: UtensilsCrossed },
  { amount: 13500, reward: 'Masáž', icon: Sparkles }
];

// Premium Sparkle particle component (optimized for mobile)
function SparkleParticle({ delay, color, scale, left, top, duration }: {
  delay: number;
  color: string;
  scale: number;
  left: number;
  top: number;
  duration: number;
}) {
  return (
    <div
      className="absolute animate-sparkle-up"
      style={{
        width: `${4 * scale}px`,
        height: `${4 * scale}px`,
        backgroundColor: color,
        left: `${left}%`,
        top: `${top}%`,
        boxShadow: `0 0 ${10 * scale}px ${color}`,
        borderRadius: '50%',
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}s`
      }}
    />
  );
}

// Celebration effect component - "Rising Magic Dust"
function PremiumCelebration({ show }: { show: boolean }) {
  if (!show) return null;

  const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#ffffff'];
  // Increased particle count (135) for a dense, long-lasting magical effect
  const particles = Array.from({ length: 135 }, (_, i) => ({
    id: i,
    delay: i * 20, // Faster spread
    color: colors[i % colors.length],
    scale: 0.3 + Math.random() * 0.8,
    left: 2 + Math.random() * 96,
    top: 100 + Math.random() * 20, // All start from bottom
    duration: 1.5 + Math.random() * 1.5 // Faster move
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <SparkleParticle
          key={p.id}
          delay={p.delay}
          color={p.color}
          scale={p.scale}
          left={p.left}
          top={p.top}
          duration={p.duration}
        />
      ))}
    </div>
  );
}

// Animated counter hook
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

export default function ClientLoyalty() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  // Use the same hook as the dashboard - this guarantees consistency
  const { clientData, loyaltyCredits, isLoading: hookLoading } = useClientDashboardData();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Get points from the hook (same source as homepage)
  const currentPoints = loyaltyCredits?.current_credits || 0;
  const referralCode = clientData?.referral_code || null;
  const animatedPoints = useCountUp(currentPoints);

  // Milestone logic matching LoyaltyBannerWithProgress
  const nextMilestone = milestones.find(m => m.amount > currentPoints) || milestones[milestones.length - 1];
  const targetProgressPercentage = nextMilestone.amount > 0 ? Math.min((currentPoints / nextMilestone.amount) * 100, 100) : 100;
  const animatedProgress = useProgressAnimation(targetProgressPercentage);

  useEffect(() => {
    if (clientData?.id) {
      loadTransactionsAndRedemptions();

      // AUTO-ENSURE REFERRAL CODE: 
      // If code is missing, call the database function to generate it immediately
      if (!clientData.referral_code) {
        ensureCodeExists();
      }
    }
  }, [clientData?.id, clientData?.referral_code]);

  const ensureCodeExists = async () => {
    try {
      console.log('Ensuring referral code exists for client:', clientData?.id);
      const { data: newCode, error } = await supabase.rpc('ensure_referral_code', {
        p_client_id: clientData?.id
      });

      if (error) throw error;

      if (newCode) {
        console.log('Referral code generated:', newCode);
        // Refresh the client data in cache
        queryClient.invalidateQueries({ queryKey: ['clientProfiles'] });
      }
    } catch (err) {
      console.error('Error ensuring referral code:', err);
    }
  };

  // Sync loading state with hook
  useEffect(() => {
    if (!hookLoading) {
      setLoading(false);
    }
  }, [hookLoading]);

  // Show celebration briefly when page loads
  useEffect(() => {
    setShowCelebration(true);
    const timer = setTimeout(() => setShowCelebration(false), 8000); // 8 seconds to allow all sparkles to finish
    return () => clearTimeout(timer);
  }, []);

  const loadTransactionsAndRedemptions = async () => {
    if (!clientData?.id) return;

    try {
      // Fetch Transactions
      const { data: trans } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (trans) {
        setTransactions(trans as Transaction[]);
      }

      // Fetch Redemptions
      const { data: redemp } = await supabase
        .from('loyalty_redemptions')
        .select('*')
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (redemp) {
        setRedemptions(redemp as Redemption[]);
      }
    } catch (error) {
      console.error('Error loading transactions/redemptions:', error);
    }
  };

  const getNextMilestone = () => {
    return milestones.find(m => m.amount > currentPoints) || milestones[milestones.length - 1];
  };

  const getMilestoneProgress = () => {
    const next = getNextMilestone();
    const currentMilestoneIndex = milestones.findIndex(m => m.amount > currentPoints);
    const prevAmount = currentMilestoneIndex > 0 ? milestones[currentMilestoneIndex - 1].amount : 0;

    // Use animatedPoints for the progress bar calculation to animate it
    if (animatedPoints >= next.amount) return 100;
    return Math.min(100, ((animatedPoints - prevAmount) / (next.amount - prevAmount)) * 100);
  };

  const handleRedeem = async (milestone: typeof milestones[0]) => {
    if (!user || currentPoints < milestone.amount) return;

    const confirmRedeem = window.confirm(`Opravdu si přejete vybrat odměnu: ${milestone.reward} za ${milestone.amount} bodů?`);
    if (!confirmRedeem) return;

    setRedeeming(milestone.reward);
    try {
      const { data: client, error: clientFetchError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (clientFetchError) throw clientFetchError;
      if (!client) throw new Error('Client not found');

      // Create redemption record
      const { error: redempError } = await supabase
        .from('loyalty_redemptions')
        .insert({
          client_id: client.id,
          prize_name: milestone.reward,
          points_cost: milestone.amount,
          status: 'pending'
        });

      if (redempError) throw redempError;

      // Create transaction record
      const { error: transError } = await supabase
        .from('loyalty_transactions')
        .insert({
          client_id: client.id,
          amount: milestone.amount,
          type: 'redeemed',
          description: `Výběr odměny: ${milestone.reward}`
        });

      if (transError) throw transError;

      // Update balance
      const { error: creditError } = await supabase
        .from('loyalty_credits')
        .update({ current_credits: currentPoints - milestone.amount })
        .eq('client_id', client.id);

      if (creditError) throw creditError;

      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      // Reload page to refresh data from hook
      window.location.reload();

    } catch (error: any) {
      console.error('Error redeeming prize:', error);
      alert('Chyba při výběru odměny: ' + error.message);
    } finally {
      setRedeeming(null);
    }
  };

  const handleShare = async () => {
    const code = referralCode;
    if (!code) {
      sonnerToast.error("Kód není k dispozici", {
        description: "Prosím zkuste to za chvíli nebo kontaktujte podporu.",
      });
      return;
    }

    const shareText = `Získejte profesionální úklid Klinr s bonusem! Při registraci použijte můj kód: ${code}`;
    const shareUrl = `${window.location.origin}/klient-prihlaseni?ref=${code}`;

    // Native sharing only works on HTTPS or Localhost
    const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost';

    if (navigator.share && isSecureContext) {
      try {
        // Native share call
        await navigator.share({
          title: 'Klinr - Pozvánka',
          text: shareText,
          url: shareUrl
        });
        return; // Success
      } catch (err) {
        // Only log if not a user cancellation
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share failed:', err);
        } else {
          return; // User cancelled, don't fallback to copy
        }
      }
    }

    // Fallback if not supported or not secure context
    console.log('Native share not available (requires HTTPS or Localhost). Context secure:', isSecureContext);
    await copyToClipboard(`${shareText}\n${shareUrl}`);
    sonnerToast.success("Odkaz připraven!", {
      description: isSecureContext
        ? 'Text s vaším kódem byl zkopírován do schránky.'
        : 'Native sdílení vyžaduje HTTPS. Odkaz byl zkopírován do schránky.',
    });
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;

    try {
      await copyToClipboard(referralCode);
      setIsCopied(true);
      sonnerToast.success("Kód zkopírován!", {
        description: 'Teď ho můžete poslat přátelům.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      sonnerToast.error("Chyba kopírování", {
        description: 'Kód se nepodařilo zkopírovat automaticky.',
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    // Try the modern API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback: Create a temporary textarea
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      throw new Error('Fallback copy failed');
    }
    document.body.removeChild(textArea);
  };

  if (loading) {
    return <LoadingOverlay message="Načítám věrnostní program..." />;
  }

  const achievedCount = milestones.filter(m => currentPoints >= m.amount).length;

  return (
    <div className="container mx-auto px-4 pt-6 pb-20 space-y-6">
      {/* Celebration Effect - Premium rising sparkles */}
      <PremiumCelebration show={showCelebration} />

      {/* Slim Status Bar - Forced single-row for mobile */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl px-4 py-3.5 bg-[linear-gradient(135deg,hsl(var(--primary)_/_0.9)_0%,hsl(var(--primary))_50%,hsl(var(--primary)_/_0.9)_100%)] text-white shadow-xl border-2 border-primary/20 transition-all duration-700",
        showCelebration ? "animate-glow-pulse scale-[1.02]" : ""
      )}>
        {/* Animated decorative bubbles - 12 bubbles for rich animation */}
        <div className="absolute right-2 top-2 h-24 w-24 rounded-full bg-white/10 animate-float-circle-1" />
        <div className="absolute right-4 top-16 h-14 w-14 rounded-full bg-white/15 animate-float-circle-2" />
        <div className="absolute left-2 bottom-2 h-16 w-16 rounded-full bg-white/10 animate-float-circle-1" />
        <div className="absolute left-10 top-8 h-10 w-10 rounded-full bg-white/12 animate-float-circle-2" />
        <div className="absolute right-1/3 bottom-4 h-18 w-18 rounded-full bg-white/8 animate-float-circle-1" />
        <div className="absolute left-1/2 top-6 h-12 w-12 rounded-full bg-white/10 animate-float-circle-2" />
        <div className="absolute left-1/4 bottom-10 h-13 w-13 rounded-full bg-white/9 animate-float-circle-1" />
        <div className="absolute right-20 top-1/2 h-11 w-11 rounded-full bg-white/11 animate-float-circle-2" />
        <div className="absolute left-16 top-12 h-8 w-8 rounded-full bg-white/10 animate-float-circle-1" />
        <div className="absolute right-1/4 top-20 h-9 w-9 rounded-full bg-white/12 animate-float-circle-2" />
        <div className="absolute left-1/3 bottom-6 h-7 w-7 rounded-full bg-white/9 animate-float-circle-1" />
        <div className="absolute right-12 bottom-12 h-8 w-8 rounded-full bg-white/11 animate-float-circle-2" />

        <div className="relative z-10 flex flex-row items-center w-full flex-nowrap gap-2">
          <div className="backdrop-blur-sm rounded-lg px-2.5 py-1.5 bg-white/10 border border-white/20 shrink-0">
            <p className="text-[10px] font-bold text-white/90 tracking-wide uppercase whitespace-nowrap">Vaše body</p>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-sm whitespace-nowrap ml-auto">
            {animatedPoints.toLocaleString('cs-CZ')} b.
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone - Exact copy of Homepage Banner Design */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 border-2 border-amber-200 dark:border-amber-700 p-4 shadow-lg">
        {/* Animated decorative bubbles - 11 bubbles matching dashboard refinement */}
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
        <Sparkles className="absolute left-8 bottom-2 h-2.5 w-2.5 text-orange-400/50 animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative space-y-3">
          {/* Header with points - Exact copy of Homepage Branding */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/60 shrink-0 animate-phone-shake shadow-md">
              <Gift className="h-5 w-5 text-amber-700 dark:text-amber-300" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900 dark:text-white drop-shadow-sm">Věrnostní program</h3>
              <p className="text-sm text-amber-800 dark:text-amber-100 font-medium">
                {currentPoints > 0
                  ? `Máte ${animatedPoints.toLocaleString('cs-CZ')} bodů`
                  : 'Sbírejte body za každý úklid'
                }
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/60 shadow-md">
                <Coins className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300 animate-pulse" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-100">{animatedPoints.toLocaleString('cs-CZ')}</span>
              </div>
            </div>
          </div>

          {/* Progress to next prize - Exact copy of Homepage Layout */}
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

            {/* Animated progress bar - Exact copy of Homepage Styling */}
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
              <span>{animatedPoints.toLocaleString('cs-CZ')} bodů</span>
              <span>{nextMilestone.amount.toLocaleString('cs-CZ')} bodů</span>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Všechny odměny
          <Badge className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/50 border-0 font-bold">
            {achievedCount}/{milestones.length}
          </Badge>
        </h2>

        <div className="grid gap-3">
          {milestones.map((milestone, index) => {
            const achieved = currentPoints >= milestone.amount;
            const isNext = nextMilestone.amount === milestone.amount && !achieved;
            const Icon = milestone.icon;

            return (
              <div
                key={index}
                className={`relative overflow-hidden rounded-xl p-4 border transition-all ${achieved
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-primary/30 dark:border-primary/40'
                  : isNext
                    ? 'bg-card border-amber-300 dark:border-amber-800 shadow-md'
                    : 'bg-card border-border opacity-70'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${achieved ? 'bg-gradient-to-br from-amber-500 to-yellow-400 text-white' : isNext ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'bg-muted'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{milestone.reward}</div>
                    <div className="text-sm text-muted-foreground">
                      {milestone.amount.toLocaleString('cs-CZ')} b.
                    </div>
                  </div>

                  {achieved ? (
                    <PremiumButton
                      size="sm"
                      className="uppercase text-[10px] tracking-wider"
                      onClick={() => handleRedeem(milestone)}
                      disabled={redeeming === milestone.reward}
                    >
                      {redeeming === milestone.reward ? 'Zpracovávám...' : 'Vybrat odměnu'}
                    </PremiumButton>
                  ) : (
                    <Badge variant="outline" className="opacity-50 font-bold border-amber-200">
                      Zbývá {(milestone.amount - currentPoints).toLocaleString('cs-CZ')} b.
                    </Badge>
                  )}
                </div>
                {achieved && (
                  <div className="absolute inset-y-0 right-0 w-1 bg-primary" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card className="relative overflow-hidden border-[3px] border-primary shadow-2xl rounded-[2.5rem] group transition-all duration-500">
        <div className="relative z-10 bg-gradient-to-br from-white via-slate-50/80 to-slate-100/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800/80 p-6 space-y-6">
          {/* Subtle decorative elements - matching premium dashboard style but with primary/slate tones */}
          <div className="absolute right-4 top-3 h-24 w-24 rounded-full bg-primary/5 dark:bg-primary/10 blur-2xl animate-float-circle-1" />
          <div className="absolute left-6 bottom-4 h-20 w-20 rounded-full bg-slate-200/20 dark:bg-slate-700/10 blur-xl animate-float-circle-2" />

          {/* Micro bubbles for depth */}
          <div className="absolute right-12 top-10 h-3 w-3 rounded-full bg-primary/20 dark:bg-primary/30 animate-pulse" />
          <div className="absolute left-1/4 bottom-12 h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative z-10 flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
              <div className="relative p-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground shadow-lg border-2 border-white/20">
                <Share2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-foreground tracking-tight">Doporučte nás přátelům</h3>
              <p className="text-sm text-muted-foreground font-medium">Získejte bonusové body pro oba za první úklid</p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
              {/* Unique Code Display - Sleek and subtle */}
              <div className="sm:col-span-3 relative overflow-hidden flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/40 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner group-hover:border-primary/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-primary/60 dark:text-primary/70 mb-2 relative z-10">Váš unikátní kód</p>
                {referralCode ? (
                  <p className="text-4xl font-black tracking-widest text-foreground font-mono transition-all animate-in zoom-in duration-500 relative z-10">{referralCode}</p>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-2 relative z-10">
                    <p className="text-sm text-muted-foreground font-medium italic animate-pulse">Generujeme váš kód...</p>
                    <p className="text-[10px] text-muted-foreground/60 italic uppercase tracking-widest">Měl by se brzy objevit</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="sm:col-span-2 flex flex-row sm:flex-col gap-2 h-full">
                <Button
                  className="flex-1 sm:h-auto h-16 rounded-2xl text-base shadow-md bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-200 font-black transition-all active:scale-[0.98]"
                  onClick={handleShare}
                  disabled={!referralCode}
                >
                  <Share2 className="h-4 w-4 mr-2 text-amber-700" />
                  Sdílet
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "w-16 sm:w-full sm:h-12 h-16 rounded-2xl border-2 transition-all duration-300",
                    isCopied
                      ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                      : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-primary/30"
                  )}
                  onClick={handleCopyCode}
                  disabled={!referralCode}
                >
                  {isCopied ? (
                    <CheckCircle2 className="h-6 w-6 animate-in zoom-in spin-in-90 duration-300" />
                  ) : (
                    <Copy className="h-5 w-5 text-slate-500" />
                  )}
                  <span className="sr-only">Kopírovat kód</span>
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sdílejte svůj kód s přáteli. Jakmile jej použijí při registraci a dokončí svůj první úklid, **získáte oba bonusové body** ve výši ceny tohoto úklidu.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction & Redemption History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Points History */}
        {transactions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-silver-premium" />
              Historie bodů
            </h2>
            <Card>
              <CardContent className="p-0 divide-y max-h-[400px] overflow-y-auto">
                {transactions.map((trans) => (
                  <div key={trans.id} className="flex items-center justify-between p-4 bg-card/50">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-bold text-xs truncate">{trans.description}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(trans.created_at), 'Pp', { locale: cs })}
                      </div>
                    </div>
                    <div className={`text-sm font-black shrink-0 ${trans.type === 'earned' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {trans.type === 'earned' ? '+' : '-'}{trans.amount} b.
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Redemptions History */}
        {redemptions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Gift className="h-5 w-5 text-silver-premium" />
              Vaše odměny
            </h2>
            <Card>
              <CardContent className="p-0 divide-y max-h-[400px] overflow-y-auto">
                {redemptions.map((red) => (
                  <div key={red.id} className="flex items-center justify-between p-4 bg-card/50">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-bold text-xs truncate">{red.prize_name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold opacity-60">
                        {red.points_cost} b. • {format(new Date(red.created_at), 'd.M.yyyy', { locale: cs })}
                      </div>
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold border-0 h-6 px-2",
                      red.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        red.status === 'fulfilled' ? "bg-emerald-100 text-emerald-700" :
                          "bg-rose-100 text-rose-700"
                    )}>
                      {red.status === 'pending' ? 'Čeká' :
                        red.status === 'fulfilled' ? 'Vyřízeno' : 'Zrušeno'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Support Section */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3 mt-8">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Máte dotaz k věrnostnímu programu?</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Rádi Vám zodpovíme jakékoliv otázky.
        </p>
        <PremiumButton
          className="w-full py-2.5 rounded-2xl text-base"
          onClick={() => window.location.href = 'tel:+420777645610'}
        >
          <Phone className="h-4 w-4" />
          Zavolat
        </PremiumButton>
      </div>
    </div>
  );
}
