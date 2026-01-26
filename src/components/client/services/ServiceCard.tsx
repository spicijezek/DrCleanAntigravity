import { useState, useRef, useEffect } from 'react';
import { LucideIcon, ChevronDown, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  media?: string;
  mediaType?: 'image' | 'video';
  painPoints?: string[];
  benefits?: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function ServiceCard({
  id,
  title,
  description,
  icon: Icon,
  media,
  mediaType = 'image',
  painPoints,
  benefits,
  isOpen,
  onOpenChange,
  children
}: ServiceCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Handle video playback when card is open
  useEffect(() => {
    if (isOpen && videoRef.current && mediaType === 'video') {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  }, [isOpen, mediaType]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <Card className={cn(
        "overflow-hidden transition-all duration-300 border-2",
        isOpen
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : "border-border hover:border-primary/50 hover:shadow-md"
      )}>
        <CollapsibleTrigger className="w-full text-left">
          {/* Media Header - Only show when has media */}
          {media && (
            <div className="relative">
              {/* Image/Video container */}
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50 rounded-t-lg">
                {mediaType === 'video' ? (
                  <video
                    ref={videoRef}
                    src={media}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={media}
                    alt={title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {/* Expand indicator */}
                <div className="absolute top-3 right-3">
                  <div className={cn(
                    "p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 transition-transform duration-300 shadow-lg",
                    isOpen && "rotate-180"
                  )}>
                    <ChevronDown className="h-5 w-5 text-white stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Title container - connected to image but not overlaid */}
              <div className="px-4 py-3 bg-card border-t-0">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground shadow-xl -mt-10 relative z-10 border-2 border-white/20 transition-all duration-300">
                    <Icon className="h-8 w-8 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fallback header without media */}
          {!media && (
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary-foreground shadow-lg border-2 border-white/10">
                  <Icon className="h-7 w-7 text-white stroke-[2.5]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className={cn(
                  "p-2.5 rounded-full bg-muted border border-border shadow-sm transition-transform duration-300",
                  isOpen && "rotate-180"
                )}>
                  <ChevronDown className="h-5 w-5 text-primary stroke-[3]" />
                </div>
              </div>
            </CardHeader>
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-5 pt-4 pb-6">
            {/* Pain Points & Benefits Section */}
            {(painPoints || benefits) && (
              <div className="space-y-4">
                {/* Toggle button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(!showDetails);
                  }}
                  className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                >
                  <Sparkles className="h-5 w-5 stroke-[2.5]" />
                  {showDetails ? 'Skrýt informace' : 'Proč si vybrat tuto službu?'}
                  <ChevronDown className={cn(
                    "h-5 w-5 transition-transform stroke-[2.5]",
                    showDetails && "rotate-180"
                  )} />
                </button>

                {/* Pain Points & Benefits Content */}
                {showDetails && (
                  <div className="grid gap-4 sm:grid-cols-2 animate-fade-in">
                    {/* Pain Points */}
                    {painPoints && painPoints.length > 0 && (
                      <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30">
                        <h4 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                          <span className="text-lg">⚠️</span>
                          Možná vás trápí...
                        </h4>
                        <ul className="space-y-2.5">
                          {painPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                              <span className="text-destructive mt-0.5 text-lg font-bold flex-shrink-0">•</span>
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Benefits */}
                    {benefits && benefits.length > 0 && (
                      <div className="p-4 rounded-xl bg-success/10 border-2 border-success/30">
                        <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                          <span className="text-lg">✨</span>
                          Co získáte
                        </h4>
                        <ul className="space-y-2.5">
                          {benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground">
                              <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0 stroke-[3]" />
                              <span className="leading-relaxed">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Form Content */}
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
