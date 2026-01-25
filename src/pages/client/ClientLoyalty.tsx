import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Share2, CheckCircle2, Phone, Flame, UtensilsCrossed, Sparkles, Trophy, Target, History as HistoryIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { LoadingOverlay } from '@/components/LoadingOverlay';
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

export default function ClientLoyalty() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentPoints = loyaltyData?.current_credits || 0;
  const animatedPoints = useCountUp(currentPoints);

  useEffect(() => {
    loadLoyaltyData();
  }, [user]);

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

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (client) {
        // 1. Fetch current credits
        const { data: creditData } = await supabase
          .from('loyalty_credits')
          .select('current_credits, total_earned, total_spent')
          .eq('client_id', client.id)
          .maybeSingle();

        if (creditData) {
          setLoyaltyData(creditData);
        } else {
          // Fallback/Calculation if no persisted record yet (migration phase)
          const { data: paidBookings } = await supabase
            .from('bookings')
            .select(`
              id,
              invoices!invoices_booking_id_fkey (
                id,
                total,
                status
              )
            `)
            .eq('client_id', client.id);

          let totalSpentCZK = 0;
          if (paidBookings) {
            paidBookings.forEach(booking => {
              const invoices = booking.invoices as any;
              if (Array.isArray(invoices)) {
                invoices.forEach((inv: any) => {
                  if (inv.status === 'paid') totalSpentCZK += Number(inv.total) || 0;
                });
              } else if (invoices && invoices.status === 'paid') {
                totalSpentCZK += Number(invoices.total) || 0;
              }
            });
          }
          const calculatedPoints = Math.round(totalSpentCZK * 0.27);
          setLoyaltyData({
            current_credits: calculatedPoints,
            total_earned: calculatedPoints,
            total_spent: totalSpentCZK
          });

          // Optionally initialize the record here
          await supabase.from('loyalty_credits').insert({
            client_id: client.id,
            current_credits: calculatedPoints,
            total_earned: calculatedPoints
          });
        }

        // 2. Fetch Transactions
        const { data: trans } = await supabase
          .from('loyalty_transactions')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (trans) {
          setTransactions(trans as Transaction[]);
        }

        // 3. Fetch Redemptions
        const { data: redemp } = await supabase
          .from('loyalty_redemptions')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });

        if (redemp) {
          setRedemptions(redemp as Redemption[]);
        }
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    } finally {
      setLoading(false);
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
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single();

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

      // Reload data
      loadLoyaltyData();

    } catch (error: any) {
      console.error('Error redeeming prize:', error);
      alert('Chyba při výběru odměny: ' + error.message);
    } finally {
      setRedeeming(null);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Dr.Clean - Připojte se ke mně!',
        text: 'Vyzkoušejte profesionální úklidové služby Dr.Clean',
        url: window.location.origin + '/klient-prihlaseni'
      });
    }
  };

  if (loading) {
    return <LoadingOverlay message="Načítám věrnostní program..." />;
  }

  const nextMilestone = getNextMilestone();
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

      {/* Progress to Next Milestone */}
      <Card className="border-primary/20 dark:border-primary/30 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/15 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Vaše body a odměny</h3>
              <p className="text-sm text-muted-foreground">Sbírejte body a vyberte si svou odměnu</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Aktuální stav</span>
              <span className="font-bold text-primary">
                {currentPoints.toLocaleString('cs-CZ')} b.
              </span>
            </div>
            <div className="relative h-3 w-full bg-primary/20 dark:bg-primary/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, (currentPoints / milestones[milestones.length - 1].amount) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold opacity-60">
              Čím více bodů, tím hodnotnější odměny
            </p>
          </div>
        </div>
      </Card>

      {/* Milestones Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Všechny odměny
          <Badge className="ml-auto bg-primary/10 text-primary dark:bg-primary/20 border-0">
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
                    ? 'bg-card border-primary/30 dark:border-primary/40 shadow-md'
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
                      className="bg-primary hover:bg-primary/90 shadow-sm font-bold"
                      onClick={() => handleRedeem(milestone)}
                      disabled={redeeming === milestone.reward}
                    >
                      {redeeming === milestone.reward ? 'Zpracovávám...' : 'Vybrat odměnu'}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="opacity-50 font-bold">
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

      {/* Share Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50">
              <Share2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold">Doporučte nás přátelům</h3>
              <p className="text-sm text-muted-foreground">
                Získejte bonus body za každého nového klienta!
              </p>
            </div>
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Sdílet s přáteli
          </Button>
        </div>
      </Card>

      {/* Transaction & Redemption History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Points History */}
        {transactions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
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
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
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
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors w-full"
        >
          <Phone className="h-4 w-4" />
          Zavolat
        </a>
      </div>
    </div>
  );
}
