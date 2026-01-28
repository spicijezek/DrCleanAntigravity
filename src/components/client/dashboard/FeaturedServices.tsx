import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, AppWindow, Sofa } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

import uklidVideo from "@/assets/uklid-video.mp4";
import windowCleaningImage from "@/assets/window-cleaning-image.jpg";
import upholsteryImage from "@/assets/upholstery-image.jpg";

const services = [
  {
    id: "cleaning",
    title: "Úklid",
    icon: Sparkles,
    media: uklidVideo,
    mediaType: "video" as const,
    description: "Kompletní úklid domácnosti nebo firmy",
  },
  {
    id: "window_cleaning",
    title: "Mytí Oken",
    icon: AppWindow,
    media: windowCleaningImage,
    mediaType: "image" as const,
    description: "Dokonale čistá okna bez šmouh",
  },
  {
    id: "upholstery_cleaning",
    title: "Čištění Čalounění",
    icon: Sofa,
    media: upholsteryImage,
    mediaType: "image" as const,
    description: "Hloubkové čištění nábytku a koberců",
  },
];

export function FeaturedServices() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  // Autoplay plugin - 4s delay, pauses on interaction but resumes after
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Restart video when slide 0 is active
  useEffect(() => {
    if (current === 0 && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => { });
    }
  }, [current]);

  const handleServiceClick = (serviceId: string) => {
    navigate(`/klient/sluzby?service=${serviceId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Naše služby</h2>
        <div className="flex gap-1.5">
          {services.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      </div>

      <Carousel
        setApi={setApi}
        plugins={[autoplayPlugin.current]}
        opts={{
          loop: true,
          align: "start",
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {services.map((service, index) => (
            <CarouselItem key={service.id} className="pl-4">
              <div
                onClick={() => handleServiceClick(service.id)}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-border transition-all duration-300 hover:border-primary/50 hover:shadow-xl bg-card"
              >
                {/* Media Header */}
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  {service.mediaType === "video" ? (
                    <video
                      ref={index === 0 ? videoRef : null}
                      src={service.media}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={service.media}
                      alt={service.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  {/* Overlay for better text readability if needed, though here we use a separate container */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Content Container (Matches ServiceCard design) */}
                <div className="px-5 pb-6 pt-1 bg-card">
                  <div className="flex flex-col items-center text-center gap-3">
                    {/* Floating Icon Box */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-primary-foreground shadow-xl -mt-10 relative z-10 border-2 border-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
                      <service.icon className="h-7 w-7 text-white stroke-[2.5]" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-foreground tracking-tight">{service.title}</h3>
                      <p className="text-sm text-muted-foreground font-medium max-w-[280px]">
                        {service.description}
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
