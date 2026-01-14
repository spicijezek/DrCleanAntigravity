import { Phone, Mail, MessageCircle } from 'lucide-react';

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
        <a 
          href="tel:+420777645610"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          <Phone className="h-4 w-4" />
          Zavolat
        </a>
        
        <a 
          href="mailto:uklid@drclean.cz"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors"
        >
          <Mail className="h-4 w-4" />
          Email
        </a>
      </div>
    </div>
  );
}
