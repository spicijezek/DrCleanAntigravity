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
      videoRef.current.play().catch(() => {});
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
                    "p-2 rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}>
                    <ChevronDown className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Title container - connected to image but not overlaid */}
              <div className="px-4 py-3 bg-card border-t-0">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-primary shadow-lg -mt-8 relative z-10">
                    <Icon className="h-5 w-5 text-primary-foreground" />
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
                <div className="p-2.5 rounded-xl bg-gradient-primary shadow-md">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div className={cn(
                  "p-2 rounded-full bg-muted transition-transform duration-300",
                  isOpen && "rotate-180"
                )}>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
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
                  <Sparkles className="h-4 w-4" />
                  {showDetails ? 'Skrýt informace' : 'Proč si vybrat tuto službu?'}
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    showDetails && "rotate-180"
                  )} />
                </button>

                {/* Pain Points & Benefits Content */}
                {showDetails && (
                  <div className="grid gap-4 sm:grid-cols-2 animate-fade-in">
                    {/* Pain Points */}
                    {painPoints && painPoints.length > 0 && (
                      <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <h4 className="text-sm font-semibold text-destructive mb-3">
                          Možná vás trápí...
                        </h4>
                        <ul className="space-y-2">
                          {painPoints.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-destructive mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Benefits */}
                    {benefits && benefits.length > 0 && (
                      <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                        <h4 className="text-sm font-semibold text-success mb-3">
                          Co získáte
                        </h4>
                        <ul className="space-y-2">
                          {benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                              {benefit}
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
