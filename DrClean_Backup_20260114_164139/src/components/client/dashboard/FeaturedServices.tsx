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
    description: "Domácnosti, kanceláře, jednorázově i pravidelně",
  },
  {
    id: "window_cleaning",
    title: "Mytí oken",
    icon: AppWindow,
    media: windowCleaningImage,
    mediaType: "image" as const,
    description: "Špaletová, plastová, rámy i parapety",
  },
  {
    id: "upholstery_cleaning",
    title: "Čištění čalounění",
    icon: Sofa,
    media: upholsteryImage,
    mediaType: "image" as const,
    description: "Sedačky, koberce, matrace, křesla, židle",
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
      videoRef.current.play().catch(() => {});
    }
  }, [current]);

  const currentService = services[current];

  const handleServiceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/klient/sluzby?service=${currentService.id}`);
  };

  return (
    <div className="space-y-4 mb-6 pb-6">
      <h2 className="text-lg font-semibold text-foreground">Naše služby</h2>

      <div onClick={handleServiceClick} className="block relative w-full cursor-pointer">
        <Carousel
          setApi={setApi}
          plugins={[autoplayPlugin.current]}
          opts={{
            loop: true,
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {services.map((service, index) => (
              <CarouselItem key={service.id} className="pl-0">
                <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-muted to-muted/50 rounded-t-xl overflow-hidden">
                  {service.mediaType === "video" ? (
                    <video
                      ref={index === 0 ? videoRef : null}
                      src={service.media}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={service.media}
                      alt={service.title}
                      loading="eager"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Button - Connected below media */}
        <Button
          variant="secondary"
          className="w-full rounded-none py-4 text-base font-medium"
          asChild
        >
          <span>{currentService.title}</span>
        </Button>

        {/* Description - Connected below button with border */}
        <div className="w-full bg-muted/50 rounded-b-xl py-3 px-4 text-center border border-border border-t-0">
          <p className="text-sm text-muted-foreground">
            {currentService.description}
          </p>
        </div>
      </div>
    </div>
  );
}
