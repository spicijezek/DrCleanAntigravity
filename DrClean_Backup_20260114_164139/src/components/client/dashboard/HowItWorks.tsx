import { CalendarCheck, Clock, Phone, ClipboardList, Sparkles, FileText } from 'lucide-react';

const steps = [
  {
    icon: CalendarCheck,
    title: 'Vyberte službu',
    description: 'Zvolte typ úklidu podle Vašich potřeb',
  },
  {
    icon: Clock,
    title: 'Zvolte termín',
    description: 'Vyberete si preferované datum a čas',
  },
  {
    icon: Phone,
    title: 'Telefonní domluva',
    description: 'Domluvíme se na všech detailech',
  },
  {
    icon: ClipboardList,
    title: 'Tvorba Checklistu',
    description: 'Můžete vytvářet a upravovat úkoly',
  },
  {
    icon: Sparkles,
    title: 'My se postaráme',
    description: 'Spolehlivě zajistíme profi úklid',
  },
  {
    icon: FileText,
    title: 'Vystavíme fakturu',
    description: 'Po zhotovení úklidu se vyrovnáme',
  },
];

export function HowItWorks() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Jak to funguje?</h2>
      
      <div className="grid grid-cols-3 gap-3 gap-y-4">
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center text-center p-4 rounded-xl bg-card border border-border shadow-sm"
          >
            {/* Step number badge */}
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
              {index + 1}
            </div>
            
            <div className="mt-2 mb-2 p-2.5 rounded-full bg-primary/10">
              <step.icon className="h-5 w-5 text-primary" />
            </div>
            
            <h3 className="font-medium text-sm text-foreground mb-1">
              {step.title}
            </h3>
            
            <p className="text-xs text-muted-foreground leading-snug">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
