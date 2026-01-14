import { Users, Star, Shield, Target, Shirt, Clock, MessageCircle, Heart, Eye } from 'lucide-react';

const indicators = [
  {
    icon: Users,
    value: '100+',
    label: 'Spokojených klientů',
  },
  {
    icon: Star,
    value: '9.6/10',
    label: 'Hodnocení',
  },
  {
    icon: Shield,
    value: 'Bezpečné',
    label: 'Prostředky',
  },
  {
    icon: Target,
    value: 'Důkladně',
    label: 'Ověřený personál',
  },
  {
    icon: Target,
    value: 'Max.',
    label: 'Spolehlivost',
  },
  {
    icon: Shirt,
    value: 'Služby',
    label: 'Šité na míru',
  },
  {
    icon: Clock,
    value: 'Hodiny',
    label: 'Ušetřeného času',
  },
  {
    icon: MessageCircle,
    value: 'Jednoduchá',
    label: 'Komunikace',
  },
  {
    icon: Heart,
    value: 'Zdravé',
    label: 'Prostředí',
  },
  {
    icon: Eye,
    value: '100%',
    label: 'Přehled',
  },
];

export function TrustIndicators() {
  return (
    <div className="overflow-hidden -mx-4">
      <div className="flex gap-3 animate-scroll-left w-max">
        {/* Triple indicators for seamless infinite loop */}
        {[...indicators, ...indicators, ...indicators].map((indicator, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-muted/50 border border-border"
          >
            <div className="p-1.5 rounded-lg bg-primary/10">
              <indicator.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">{indicator.value}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{indicator.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
