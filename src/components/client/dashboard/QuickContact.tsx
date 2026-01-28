import { Phone, Mail, MessageCircle } from 'lucide-react';
import { PremiumButton } from '@/components/ui/PremiumButton';

export function QuickContact() {
  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">Máte otázky?</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Jsme tu pro Vás. Neváhejte nás kontaktovat.
      </p>

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

        <PremiumButton
          asChild
          className="flex-1 h-12"
        >
          <a href="mailto:uklid@drclean.cz">
            <Mail className="h-4 w-4" />
            Email
          </a>
        </PremiumButton>
      </div>
    </div>
  );
}
