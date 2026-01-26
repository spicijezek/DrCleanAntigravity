import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientDashboardData } from '@/hooks/useClientDashboardData';
import { Gift, Share2, CheckCircle2, Phone, Flame, UtensilsCrossed, Sparkles, Trophy, Target, History as HistoryIcon, Coins, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useToast } from '@/hooks/use-toast';
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

// Confetti particle component
function ConfettiParticle({ delay, color }: { delay: number; color: string }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-full animate-confetti"
      style={{
        backgroundColor: color,
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}ms`,
      }}
    />
  );
}

// Celebration effect component
function CelebrationEffect({ show }: { show: boolean }) {
  if (!show) return null;

  const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#ea580c'];
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map(p => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
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
  // Use the same hook as the dashboard - this guarantees consistency
  const { clientData, loyaltyCredits, isLoading: hookLoading } = useClientDashboardData();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  // Get points from the hook (same source as homepage)
  const currentPoints = loyaltyCredits?.current_credits || 0;
  const referralCode = clientData?.referral_code || null;
  const animatedPoints = useCountUp(currentPoints);

  // Milestone logic matching LoyaltyBannerWithProgress
  const nextMilestone = milestones.find(m => m.amount > currentPoints) || milestones[milestones.length - 1];
  const targetProgressPercentage = nextMilestone.amount > 0 ? Math.min((currentPoints / nextMilestone.amount) * 100, 100) : 100;
  const animatedProgress = useProgressAnimation(targetProgressPercentage);

  // Load transactions and redemptions when client data is available
  useEffect(() => {
    if (clientData?.id) {
      loadTransactionsAndRedemptions();
    }
  }, [clientData?.id]);

  // Sync loading state with hook
  useEffect(() => {
    if (!hookLoading) {
      setLoading(false);
    }
  }, [hookLoading]);

  // Check for newly achieved milestones
  useEffect(() => {
    if (currentPoints > 0) {
      const achievedMilestones = milestones.filter(m => currentPoints >= m.amount);
      if (achievedMilestones.length > 0) {
        // Show celebration briefly when page loads with achieved milestones
        setShowCelebration(true);
        const timer = setTimeout(() => setShowCelebration(false), 2500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentPoints]);

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

  const handleShare = () => {
    const shareText = `Vyzkoušejte profesionální úklidové služby DrClean! Při první objednávce získáte 2x více věrnostních bodů s mým kódem: ${referralCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'DrClean - Věrnostní program',
        text: shareText,
        url: window.location.origin + '/klient-prihlaseni'
      });
    } else {
      copyToClipboard(referralCode || '');
      toast({
        title: 'Kód zkopírován!',
        description: 'Teď ho můžete poslat přátelům.',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return <LoadingOverlay message="Načítám věrnostní program..." />;
  }

  const achievedCount = milestones.filter(m => currentPoints >= m.amount).length;

  return (
    <div className="container mx-auto p-4 pb-20 space-y-5">
      {/* Celebration Effect */}
      <CelebrationEffect show={showCelebration} />

      {/* Hero Header - Primary variant */}
      <ClientHeroHeader
        icon={Gift}
        title="Věrnostní Program"
        subtitle="Získávejte odměny za každý úklid"
        variant="primary"
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-1">
          <span className="text-white/70 text-sm">Vaše body</span>
          <div className="text-4xl font-bold text-white">
            {animatedPoints.toLocaleString('cs-CZ')} b.
          </div>
        </div>
      </ClientHeroHeader>

      {/* Progress to Next Milestone - Exact copy of Homepage Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 p-4 shadow-md">
        {/* Decorative circles from homepage */}
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-amber-200/30 dark:bg-amber-700/20" />
        <div className="absolute -right-2 top-8 h-10 w-10 rounded-full bg-orange-200/40 dark:bg-orange-700/20" />
        <div className="absolute -left-4 -bottom-4 h-16 w-16 rounded-full bg-amber-100/40 dark:bg-amber-800/20" />

        {/* Sparkle decorations from homepage */}
        <Sparkles className="absolute right-12 top-2 h-3 w-3 text-amber-500/60 animate-pulse" />
        <Sparkles className="absolute left-8 bottom-2 h-2.5 w-2.5 text-orange-400/50 animate-pulse" style={{ animationDelay: '0.5s' }} />

        <div className="relative space-y-3">
          {/* Header with points - Word for word copy */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0 animate-phone-shake">
              <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Věrnostní program</h3>
              <p className="text-sm text-muted-foreground">
                {currentPoints > 0
                  ? `Máte ${animatedPoints.toLocaleString('cs-CZ')} bodů`
                  : 'Sbírejte body za každý úklid'
                }
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentPoints > 0 && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <Coins className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{animatedPoints.toLocaleString('cs-CZ')}</span>
                </div>
              )}
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Progress to next prize - Exact layout from homepage */}
          {currentPoints > 0 && (
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

              {/* Animated progress bar from homepage */}
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
                <span>{animatedPoints.toLocaleString('cs-CZ')} bodů</span>
                <span>{nextMilestone.amount.toLocaleString('cs-CZ')} bodů</span>
              </div>
            </div>
          )}
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
                    <Button
                      size="sm"
                      className="bg-silver-button border-0 shadow-md font-black uppercase text-[10px] tracking-wider"
                      onClick={() => handleRedeem(milestone)}
                      disabled={redeeming === milestone.reward}
                    >
                      {redeeming === milestone.reward ? 'Zpracovávám...' : 'Vybrat odměnu'}
                    </Button>
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

      {/* Referral Card */}
      <Card className="overflow-hidden border-border dark:border-amber-800 shadow-lg">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/50 shadow-sm">
              <Share2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-foreground tracking-tight">Doporučte nás přátelům</h3>
              <p className="text-sm text-muted-foreground font-medium">Získejte 2x body pro oba za první úklid</p>
            </div>
          </div>

          <div className="bg-white/50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/50 space-y-3">
            <div className="flex flex-col items-center justify-center p-3 py-6 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700">
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-600 dark:text-amber-400 mb-1">Váš unikátní kód</p>
              <p className="text-4xl font-black tracking-[0.3em] text-foreground font-mono">{referralCode || 'DR...'}</p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Sdílejte svůj kód s přáteli. Jakmile jej použijí při registraci a zaplatí svou první fakturu, **získáte oba bonusové body** (v hodnotě jejich prvního úklidu).
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 bg-silver-button border-0 h-12 rounded-xl" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Sdílet s přáteli
            </Button>
            <Button variant="outline" className="h-12 w-12 rounded-xl border-amber-200 dark:border-amber-800" onClick={() => {
              copyToClipboard(referralCode || '');
              toast({ title: 'Kód zkopírován' });
            }}>
              <CheckCircle2 className="h-5 w-5 text-amber-600" />
            </Button>
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
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">Máte dotaz k věrnostnímu programu?</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Rádi Vám zodpovíme jakékoliv otázky.
        </p>
        <a
          href="tel:+420777645610"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-silver-button border-0 font-bold text-sm hover:shadow-lg transition-all w-full"
        >
          <Phone className="h-4 w-4" />
          Zavolat
        </a>
      </div>
    </div>
  );
}
