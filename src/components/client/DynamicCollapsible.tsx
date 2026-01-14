import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DynamicCollapsibleProps {
  openTitle: string;
  closedTitle: string;
  children: React.ReactNode;
  className?: string;
}

export function DynamicCollapsible({ openTitle, closedTitle, children, className = '' }: DynamicCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <CollapsibleTrigger className="grid grid-cols-[1fr_auto] items-center gap-2 w-full py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group text-left">
        <span className="font-medium">{isOpen ? openTitle : closedTitle}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent
        className="pt-2 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-150 ease-out"
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
