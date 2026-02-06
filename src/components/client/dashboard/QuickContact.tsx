import { Phone, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Button } from '@/components/ui/button';

export function QuickContact() {
  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircle className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">Máte otázky?</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Jsme tu pro Vás. Neváhejte nás kontaktovat.
      </p>

      <div className="space-y-3">
        <Button
          asChild
          variant="outline"
          className="w-full h-12 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-all font-bold rounded-xl gap-2"
        >
          <Link to="/klient/faq">
            <HelpCircle className="h-5 w-5" />
            Časté dotazy (FAQ)
          </Link>
        </Button>

        <div className="flex gap-3">
          <PremiumButton
            asChild
            className="flex-1 h-12"
          >
            <a href="tel:+420777645610">
              <Phone className="h-4 w-4" />
              Zavolat
            </a>
          </PremiumButton>

          <Button
            asChild
            variant="outline"
            className="flex-1 h-12 bg-white text-black border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all font-bold rounded-xl"
          >
            <a href="mailto:uklid@drclean.cz">
              <Mail className="h-4 w-4 text-black mr-2" />
              Email
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

