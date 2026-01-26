import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import maidImage from '@/assets/maid.png';
import drcleanIcon from '@/assets/drclean-icon.png';
import { useMemo } from 'react';

interface EmptyStateWelcomeProps {
  firstName: string;
  hasBookedBefore?: boolean;
}

// Rotating welcome messages for returning clients
const returningClientMessages = [
  'Rádi Vás opět vidíme. Objednejte si další úklid a nechte starosti na nás.',
  'Váš domov si zaslouží péči. Jsme tu pro Vás, kdykoli potřebujete.',
  'Čistý domov, čistá mysl. Rezervujte si termín a užívejte si volný čas.',
  'Děkujeme za Vaši důvěru. Připraveni Vám opět pomoci!',
  'Vítejte zpět! Kdy Vám můžeme znovu vyčistit domov?'
];

export function EmptyStateWelcome({ firstName, hasBookedBefore = false }: EmptyStateWelcomeProps) {
  // Pick a random message that stays consistent for the session
  const welcomeMessage = useMemo(() => {
    if (!hasBookedBefore) {
      return 'Váš čistý domov je na dosah ruky. Objednejte si svůj první úklid a nechte starosti na nás.';
    }
    const randomIndex = Math.floor(Math.random() * returningClientMessages.length);
    return returningClientMessages[randomIndex];
  }, [hasBookedBefore]);

  return (
    <div className="bg-silver-premium p-6 text-white group">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-[0.03]" />

      {/* Animated decorative circles - refined for silver look */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 animate-float-circle-1 blur-xl" />
      <div className="absolute -right-2 top-14 h-16 w-16 rounded-full bg-white/10 animate-float-circle-2 blur-lg" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-2">
            <img src={drcleanIcon} alt="DrClean" className="h-5 w-5 animate-spin-slow" />
            <span className="text-sm font-medium text-white/80">DrClean</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-white">
              {hasBookedBefore ? `Vítejte zpět, ${firstName}!` : `Vítejte, ${firstName}!`}
            </h1>

            <p className="text-white/80 text-sm leading-relaxed max-w-[240px] font-medium transition-colors group-hover:text-white">
              {welcomeMessage}
            </p>
          </div>
        </div>

        <div className="animate-sweep flex-shrink-0 -mr-4 sm:-mr-2 transition-transform duration-700 group-hover:scale-110">
          <img
            src={maidImage}
            alt="Uklízečka"
            className="h-32 w-32 sm:h-40 sm:w-40 object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Only show button for new clients - returning clients use the LastCleaningReminder below */}
      {!hasBookedBefore && (
        <Link to="/klient/sluzby" className="block mt-4 relative z-10">
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-[280px] mx-auto flex bg-white text-primary hover:bg-white/90 font-semibold shadow-lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Objednat první úklid
          </Button>
        </Link>
      )}
    </div>
  );
}
