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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-6 text-white">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
      
      {/* Animated decorative circles - matching ClientHeroHeader */}
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 animate-float-circle-1" />
      <div className="absolute -right-2 top-14 h-14 w-14 rounded-full bg-white/15 animate-float-circle-2" />
      
      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <img src={drcleanIcon} alt="DrClean" className="h-5 w-5 animate-spin-slow" />
            <span className="text-sm font-medium text-white/80">DrClean</span>
          </div>
          
          <h1 className="text-2xl font-bold">
            {hasBookedBefore ? `Vítejte zpět, ${firstName}!` : `Vítejte, ${firstName}!`}
          </h1>
          
          <p className="text-white/80 text-sm leading-relaxed">
            {welcomeMessage}
          </p>
        </div>
        
        <div className="animate-sweep flex-shrink-0 -mr-2">
          <img 
            src={maidImage} 
            alt="Uklízečka" 
            className="h-28 w-28 sm:h-36 sm:w-36 object-contain"
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
