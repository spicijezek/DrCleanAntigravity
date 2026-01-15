import { Target, Flame, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoyaltyTrackerProps {
    currentCredits: number;
}

const milestones = [
    { amount: 2700, reward: 'Vonná svíčka', icon: Flame },
    { amount: 4500, reward: 'Poukaz na večeři', icon: UtensilsCrossed },
    { amount: 13500, reward: 'Masáž', icon: Sparkles }
];

export function LoyaltyTracker({ currentCredits }: LoyaltyTrackerProps) {
    const nextMilestone = milestones.find(m => m.amount > currentCredits) || milestones[milestones.length - 1];
    const previousMilestone = milestones.filter(m => m.amount <= currentCredits).pop();

    const startAmount = previousMilestone?.amount || 0;
    const progressRange = nextMilestone.amount - startAmount;
    const progressInRange = currentCredits - startAmount;
    const progressPercentage = progressRange > 0 ? Math.min((progressInRange / progressRange) * 100, 100) : 100;

    const Icon = nextMilestone.icon;

    return (
        <div className="space-y-2 mt-3 pt-3 border-t border-amber-200/30 dark:border-amber-900/30">
            <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-800/70 dark:text-amber-300/70 font-bold uppercase tracking-wider">
                    <Target className="h-3 w-3" />
                    <span>Další odměna: {nextMilestone.reward}</span>
                </div>
                <span className="font-bold text-amber-900 dark:text-amber-100 italic">
                    {currentCredits.toLocaleString('cs-CZ')} / {nextMilestone.amount.toLocaleString('cs-CZ')} b.
                </span>
            </div>

            <div className="relative pt-1">
                <Progress
                    value={progressPercentage}
                    className="h-1.5 bg-amber-200/30 dark:bg-amber-950/50"
                />
                <div className="absolute top-0 right-0 -mt-1 mr-[-2px] h-3.5 w-3.5 rounded-full bg-white dark:bg-amber-900 flex items-center justify-center shadow-sm border border-amber-100 dark:border-amber-800">
                    <Icon className="h-2 w-2 text-primary" />
                </div>
            </div>

            <p className="text-[10px] text-amber-700/60 dark:text-amber-400/60 font-medium text-right">
                {currentCredits >= nextMilestone.amount
                    ? 'Odměna připravena!'
                    : `Chybí Vám ještě ${(nextMilestone.amount - currentCredits).toLocaleString('cs-CZ')} bodů`
                }
            </p>
        </div>
    );
}
