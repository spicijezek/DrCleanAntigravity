import { useState, useEffect, useRef } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StyledSelect } from '@/components/ui/styled-select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Sparkles, Building2, AppWindow, Sofa, Construction, ChevronDown, Check, X, Phone, Mail, Droplet, Wind, Flame, Package, Shirt, Bed, Calculator, Info, Star, Home, Armchair, BedDouble, LayoutGrid, Layers, AlertTriangle, RockingChair } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { kalkulujUklidDomacnosti400, kalkulujUklidFirmy, kalkulujMytiOken, kalkulujCalouneni, DirtinessLevel, FrequencyType, OfficeDirtinessLevel, OfficeFrequencyType, OfficeSpaceType, CleaningTimeType, WindowDirtinessLevel, WindowObjectType, UpholsteryCalculatorResult } from '@/lib/cleaningCalculator';
import { useIsMobile } from '@/hooks/use-mobile';
import { UpholsteryServiceSelector } from '@/components/booking/UpholsteryServiceSelector';

import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { ServiceCard } from '@/components/client/services/ServiceCard';
import { BookingStepContainer } from '@/components/booking/BookingStepContainer';
import { cn } from '@/lib/utils';
import { bookingDetailsSchema, bookingAddressSchema } from '@/lib/validationSchemas';
import { DateTimeRow } from '@/components/ui/date-time-picker';
import { LoadingOverlay } from '@/components/LoadingOverlay';

// Import media assets
import uklidImage from '@/assets/uklid-image.png';
import windowCleaningImage from '@/assets/window-cleaning-image.jpg';
import upholsteryImage from '@/assets/upholstery-image-new.jpg';
import cleaningStep1Image from '@/assets/cleaning-step-1.png';
import cleaningStep2Image from '@/assets/cleaning-step-2.png';
import cleaningStep3Image from '@/assets/cleaning-step-3.png';
import cleaningStep4Image from '@/assets/cleaning-step-4.png';
import cleaningStep5Image from '@/assets/cleaning-step-5.png';
import cleaningStep6Image from '@/assets/cleaning-step-6.png';
import windowCleaningStep1Image from '@/assets/window-cleaning-step-1.png';
import windowCleaningStep2Image from '@/assets/window-cleaning-step-2.png';
import windowCleaningStep3Image from '@/assets/window-cleaning-step-3.png';
import upholsteryStep1Image from '@/assets/upholstery-step-1.png';
import upholsteryStep2Image from '@/assets/upholstery-step-2.png';
import uklidVideo from '@/assets/uklid-video.mp4';






const services = [{
  id: 'cleaning',
  title: 'Úklid',
  icon: Sparkles,
  description: 'Kompletní úklid domácnosti nebo firmy',
  category: 'home_cleaning',
  media: uklidVideo,
  mediaType: 'video' as const,
  painPoints: ['Nemáte čas na pravidelný úklid?', 'Unavuje Vás neustálé mytí a lešení?', 'Chybí Vám síla po práci?'],
  benefits: ['Úspora času na rodinu a koníčky', 'Profesionální výsledek za skvělou cenu', 'Ekologické čisticí prostředky']
}, {
  id: 'window_cleaning',
  title: 'Mytí Oken',
  icon: AppWindow,
  description: 'Dokonale čistá okna bez šmouh',
  category: 'window_cleaning',
  media: windowCleaningImage,
  mediaType: 'image' as const,
  painPoints: ['Mytí oken je nebezpečné a časově náročné?', 'Zůstávají šmouhy i po umytí?', 'Těžko dostupná místa?'],
  benefits: ['Více světla v interiéru', 'Bezpečné mytí i ve výškách', 'Bez šmouh a stop']
}, {
  id: 'upholstery_cleaning',
  title: 'Čištění Čalounění',
  icon: Sofa,
  description: 'Hloubkové čištění nábytku a koberců',
  category: 'upholstery_cleaning',
  media: upholsteryImage,
  mediaType: 'image' as const,
  painPoints: ['Skvrny na sedačce kazí vzhled?', 'Alergeny v čalounění?', 'Nepříjemné pachy?'],
  benefits: ['Odstranění skvrn a zápachu', 'Prodloužení životnosti nábytku', 'Hypoalergenní prostředky']
}];
const extraServices = [{
  id: 'window_wash',
  title: 'Mytí Oken',
  icon: AppWindow,
  benefits: ['Více světla', 'Bez šmouh', 'Bezpečné mytí']
}, {
  id: 'fridge_clean',
  title: 'Čištění Lednice',
  icon: Package,
  benefits: ['Hygiena potravin', 'Odstranění zápachu', 'Dezinfekce']
}, {
  id: 'oven_clean',
  title: 'Čištění Trouby',
  icon: Flame,
  benefits: ['Odstranění připálenin', 'Lepší výkon', 'Bez chemie']
}, {
  id: 'carpet_clean',
  title: 'Čištění Koberce',
  icon: Droplet,
  benefits: ['Hloubkové čištění', 'Odstranění skvrn', 'Svěží vzhled']
}, {
  id: 'sofa_clean',
  title: 'Čištění Sedačky',
  icon: Sofa,
  benefits: ['Obnova barev', 'Odstranění alergenu', 'Svěží vůně']
}, {
  id: 'mattress_clean',
  title: 'Čištění Matrace',
  icon: Bed,
  benefits: ['Zdravý spánek', 'Protiroztočová ochrana', 'Hygienická čistota']
}];
const supplies = [{
  id: 'vacuum',
  title: 'Vysavač',
  icon: Wind
}, {
  id: 'mop',
  title: 'Mop',
  icon: Droplet
}, {
  id: 'supplies',
  title: 'Prostředky',
  icon: Sparkles
}, {
  id: 'cloths',
  title: 'Čisté Hadry',
  icon: Shirt
}];
type BookingData = {
  date: string;
  time: string;
  street: string;
  city: string;
  postal_code: string;
  notes: string;
  equipment_option: 'with' | 'without' | '';
  cleaning_type: 'osobni' | 'firemni' | '';
  extraServices: string[];
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  plocha_m2: number;
  pocet_koupelen: number;
  pocet_kuchyni: number;
  typ_domacnosti: 'byt' | 'rodinny_dum' | '';
  znecisteni: DirtinessLevel | '';
  frekvence: FrequencyType | '';
  // Office cleaning fields
  pocet_wc: number;
  pocet_kuchynek: number;
  typ_prostoru: OfficeSpaceType | '';
  znecisteni_office: OfficeDirtinessLevel | '';
  frekvence_office: OfficeFrequencyType | '';
  doba: CleaningTimeType | '';
  doplnky_office: string[];
  doplnky_home: string[];
  // Window cleaning fields
  pocet_oken: number;
  plocha_oken_m2: number;
  znecisteni_okna: WindowDirtinessLevel | '';
  typ_objektu_okna: WindowObjectType | '';
  // Upholstery cleaning fields
  koberce: boolean;
  typ_koberec: string;
  plocha_koberec: number;
  znecisteni_koberec: string;
  sedacka: boolean;
  velikost_sedacka: string;
  znecisteni_sedacka: string;
  matrace: boolean;
  velikost_matrace: string;
  strany_matrace: string;
  znecisteni_matrace: string;
  kresla: boolean;
  pocet_kresla: number;
  znecisteni_kresla: string;
  zidle: boolean;
  pocet_zidle: number;
  znecisteni_zidle: string;
};
export default function ClientServices({
  isPublicBooking = false,
  preSelectedService = null,
  isSolo = false
}: {
  isPublicBooking?: boolean;
  preSelectedService?: string | null;
  isSolo?: boolean;
} = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Helper to scroll to the top of a specific service card with a consistent offset.
  // This ensures the header doesn't cover the content and provides a uniform experience.
  const scrollToService = (serviceId: string) => {
    const element = document.getElementById(serviceId);
    if (element) {
      // Calculate offset: 80px for header + 20px padding
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [cleaningStep, setCleaningStep] = useState(1);
  const [windowStep, setWindowStep] = useState(1);
  const [upholsteryStep, setUpholsteryStep] = useState(1);
  const serviceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const formRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [bookingData, setBookingData] = useState<BookingData>({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    street: '',
    city: '',
    postal_code: '',
    notes: '',
    equipment_option: '',
    cleaning_type: '',
    extraServices: [],
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    plocha_m2: 50,
    pocet_koupelen: 1,
    pocet_kuchyni: 1,
    typ_domacnosti: '',
    znecisteni: '',
    frekvence: '',
    doplnky_home: [],
    // Office cleaning defaults
    pocet_wc: 1,
    pocet_kuchynek: 1,
    typ_prostoru: '',
    znecisteni_office: '',
    frekvence_office: '',
    doba: '',
    doplnky_office: [],
    // Window cleaning defaults
    pocet_oken: 8,
    plocha_oken_m2: 10,
    znecisteni_okna: '',
    typ_objektu_okna: '',
    // Upholstery cleaning defaults
    koberce: false,
    typ_koberec: 'Kusový',
    plocha_koberec: 0,
    znecisteni_koberec: 'Nízké',
    sedacka: false,
    velikost_sedacka: '2-místná',
    znecisteni_sedacka: 'Nízké',
    matrace: false,
    velikost_matrace: '90',
    strany_matrace: '1 strana',
    znecisteni_matrace: 'Nízké',
    kresla: false,
    pocet_kresla: 0,
    znecisteni_kresla: 'Nízké',
    zidle: false,
    pocet_zidle: 0,
    znecisteni_zidle: 'Nízké'
  });
  const [priceEstimate, setPriceEstimate] = useState({
    hoursMin: 0,
    hoursMax: 0,
    priceMin: 0,
    priceMax: 0,
    discountPercent: 0,
    baseServiceMin: 0,
    baseServiceMax: 0,
    addOnsMin: 0,
    addOnsMax: 0,
    windowMin: 0,
    windowMax: 0,
    upholsteryMin: 0,
    upholsteryMax: 0,
    equipmentCost: 0,
    upholsteryBelowMinimum: false,
    upholsteryMinimumOrder: 1500,
    // Individual upholstery category prices for breakdown
    upholsteryCarpetPrice: 0,
    upholsterySofaPrice: 0,
    upholsteryMattressPrice: 0,
    upholsteryArmchairPrice: 0,
    upholsteryChairPrice: 0
  });
  const MINIMUM_ORDER = 1500;
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedClientForBooking, setSelectedClientForBooking] = useState<string>('');
  const [availableClients, setAvailableClients] = useState<Array<{
    id: string;
    user_id: string;
    name: string;
    email: string | null;
  }>>([]);
  const [adminPriceOverride, setAdminPriceOverride] = useState<string>('');
  const {
    user
  } = useAuth();

  // Support both authenticated and anonymous (guest) users
  const isGuest = isPublicBooking && !user;
  const isAdminBooking = user?.email === 'stepan.tomov5@seznam.cz' && !isGuest;

  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();

  // Google Maps API for address autocomplete
  const GOOGLE_MAPS_API_KEY = 'AIzaSyATxE6HkAJcLTbYyLoOwVlYqEhak32DDCQ';
  const libraries: ('places')[] = ['places'];
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded: isGoogleMapsLoaded } = useLoadScript({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'cs',
    region: 'CZ',
  });

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        let street = '';
        let houseNumber = '';
        let city = '';
        let postalCode = '';

        place.address_components?.forEach(component => {
          if (component.types.includes('route')) {
            street = component.long_name;
          } else if (component.types.includes('street_number')) {
            houseNumber = component.long_name;
          } else if (component.types.includes('locality')) {
            city = component.long_name;
          } else if (!city && component.types.includes('postal_town')) {
            city = component.long_name;
          } else if (!city && component.types.includes('sublocality')) {
            city = component.long_name;
          } else if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        const fullStreetAddress = street ? `${street} ${houseNumber}`.trim() : (place.name || '');

        setBookingData(prev => ({
          ...prev,
          street: fullStreetAddress || prev.street,
          city: city || prev.city,
          postal_code: postalCode || prev.postal_code
        }));
      }
    }
  };

  // Fetch all clients for admin or current client address
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      if (isAdminBooking) {
        // Fetch all clients for admin dropdown
        const {
          data: clients
        } = await supabase.from('clients').select('id, user_id, name, email').order('name');
        if (clients) {
          setAvailableClients(clients);
        }
      } else {
        // Fetch current client's address
        const {
          data: clientData
        } = await (supabase.from('clients') as any).select('address, city, postal_code').eq('user_id', user.id).maybeSingle();
        if (clientData) {
          const client = clientData as any;
          setBookingData(prev => ({
            ...prev,
            street: client.address || '',
            city: client.city || '',
            postal_code: client.postal_code || ''
          }));
        }
      }
    };
    fetchData();
  }, [user?.id, isAdminBooking]);

  // Handle pre-selected service from landing page (public booking)
  useEffect(() => {
    if (preSelectedService && !selectedService) {
      const service = services.find(s => s.id === preSelectedService);
      if (service) {
        setSelectedService(service);
        // Scroll to the service form after a short delay
        setTimeout(() => scrollToService(preSelectedService), 300);
      }
    }
  }, [preSelectedService, selectedService]);

  // Auto-open service from URL parameter
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId) {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        // Clear the URL parameter after opening
        setSearchParams({}, { replace: true });
        // Scroll to the service card after a brief delay
        // Scroll to the service card using our new helper
        scrollToService(serviceId);
      }
    }
  }, [searchParams, setSearchParams]);

  // Persistence: Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('klinr_booking_state');
      // Only restore if we are not explicitly starting a new specific service flow via URL (optional heuristic, 
      // but if user clicks "Order Cleaning" we probably want fresh start OR restored cleaning state. 
      // For now, simple restoration of data. Service selection might be overridden by props/URL effects below which is fine.)
      if (savedState) {
        const parsed = JSON.parse(savedState);

        // Restore booking data
        if (parsed.bookingData) {
          // Ensure we don't overwrite with old dates if they are in the past? 
          // The date picker logic handles validation/minDate visually, but we restore the string.
          setBookingData(prev => ({ ...prev, ...parsed.bookingData }));
        }

        // Restore steps
        if (parsed.cleaningStep) setCleaningStep(parsed.cleaningStep);
        if (parsed.windowStep) setWindowStep(parsed.windowStep);
        if (parsed.upholsteryStep) setUpholsteryStep(parsed.upholsteryStep);

        // Restore selected service if not already set by props
        if (parsed.selectedServiceId && !selectedService && !preSelectedService && !searchParams.get('service')) {
          const service = services.find(s => s.id === parsed.selectedServiceId);
          if (service) setSelectedService(service);
        }
      }
    } catch (e) {
      console.error('Failed to load booking state', e);
    }
  }, []);

  // Persistence: Save state to localStorage on change
  useEffect(() => {
    // Debounce saving slightly or just save on every render is fine for localstorage (fast)
    // But let's only save if we have a selected service, to avoid saving empty state
    if (selectedService) {
      const stateToSave = {
        bookingData,
        cleaningStep,
        windowStep,
        upholsteryStep,
        selectedServiceId: selectedService.id
      };
      localStorage.setItem('klinr_booking_state', JSON.stringify(stateToSave));
    }
  }, [bookingData, cleaningStep, windowStep, upholsteryStep, selectedService]);

  // Persistence: Clear state on success
  useEffect(() => {
    if (showSuccess) {
      localStorage.removeItem('klinr_booking_state');
    }
  }, [showSuccess]);

  useEffect(() => {
    if (selectedService?.id === 'cleaning' && bookingData.cleaning_type === 'osobni') {
      const z = (bookingData.znecisteni || 'nizka') as DirtinessLevel;
      const f = (bookingData.frekvence || 'jednorazove') as FrequencyType;
      const homeResult = kalkulujUklidDomacnosti400({
        plocha_m2: bookingData.plocha_m2,
        pocet_koupelen: bookingData.pocet_koupelen,
        pocet_kuchyni: bookingData.pocet_kuchyni,
        znecisteni: z,
        frekvence: f
      });
      let addOnsMin = 0;
      let addOnsMax = 0;
      let windowMin = 0;
      let windowMax = 0;
      let upholsteryMin = 0;
      let upholsteryMax = 0;

      // Add equipment cost if needed
      if (bookingData.equipment_option === 'without') {
        addOnsMin += 290;
        addOnsMax += 290;
      }

      // Add window cleaning if selected (uses pocet_oken as m² and znecisteni_okna)
      if (bookingData.doplnky_home.includes('Mytí oken') && bookingData.pocet_oken > 0 && bookingData.znecisteni_okna) {
        const windowResult = kalkulujMytiOken({
          plocha_m2: bookingData.pocet_oken,
          pocet_oken: bookingData.pocet_oken,
          znecisteni: bookingData.znecisteni_okna as WindowDirtinessLevel
        });
        windowMin = windowResult.priceMin;
        windowMax = windowResult.priceMax;
        addOnsMin += windowResult.priceMin;
        addOnsMax += windowResult.priceMax;
      }

      // Add upholstery cleaning if selected
      if (bookingData.doplnky_home.includes('Čištění čalounění')) {
        const upholsteryResult = kalkulujCalouneni({
          koberce: bookingData.koberce,
          typ_koberec: bookingData.typ_koberec,
          plocha_koberec: bookingData.plocha_koberec,
          znecisteni_koberec: bookingData.znecisteni_koberec,
          sedacka: bookingData.sedacka,
          velikost_sedacka: bookingData.velikost_sedacka,
          znecisteni_sedacka: bookingData.znecisteni_sedacka,
          matrace: bookingData.matrace,
          velikost_matrace: bookingData.velikost_matrace,
          strany_matrace: bookingData.strany_matrace,
          znecisteni_matrace: bookingData.znecisteni_matrace,
          kresla: bookingData.kresla,
          pocet_kresla: bookingData.pocet_kresla,
          znecisteni_kresla: bookingData.znecisteni_kresla,
          zidle: bookingData.zidle,
          pocet_zidle: bookingData.pocet_zidle,
          znecisteni_zidle: bookingData.znecisteni_zidle
        });
        upholsteryMin = upholsteryResult.priceMin;
        upholsteryMax = upholsteryResult.priceMax;
        addOnsMin += upholsteryResult.priceMin;
        addOnsMax += upholsteryResult.priceMax;
      }
      const equipmentCost = bookingData.equipment_option === 'without' ? 290 : 0;
      setPriceEstimate({
        hoursMin: homeResult.hoursMin,
        hoursMax: homeResult.hoursMax,
        priceMin: homeResult.priceMin + addOnsMin,
        priceMax: homeResult.priceMax + addOnsMax,
        discountPercent: homeResult.discountPercent,
        baseServiceMin: homeResult.priceMin,
        baseServiceMax: homeResult.priceMax,
        addOnsMin: addOnsMin,
        addOnsMax: addOnsMax,
        windowMin,
        windowMax,
        upholsteryMin,
        upholsteryMax,
        equipmentCost,
        upholsteryBelowMinimum: false,
        upholsteryMinimumOrder: 1500,
        upholsteryCarpetPrice: 0,
        upholsterySofaPrice: 0,
        upholsteryMattressPrice: 0,
        upholsteryArmchairPrice: 0,
        upholsteryChairPrice: 0
      });
    } else if (selectedService?.id === 'cleaning' && bookingData.cleaning_type === 'firemni') {
      if (bookingData.typ_prostoru && bookingData.znecisteni_office && bookingData.frekvence_office) {
        // Calculate base office cleaning price (always using 'denni' time)
        const officeResult = kalkulujUklidFirmy({
          plocha_m2: bookingData.plocha_m2,
          pocet_wc: bookingData.pocet_wc,
          pocet_kuchynek: bookingData.pocet_kuchynek,
          typ_prostoru: bookingData.typ_prostoru as OfficeSpaceType,
          znecisteni: bookingData.znecisteni_office as OfficeDirtinessLevel,
          frekvence: bookingData.frekvence_office as OfficeFrequencyType,
          doba: 'denni' as CleaningTimeType,
          doplnky: []
        });
        let addOnsMin = 0;
        let addOnsMax = 0;
        let windowMin = 0;
        let windowMax = 0;
        let upholsteryMin = 0;
        let upholsteryMax = 0;

        // Add equipment cost if needed
        if (bookingData.equipment_option === 'without') {
          addOnsMin += 290;
          addOnsMax += 290;
        }

        // Add window cleaning if selected (same as home cleaning - no typ_objektu needed)
        if (bookingData.doplnky_office.includes('Mytí oken') && bookingData.pocet_oken > 0 && bookingData.znecisteni_okna) {
          const windowResult = kalkulujMytiOken({
            plocha_m2: bookingData.pocet_oken,
            pocet_oken: bookingData.pocet_oken,
            znecisteni: bookingData.znecisteni_okna as WindowDirtinessLevel
          });
          windowMin = windowResult.priceMin;
          windowMax = windowResult.priceMax;
          addOnsMin += windowResult.priceMin;
          addOnsMax += windowResult.priceMax;
        }

        // Add upholstery cleaning if selected
        if (bookingData.doplnky_office.includes('Čištění čalounění')) {
          const upholsteryResult = kalkulujCalouneni({
            koberce: bookingData.koberce,
            typ_koberec: bookingData.typ_koberec,
            plocha_koberec: bookingData.plocha_koberec,
            znecisteni_koberec: bookingData.znecisteni_koberec,
            sedacka: bookingData.sedacka,
            velikost_sedacka: bookingData.velikost_sedacka,
            znecisteni_sedacka: bookingData.znecisteni_sedacka,
            matrace: bookingData.matrace,
            velikost_matrace: bookingData.velikost_matrace,
            strany_matrace: bookingData.strany_matrace,
            znecisteni_matrace: bookingData.znecisteni_matrace,
            kresla: bookingData.kresla,
            pocet_kresla: bookingData.pocet_kresla,
            znecisteni_kresla: bookingData.znecisteni_kresla,
            zidle: bookingData.zidle,
            pocet_zidle: bookingData.pocet_zidle,
            znecisteni_zidle: bookingData.znecisteni_zidle
          });
          upholsteryMin = upholsteryResult.priceMin;
          upholsteryMax = upholsteryResult.priceMax;
          addOnsMin += upholsteryResult.priceMin;
          addOnsMax += upholsteryResult.priceMax;
        }
        const equipmentCost = bookingData.equipment_option === 'without' ? 290 : 0;
        setPriceEstimate({
          hoursMin: officeResult.hoursMin,
          hoursMax: officeResult.hoursMax,
          priceMin: officeResult.priceMin + addOnsMin,
          priceMax: officeResult.priceMax + addOnsMax,
          discountPercent: officeResult.discountPercent,
          baseServiceMin: officeResult.priceMin,
          baseServiceMax: officeResult.priceMax,
          addOnsMin: addOnsMin,
          addOnsMax: addOnsMax,
          windowMin,
          windowMax,
          upholsteryMin,
          upholsteryMax,
          equipmentCost,
          upholsteryBelowMinimum: false,
          upholsteryMinimumOrder: 1500,
          upholsteryCarpetPrice: 0,
          upholsterySofaPrice: 0,
          upholsteryMattressPrice: 0,
          upholsteryArmchairPrice: 0,
          upholsteryChairPrice: 0
        });
      }
    } else if (selectedService?.id === 'window_cleaning') {
      if (bookingData.pocet_oken > 0 && bookingData.znecisteni_okna && bookingData.typ_objektu_okna) {
        const result = kalkulujMytiOken({
          plocha_m2: bookingData.pocet_oken,
          pocet_oken: bookingData.pocet_oken,
          znecisteni: bookingData.znecisteni_okna as WindowDirtinessLevel,
          typ_objektu: bookingData.typ_objektu_okna as WindowObjectType
        });
        setPriceEstimate({
          ...result,
          baseServiceMin: result.priceMin,
          baseServiceMax: result.priceMax,
          addOnsMin: 0,
          addOnsMax: 0,
          windowMin: 0,
          windowMax: 0,
          upholsteryMin: 0,
          upholsteryMax: 0,
          equipmentCost: 0,
          upholsteryBelowMinimum: false,
          upholsteryMinimumOrder: 1500,
          upholsteryCarpetPrice: 0,
          upholsterySofaPrice: 0,
          upholsteryMattressPrice: 0,
          upholsteryArmchairPrice: 0,
          upholsteryChairPrice: 0
        });
      } else {
        // Reset to zero if no valid window cleaning data
        setPriceEstimate({
          hoursMin: 0,
          hoursMax: 0,
          priceMin: 0,
          priceMax: 0,
          discountPercent: 0,
          baseServiceMin: 0,
          baseServiceMax: 0,
          addOnsMin: 0,
          addOnsMax: 0,
          windowMin: 0,
          windowMax: 0,
          upholsteryMin: 0,
          upholsteryMax: 0,
          equipmentCost: 0,
          upholsteryBelowMinimum: false,
          upholsteryMinimumOrder: 1500,
          upholsteryCarpetPrice: 0,
          upholsterySofaPrice: 0,
          upholsteryMattressPrice: 0,
          upholsteryArmchairPrice: 0,
          upholsteryChairPrice: 0
        });
      }
    } else if (selectedService?.id === 'upholstery_cleaning') {
      const result = kalkulujCalouneni({
        koberce: bookingData.koberce,
        typ_koberec: bookingData.typ_koberec,
        plocha_koberec: bookingData.plocha_koberec,
        znecisteni_koberec: bookingData.znecisteni_koberec,
        sedacka: bookingData.sedacka,
        velikost_sedacka: bookingData.velikost_sedacka,
        znecisteni_sedacka: bookingData.znecisteni_sedacka,
        matrace: bookingData.matrace,
        velikost_matrace: bookingData.velikost_matrace,
        strany_matrace: bookingData.strany_matrace,
        znecisteni_matrace: bookingData.znecisteni_matrace,
        kresla: bookingData.kresla,
        pocet_kresla: bookingData.pocet_kresla,
        znecisteni_kresla: bookingData.znecisteni_kresla,
        zidle: bookingData.zidle,
        pocet_zidle: bookingData.pocet_zidle,
        znecisteni_zidle: bookingData.znecisteni_zidle
      });
      setPriceEstimate({
        hoursMin: result.hoursMin,
        hoursMax: result.hoursMax,
        priceMin: result.priceMin,
        priceMax: result.priceMax,
        discountPercent: result.discountPercent,
        baseServiceMin: result.priceMin,
        baseServiceMax: result.priceMax,
        addOnsMin: 0,
        addOnsMax: 0,
        windowMin: 0,
        windowMax: 0,
        upholsteryMin: 0,
        upholsteryMax: 0,
        equipmentCost: 0,
        upholsteryBelowMinimum: result.belowMinimum,
        upholsteryMinimumOrder: result.minimumOrder,
        upholsteryCarpetPrice: result.carpetPrice,
        upholsterySofaPrice: result.sofaPrice,
        upholsteryMattressPrice: result.mattressPrice,
        upholsteryArmchairPrice: result.armchairPrice,
        upholsteryChairPrice: result.chairPrice
      });
    }
  }, [selectedService, bookingData.cleaning_type, bookingData.plocha_m2, bookingData.pocet_koupelen, bookingData.pocet_kuchyni, bookingData.znecisteni, bookingData.frekvence, bookingData.equipment_option, bookingData.doplnky_home, bookingData.pocet_wc, bookingData.pocet_kuchynek, bookingData.typ_prostoru, bookingData.znecisteni_office, bookingData.frekvence_office, bookingData.doplnky_office, bookingData.pocet_oken, bookingData.plocha_oken_m2, bookingData.znecisteni_okna, bookingData.typ_objektu_okna, bookingData.koberce, bookingData.typ_koberec, bookingData.plocha_koberec, bookingData.znecisteni_koberec, bookingData.sedacka, bookingData.velikost_sedacka, bookingData.znecisteni_sedacka, bookingData.matrace, bookingData.velikost_matrace, bookingData.strany_matrace, bookingData.znecisteni_matrace, bookingData.kresla, bookingData.pocet_kresla, bookingData.znecisteni_kresla, bookingData.zidle, bookingData.pocet_zidle, bookingData.znecisteni_zidle]);
  const handleBooking = async () => {
    if (!selectedService) return;
    if (!user && !isPublicBooking) return;

    // Validation for admin booking
    if (isAdminBooking && !selectedClientForBooking) {
      toast({
        variant: 'destructive',
        title: 'Vyberte klienta',
        description: 'Musíte vybrat klienta pro rezervaci.'
      });
      return;
    }
    setLoading(true);
    try {
      // Determine which client to use
      let client;
      if (isAdminBooking) {
        // Admin is booking for a selected client
        const {
          data: selectedClient
        } = await supabase.from('clients').select('id, user_id, name, email, phone').eq('id', selectedClientForBooking).single();
        client = selectedClient;
      } else if (user) {
        // Regular client booking for themselves
        let {
          data: existingClient
        } = await supabase.from('clients').select('id, user_id, name, email, phone').eq('user_id', user.id).maybeSingle();
        if (!existingClient) {
          const name = user.user_metadata?.full_name as string || user.email || 'Klient';
          const phone = user.user_metadata?.phone as string || null;
          const {
            data: newClient,
            error: createClientError
          } = await supabase.from('clients').insert([{
            user_id: user.id,
            name,
            email: user.email,
            phone,
            client_source: 'App'
          }]).select('id, user_id, name, email, phone').single();
          if (createClientError) throw createClientError;
          existingClient = newClient;
        }
        client = existingClient;
      } else if (isPublicBooking) {
        // Guest booking
        if (!bookingData.guestEmail || !bookingData.guestName || !bookingData.guestPhone) {
          throw new Error('Prosím vyplňte všechny kontaktní údaje.');
        }

        const { data: existingClient } = await supabase.from('clients')
          .select('id, user_id, name, email, phone')
          .eq('email', bookingData.guestEmail)
          .maybeSingle();

        if (existingClient) {
          client = existingClient;
        } else {
          const clientToInsert: any = {
            name: bookingData.guestName,
            email: bookingData.guestEmail,
            phone: bookingData.guestPhone,
            client_source: 'Web'
          };

          const { data: newClient, error: createError } = await (supabase.from('clients') as any)
            .insert([clientToInsert])
            .select('id, user_id, name, email, phone')
            .single();
          if (createError) throw createError;
          client = newClient;
        }
      }

      if (!client) throw new Error('Klient nenalezen');
      // Validate address
      const addressValidation = bookingAddressSchema.safeParse({
        street: bookingData.street,
        city: bookingData.city,
        postal_code: bookingData.postal_code,
      });
      if (!addressValidation.success) {
        const firstError = addressValidation.error.errors[0];
        throw new Error(firstError?.message || 'Invalid address');
      }

      // Prepare booking details
      const bookingDetails: Record<string, unknown> = {
        service_type: selectedService.id,
        service_title: selectedService.title,
        notes: bookingData.notes?.substring(0, 2000) || '', // Enforce length limit
        equipment_option: bookingData.equipment_option,
        extraServices: bookingData.extraServices,
        priceEstimate: isAdminBooking && adminPriceOverride ? {
          ...priceEstimate,
          priceMin: parseFloat(adminPriceOverride),
          priceMax: parseFloat(adminPriceOverride)
        } : priceEstimate
      };

      // Add service-specific details
      if (selectedService.id === 'cleaning' && bookingData.cleaning_type === 'osobni') {
        bookingDetails.cleaning_type = 'osobni';
        bookingDetails.plocha_m2 = bookingData.plocha_m2;
        bookingDetails.pocet_koupelen = bookingData.pocet_koupelen;
        bookingDetails.pocet_kuchyni = bookingData.pocet_kuchyni;
        bookingDetails.znecisteni = bookingData.znecisteni;
        bookingDetails.frekvence = bookingData.frekvence;
        bookingDetails.doplnky = bookingData.doplnky_home;

        // Add window cleaning details if selected
        if (bookingData.doplnky_home.includes('Mytí oken')) {
          bookingDetails.pocet_oken = bookingData.pocet_oken;
          bookingDetails.plocha_oken_m2 = bookingData.plocha_oken_m2;
          bookingDetails.typ_objektu_okna = bookingData.typ_objektu_okna;
          bookingDetails.znecisteni_okna = bookingData.znecisteni_okna;
        }

        // Add upholstery cleaning details if selected
        if (bookingData.doplnky_home.includes('Čištění čalounění')) {
          bookingDetails.koberce = bookingData.koberce;
          bookingDetails.typ_koberec = bookingData.typ_koberec;
          bookingDetails.plocha_koberec = bookingData.plocha_koberec;
          bookingDetails.znecisteni_koberec = bookingData.znecisteni_koberec;
          bookingDetails.sedacka = bookingData.sedacka;
          bookingDetails.velikost_sedacka = bookingData.velikost_sedacka;
          bookingDetails.znecisteni_sedacka = bookingData.znecisteni_sedacka;
          bookingDetails.matrace = bookingData.matrace;
          bookingDetails.velikost_matrace = bookingData.velikost_matrace;
          bookingDetails.strany_matrace = bookingData.strany_matrace;
          bookingDetails.znecisteni_matrace = bookingData.znecisteni_matrace;
          bookingDetails.kresla = bookingData.kresla;
          bookingDetails.pocet_kresla = bookingData.pocet_kresla;
          bookingDetails.znecisteni_kresla = bookingData.znecisteni_kresla;
          bookingDetails.zidle = bookingData.zidle;
          bookingDetails.pocet_zidle = bookingData.pocet_zidle;
          bookingDetails.znecisteni_zidle = bookingData.znecisteni_zidle;
        }
      } else if (selectedService.id === 'cleaning' && bookingData.cleaning_type === 'firemni') {
        bookingDetails.cleaning_type = 'firemni';
        bookingDetails.plocha_m2 = bookingData.plocha_m2;
        bookingDetails.pocet_wc = bookingData.pocet_wc;
        bookingDetails.pocet_kuchynek = bookingData.pocet_kuchynek;
        bookingDetails.typ_prostoru = bookingData.typ_prostoru;
        bookingDetails.znecisteni = bookingData.znecisteni_office;
        bookingDetails.frekvence = bookingData.frekvence_office;
        bookingDetails.doplnky = bookingData.doplnky_office;

        // Add window cleaning details if selected
        if (bookingData.doplnky_office.includes('Mytí oken')) {
          bookingDetails.pocet_oken = bookingData.pocet_oken;
          bookingDetails.plocha_oken_m2 = bookingData.plocha_oken_m2;
          bookingDetails.typ_objektu_okna = bookingData.typ_objektu_okna;
          bookingDetails.znecisteni_okna = bookingData.znecisteni_okna;
        }

        // Add upholstery cleaning details if selected
        if (bookingData.doplnky_office.includes('Čištění čalounění')) {
          bookingDetails.koberce = bookingData.koberce;
          bookingDetails.typ_koberec = bookingData.typ_koberec;
          bookingDetails.plocha_koberec = bookingData.plocha_koberec;
          bookingDetails.znecisteni_koberec = bookingData.znecisteni_koberec;
          bookingDetails.sedacka = bookingData.sedacka;
          bookingDetails.velikost_sedacka = bookingData.velikost_sedacka;
          bookingDetails.znecisteni_sedacka = bookingData.znecisteni_sedacka;
          bookingDetails.matrace = bookingData.matrace;
          bookingDetails.velikost_matrace = bookingData.velikost_matrace;
          bookingDetails.strany_matrace = bookingData.strany_matrace;
          bookingDetails.znecisteni_matrace = bookingData.znecisteni_matrace;
          bookingDetails.kresla = bookingData.kresla;
          bookingDetails.pocet_kresla = bookingData.pocet_kresla;
          bookingDetails.znecisteni_kresla = bookingData.znecisteni_kresla;
          bookingDetails.zidle = bookingData.zidle;
          bookingDetails.pocet_zidle = bookingData.pocet_zidle;
          bookingDetails.znecisteni_zidle = bookingData.znecisteni_zidle;
        }
      } else if (selectedService.id === 'window_cleaning') {
        bookingDetails.pocet_oken = bookingData.pocet_oken;
        bookingDetails.plocha_oken_m2 = bookingData.plocha_oken_m2;
        bookingDetails.znecisteni_okna = bookingData.znecisteni_okna;
        bookingDetails.typ_objektu_okna = bookingData.typ_objektu_okna;
      } else if (selectedService.id === 'upholstery_cleaning') {
        bookingDetails.koberce = bookingData.koberce;
        bookingDetails.typ_koberec = bookingData.typ_koberec;
        bookingDetails.plocha_koberec = bookingData.plocha_koberec;
        bookingDetails.znecisteni_koberec = bookingData.znecisteni_koberec;
        bookingDetails.sedacka = bookingData.sedacka;
        bookingDetails.velikost_sedacka = bookingData.velikost_sedacka;
        bookingDetails.znecisteni_sedacka = bookingData.znecisteni_sedacka;
        bookingDetails.matrace = bookingData.matrace;
        bookingDetails.velikost_matrace = bookingData.velikost_matrace;
        bookingDetails.strany_matrace = bookingData.strany_matrace;
        bookingDetails.znecisteni_matrace = bookingData.znecisteni_matrace;
        bookingDetails.kresla = bookingData.kresla;
        bookingDetails.pocet_kresla = bookingData.pocet_kresla;
        bookingDetails.znecisteni_kresla = bookingData.znecisteni_kresla;
        bookingDetails.zidle = bookingData.zidle;
        bookingDetails.pocet_zidle = bookingData.pocet_zidle;
        bookingDetails.znecisteni_zidle = bookingData.znecisteni_zidle;
      }

      // Validate booking details before insertion
      const detailsValidation = bookingDetailsSchema.safeParse(bookingDetails);
      if (!detailsValidation.success) {
        console.warn('Booking details validation warnings:', detailsValidation.error.errors);
        // Still proceed as we use passthrough() - this is for logging/monitoring
      }

      // Use the admin's user_id (from client record) instead of the client's user_id
      const scheduledDate = new Date(`${bookingData.date}T${bookingData.time}:00`);
      const fullAddress = `${addressValidation.data.street}, ${addressValidation.data.city}, ${addressValidation.data.postal_code}`;

      const bookingToInsert: any = {
        client_id: client.id,
        service_type: selectedService.id,
        scheduled_date: scheduledDate.toISOString(),
        address: fullAddress,
        booking_details: (detailsValidation.success ? detailsValidation.data : bookingDetails) as any,
        status: 'pending'
      };

      if (user?.id) {
        bookingToInsert.user_id = user.id;
      } else if (client.user_id) {
        bookingToInsert.user_id = client.user_id;
      }

      const { data: booking, error: bookingError } = await (supabase.from('bookings') as any).insert([bookingToInsert]).select('*').single();

      if (bookingError) throw bookingError;

      toast({
        title: 'Rezervace odeslána!',
        description: 'Brzy Vás budeme kontaktovat.'
      });

      if (isPublicBooking && !user) {
        // Redirect to confirmation page with booking data
        navigate('/rezervace-potvrzeni', {
          state: {
            booking: {
              ...(booking as any),
              client: client
            }
          }
        });
      } else {
        // Redirect to client dashboard
        window.location.href = '/klient';
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba rezervace',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleExtraService = (service: string) => {
    setBookingData(prev => ({
      ...prev,
      extraServices: prev.extraServices.includes(service) ? prev.extraServices.filter(s => s !== service) : [...prev.extraServices, service]
    }));
  };
  const toggleOfficeDoplnek = (doplnek: string) => {
    setBookingData(prev => ({
      ...prev,
      doplnky_office: prev.doplnky_office.includes(doplnek) ? prev.doplnky_office.filter(d => d !== doplnek) : [...prev.doplnky_office, doplnek]
    }));
  };
  const toggleHomeDoplnek = (doplnek: string) => {
    setBookingData(prev => ({
      ...prev,
      doplnky_home: prev.doplnky_home.includes(doplnek) ? prev.doplnky_home.filter(d => d !== doplnek) : [...prev.doplnky_home, doplnek]
    }));
  };

  // Auto-scroll on step changes to keep KROK tracker at top, hiding service picture
  useEffect(() => {
    if (selectedService) {
      setTimeout(() => {
        const formElement = formRefs.current[selectedService.id];
        if (formElement) {
          const yOffset = -20; // Small offset from very top
          const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [cleaningStep, windowStep, upholsteryStep, selectedService]);

  return <div className={cn(
    "container mx-auto px-4 pt-6 pb-20 space-y-6",
    isSolo && "max-w-7xl lg:px-12 lg:pt-12"
  )}>
    {/* Hero Header - Only show if not coming from landing page and not in solo mode */}
    {!preSelectedService && !isSolo && (
      <div className="lg:max-w-4xl lg:mx-auto">
        <ClientHeroHeader
          icon={Sparkles}
          title="Naše Služby"
          subtitle="Vyberte si službu, kterou potřebujete"
        />
      </div>
    )}

    {isAdminBooking && <Card className="border-primary lg:max-w-4xl lg:mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">Rezervace pro klienta</CardTitle>
        <CardDescription>Vyberte klienta, pro kterého vytváříte rezervaci</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedClientForBooking} onValueChange={setSelectedClientForBooking}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Vyberte klienta..." />
          </SelectTrigger>
          <SelectContent>
            {availableClients.map(client => <SelectItem key={client.id} value={client.id}>
              {client.name} ({client.email || 'Bez emailu'})
            </SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>}

    {/* Intro Section - Only show if not coming from landing page and not in solo mode */}
    {!preSelectedService && !isSolo && (
      <div className="bg-muted/50 rounded-xl p-4 border border-border lg:max-w-4xl lg:mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-medium text-foreground">Jak to funguje?</h3>
            <p className="text-sm text-muted-foreground">
              Vyberte službu, vyplňte formulář a my se vám ozveme pro finální domluvu.
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Services Grid - Show all or only pre-selected service */}
    <div className={cn(
      "grid gap-6",
      preSelectedService ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
    )}>
      {services
        .filter(service => !preSelectedService || service.id === preSelectedService)
        .map(service => {
          const isOpen = selectedService?.id === service.id;
          return (
            <div
              key={service.id}
              ref={(el) => { serviceRefs.current[service.id] = el; }}
              className={cn(
                // When open on desktop: span all 3 columns and center with max-width
                isOpen && "lg:col-span-3",
                // Mobile always single column (no changes)
              )}
            >
              {/* Centered container for opened cards on desktop only - 20% smaller */}
              <div className={cn(
                isOpen && !preSelectedService && "lg:max-w-3xl lg:mx-auto",
                preSelectedService && !isSolo && "lg:max-w-3xl lg:mx-auto",
                isSolo && "lg:max-w-6xl lg:mx-auto w-full"
              )}>
                <ServiceCard
                  id={service.id}
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  media={service.media}
                  mediaType={service.mediaType}
                  painPoints={service.painPoints}
                  benefits={service.benefits}
                  isOpen={isOpen || isSolo}
                  isSolo={isSolo}
                  onOpenChange={(open) => {
                    if (open) {
                      setSelectedService(service);
                      if (service.id === 'cleaning') setCleaningStep(1);
                      if (service.id === 'window_cleaning') setWindowStep(1);
                      if (service.id === 'upholstery_cleaning') setUpholsteryStep(1);

                      // Scroll to form after it renders, hiding service picture and positioning KROK tracker at top
                      setTimeout(() => {
                        const formElement = formRefs.current[service.id];
                        if (formElement) {
                          const yOffset = -20; // Small offset from very top
                          const y = formElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                          window.scrollTo({ top: y, behavior: 'smooth' });
                        }
                      }, 100);
                    } else {
                      setSelectedService(null);
                    }
                  }}
                  hideDetails={service.id === 'cleaning' || service.id === 'window_cleaning' || service.id === 'upholstery_cleaning'}
                >

                  {/* Multi-step Cleaning Form */}
                  {service.id === 'cleaning' && (
                    <div ref={el => { formRefs.current['cleaning'] = el; }}>
                      <BookingStepContainer
                        currentStep={cleaningStep}
                        totalSteps={6}
                        isSolo={isSolo}
                        title={
                          cleaningStep === 1 ? "O jaký typ úklidu máte zájem?" :
                            cleaningStep === 2 ? "Zadejte parametry prostoru" :
                              cleaningStep === 3 ? "Detaily a frekvence úklidu" :
                                cleaningStep === 4 ? "Úklidové vybavení" :
                                  cleaningStep === 5 ? "Kdy a kam máme dorazit?" :
                                    "Shrnutí a poznámky"
                        }
                        onNext={() => {
                          if (cleaningStep === 6) {
                            handleBooking();
                          } else {
                            setCleaningStep(prev => prev + 1);
                            scrollToService('cleaning');
                          }
                        }}
                        onBack={() => {
                          setCleaningStep(prev => prev - 1);
                          scrollToService('cleaning');
                        }}
                        isLastStep={cleaningStep === 6}
                        isNextDisabled={
                          (cleaningStep === 1 && !bookingData.cleaning_type) ||
                          (cleaningStep === 2 && (
                            bookingData.cleaning_type === 'osobni'
                              ? (!bookingData.plocha_m2 || !bookingData.typ_domacnosti)
                              : (!bookingData.plocha_m2 || !bookingData.typ_prostoru)
                          )) ||
                          (cleaningStep === 3 && (
                            bookingData.cleaning_type === 'osobni'
                              ? (!bookingData.znecisteni || !bookingData.frekvence)
                              : (!bookingData.znecisteni_office || !bookingData.frekvence_office)
                          )) ||
                          (cleaningStep === 4 && !bookingData.equipment_option) ||
                          (cleaningStep === 5 && (!bookingData.date || !bookingData.time || !bookingData.street || !bookingData.city || !bookingData.postal_code)) ||
                          (cleaningStep === 6 && !gdprConsent)
                        }
                        mediaSlot={
                          (cleaningStep >= 1 && cleaningStep <= 6) ? (
                            <div className="flex items-center justify-center w-full h-full p-8">
                              <img
                                src={
                                  cleaningStep === 1 ? cleaningStep1Image :
                                    cleaningStep === 2 ? cleaningStep2Image :
                                      cleaningStep === 3 ? cleaningStep3Image :
                                        cleaningStep === 4 ? cleaningStep4Image :
                                          cleaningStep === 5 ? cleaningStep5Image :
                                            cleaningStep6Image
                                }
                                alt="Ilustrace kroku"
                                className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in-50 duration-500"
                              />
                            </div>
                          ) : undefined
                        }
                      >
                        {/* Step 1: Type Selection */}
                        {cleaningStep === 1 && (
                          <section className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <Card
                                className={cn(
                                  "relative cursor-pointer transition-all hover:border-primary/50 group",
                                  bookingData.cleaning_type === 'osobni' ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "bg-card"
                                )}
                                onClick={() => setBookingData({ ...bookingData, cleaning_type: 'osobni' })}
                              >
                                <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                                  <div className={cn(
                                    "p-4 rounded-2xl transition-colors",
                                    bookingData.cleaning_type === 'osobni' ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                  )}>
                                    <Home className="h-8 w-8" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="font-bold">Domácnost</h3>
                                    <p className="text-xs text-muted-foreground">Úklid bytu nebo domu</p>
                                  </div>
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    bookingData.cleaning_type === 'osobni' ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {bookingData.cleaning_type === 'osobni' && <Check className="h-4 w-4 text-white" />}
                                  </div>
                                </CardContent>
                              </Card>

                              <Card
                                className={cn(
                                  "relative cursor-pointer transition-all hover:border-primary/50 group",
                                  bookingData.cleaning_type === 'firemni' ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "bg-card"
                                )}
                                onClick={() => setBookingData({ ...bookingData, cleaning_type: 'firemni' })}
                              >
                                <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                                  <div className={cn(
                                    "p-4 rounded-2xl transition-colors",
                                    bookingData.cleaning_type === 'firemni' ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                  )}>
                                    <Building2 className="h-8 w-8" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="font-bold">Firma</h3>
                                    <p className="text-xs text-muted-foreground">Kanceláře a komerční prostory</p>
                                  </div>
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    bookingData.cleaning_type === 'firemni' ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {bookingData.cleaning_type === 'firemni' && <Check className="h-4 w-4 text-white" />}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </section>
                        )}

                        {/* Step 2: Area Parameters */}
                        {cleaningStep === 2 && (
                          <section className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            {bookingData.cleaning_type === 'osobni' ? (
                              <>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Plocha (m²)</Label>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="20"
                                      max="500"
                                      className="h-12 bg-background border-2 focus-visible:ring-primary/20"
                                      value={bookingData.plocha_m2 || ''}
                                      onChange={e => setBookingData({ ...bookingData, plocha_m2: Number(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Počet koupelen</Label>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      className="h-12 bg-background border-2 focus-visible:ring-primary/20"
                                      value={bookingData.pocet_koupelen || ''}
                                      onChange={e => setBookingData({ ...bookingData, pocet_koupelen: Number(e.target.value) || 0 })}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Počet kuchyní</Label>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      className="h-12 bg-background border-2 focus-visible:ring-primary/20"
                                      value={bookingData.pocet_kuchyni || ''}
                                      onChange={e => setBookingData({ ...bookingData, pocet_kuchyni: Number(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Typ domácnosti</Label>
                                    {isMobile ? (
                                      <StyledSelect
                                        value={bookingData.typ_domacnosti || ''}
                                        className="h-12"
                                        onChange={e => setBookingData({ ...bookingData, typ_domacnosti: e.target.value as 'byt' | 'rodinny_dum' })}
                                      >
                                        <option value="" disabled>Zvolte typ</option>
                                        <option value="byt">Byt</option>
                                        <option value="rodinny_dum">Rodinný dům</option>
                                      </StyledSelect>
                                    ) : (
                                      <Select
                                        value={bookingData.typ_domacnosti || undefined}
                                        onValueChange={(value: 'byt' | 'rodinny_dum') => setBookingData({ ...bookingData, typ_domacnosti: value })}
                                      >
                                        <SelectTrigger className="h-12 bg-background border-2">
                                          <SelectValue placeholder="Zvolte typ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="byt">Byt</SelectItem>
                                          <SelectItem value="rodinny_dum">Rodinný dům</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Plocha (m²)</Label>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="20"
                                      className="h-12 bg-background border-2 focus-visible:ring-primary/20"
                                      value={bookingData.plocha_m2 || ''}
                                      onChange={e => setBookingData({ ...bookingData, plocha_m2: Number(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Počet WC</Label>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      className="h-12 bg-background border-2 focus-visible:ring-primary/20"
                                      value={bookingData.pocet_wc || ''}
                                      onChange={e => setBookingData({ ...bookingData, pocet_wc: Number(e.target.value) || 0 })}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Počet kuchyněk</Label>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="0"
                                      className="h-12 bg-background border-2 focus-visible:ring-primary/20"
                                      value={bookingData.pocet_kuchynek || ''}
                                      onChange={e => setBookingData({ ...bookingData, pocet_kuchynek: Number(e.target.value) || 0 })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Typ prostoru</Label>
                                    {isMobile ? (
                                      <StyledSelect
                                        value={bookingData.typ_prostoru || ''}
                                        className="h-12"
                                        onChange={e => setBookingData({ ...bookingData, typ_prostoru: e.target.value as OfficeSpaceType })}
                                      >
                                        <option value="" disabled>Zvolte typ</option>
                                        <option value="kancelar">Kancelář</option>
                                        <option value="obchod">Obchod</option>
                                        <option value="sklad">Sklad</option>
                                        <option value="vyroba">Výroba</option>
                                      </StyledSelect>
                                    ) : (
                                      <Select
                                        value={bookingData.typ_prostoru || undefined}
                                        onValueChange={(value: OfficeSpaceType) => setBookingData({ ...bookingData, typ_prostoru: value })}
                                      >
                                        <SelectTrigger className="h-12 bg-background border-2">
                                          <SelectValue placeholder="Zvolte typ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="kancelar">Kancelář</SelectItem>
                                          <SelectItem value="obchod">Obchod</SelectItem>
                                          <SelectItem value="sklad">Sklad</SelectItem>
                                          <SelectItem value="vyroba">Výroba</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </section>
                        )}

                        {/* Step 3: Dirtiness & Frequency */}
                        {cleaningStep === 3 && (
                          <section className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold">Úroveň znečištění</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {(bookingData.cleaning_type === 'osobni' ? ['nizka', 'stredni', 'vysoka'] : ['nizke', 'stredni', 'vysoke']).map((level) => (
                                  <div
                                    key={level}
                                    className={cn(
                                      "p-3 rounded-xl border-2 text-center cursor-pointer transition-all",
                                      (bookingData.cleaning_type === 'osobni' ? bookingData.znecisteni : bookingData.znecisteni_office) === level
                                        ? "border-primary bg-primary/10 font-bold"
                                        : "border-border hover:border-primary/30"
                                    )}
                                    onClick={() => setBookingData({
                                      ...bookingData,
                                      [bookingData.cleaning_type === 'osobni' ? 'znecisteni' : 'znecisteni_office']: level
                                    })}
                                  >
                                    <span className="text-xs uppercase tracking-wider">
                                      {level === 'nizka' || level === 'nizke' ? 'Nízké' : level === 'stredni' ? 'Střední' : 'Vysoké'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-semibold">Frekvence úklidu</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {(bookingData.cleaning_type === 'osobni'
                                  ? [
                                    { id: 'jednorazove', label: 'Jednorázově' },
                                    { id: 'mesicne', label: 'Měsíčně', discount: '–10 %' },
                                    { id: 'ctyrtydne', label: 'Každé 2 týdny', discount: '–15 %' },
                                    { id: 'tydne', label: 'Každý týden', discount: '–20 %' }
                                  ]
                                  : [
                                    { id: 'jednorazove', label: 'Jednorázově' },
                                    { id: 'mesicne', label: 'Měsíčně', discount: '–10 %' },
                                    { id: 'tydne', label: 'Každý týden', discount: '–20 %' },
                                    { id: 'denne', label: 'Denně', discount: '–30 %' }
                                  ]
                                ).map((freq) => (
                                  <div
                                    key={freq.id}
                                    className={cn(
                                      "p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[72px]",
                                      (bookingData.cleaning_type === 'osobni' ? bookingData.frekvence : bookingData.frekvence_office) === freq.id
                                        ? "border-primary bg-primary/10 ring-1 ring-primary/20 font-bold"
                                        : "border-border hover:border-primary/30"
                                    )}
                                    onClick={() => setBookingData({
                                      ...bookingData,
                                      [bookingData.cleaning_type === 'osobni' ? 'frekvence' : 'frekvence_office']: freq.id
                                    })}
                                  >
                                    <span className="text-sm uppercase tracking-wider font-bold">{freq.label}</span>
                                    {freq.discount && (
                                      <span className="text-[11px] font-black bg-[#059669] text-white px-2.5 py-0.5 rounded-full mt-1 shadow-sm uppercase tracking-tight">
                                        {freq.discount}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                          </section>
                        )}

                        {/* Step 4: Equipment */}
                        {cleaningStep === 4 && (
                          <section className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-1 gap-3">
                              <Card
                                className={cn(
                                  "relative cursor-pointer transition-all hover:border-primary/50 group",
                                  bookingData.equipment_option === 'with' ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md" : "bg-card shadow-sm hover:shadow-md"
                                )}
                                onClick={() => setBookingData({ ...bookingData, equipment_option: 'with' })}
                              >
                                <CardContent className="p-5 flex items-start gap-4">
                                  <div className={cn(
                                    "p-3 rounded-xl transition-colors shrink-0",
                                    bookingData.equipment_option === 'with' ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                  )}>
                                    <Check className="h-6 w-6" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="font-bold text-sm">Mám vlastní vybavení</h3>
                                    <p className="text-[10px] text-muted-foreground leading-tight">Vysavač, mop, čisté hadry a základní čistící prostředky máte k dispozici na místě.</p>
                                  </div>
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ml-auto shrink-0",
                                    bookingData.equipment_option === 'with' ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {bookingData.equipment_option === 'with' && <Check className="h-4 w-4 text-white" />}
                                  </div>
                                </CardContent>
                              </Card>

                              <Card
                                className={cn(
                                  "relative cursor-pointer transition-all hover:border-primary/50 group",
                                  bookingData.equipment_option === 'without' ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md" : "bg-card shadow-sm hover:shadow-md"
                                )}
                                onClick={() => setBookingData({ ...bookingData, equipment_option: 'without' })}
                              >
                                <CardContent className="p-5 flex items-start gap-4">
                                  <div className={cn(
                                    "p-3 rounded-xl transition-colors shrink-0",
                                    bookingData.equipment_option === 'without' ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                  )}>
                                    <Package className="h-6 w-6" />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="font-bold text-sm">Vezměte vlastní vybavení</h3>
                                    <p className="text-[10px] text-muted-foreground leading-tight">Naše profesionální vybavení a ekologické prostředky přivezeme s sebou.</p>
                                    <span className="inline-block px-2 py-0.5 mt-1 rounded bg-primary/20 text-[10px] font-bold text-primary">+290 Kč</span>
                                  </div>
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ml-auto shrink-0",
                                    bookingData.equipment_option === 'without' ? "bg-primary border-primary" : "border-muted-foreground/30"
                                  )}>
                                    {bookingData.equipment_option === 'without' && <Check className="h-4 w-4 text-white" />}
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold">Poznámka k úklidu</Label>
                              <Textarea
                                placeholder="Máte nějaké speciální přání nebo instrukce pro náš tým?"
                                className="min-h-[100px] bg-background border-2 resize-none"
                                value={bookingData.notes}
                                onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                              />
                            </div>

                            {/* Detail forms for selected doplňkové služby */}
                            {(bookingData.doplnky_home.includes('window_cleaning') || bookingData.doplnky_home.includes('upholstery_cleaning')) && (
                              <div className="mt-8 space-y-6 pt-6 border-t-2 border-primary/10">
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Plus className="h-4 w-4 text-primary" />
                                  </div>
                                  <h3 className="text-lg font-bold">Detaily doplňkových služeb</h3>
                                </div>

                                {bookingData.doplnky_home.includes('window_cleaning') && <section className="space-y-4 p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 shadow-sm animate-in zoom-in-95 duration-300">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AppWindow className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold text-sm">Mytí oken</h4>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plocha m² (jedna strana)</Label>
                                      <Input type="number" inputMode="numeric" min="1" max="100" placeholder="Např. 8" className="h-12 rounded-xl bg-background border-2" value={bookingData.pocet_oken || ''} onChange={e => setBookingData({
                                        ...bookingData,
                                        pocet_oken: Number(e.target.value) || 0
                                      })} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Úroveň znečištění</Label>
                                      <Select value={bookingData.znecisteni_okna || undefined} onValueChange={(value: WindowDirtinessLevel) => setBookingData({
                                        ...bookingData,
                                        znecisteni_okna: value
                                      })}>
                                        <SelectTrigger className="bg-background h-12 rounded-xl border-2">
                                          <SelectValue placeholder="Zvolte" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="nizke">Nízké</SelectItem>
                                          <SelectItem value="stredni">Střední</SelectItem>
                                          <SelectItem value="vysoke">Vysoké</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </section>}

                                {bookingData.doplnky_home.includes('upholstery_cleaning') && <section className="space-y-4 p-5 bg-primary/5 rounded-2xl border-2 border-primary/10 shadow-sm animate-in zoom-in-95 duration-300">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sofa className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold text-sm">Čištění čalounění</h4>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      type="button"
                                      variant={bookingData.koberce ? 'default' : 'outline'}
                                      className={cn("h-11 rounded-xl font-bold transition-all", bookingData.koberce && "shadow-md")}
                                      onClick={() => setBookingData({ ...bookingData, koberce: !bookingData.koberce })}
                                    >
                                      Koberce
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={bookingData.sedacka ? 'default' : 'outline'}
                                      className={cn("h-11 rounded-xl font-bold transition-all", bookingData.sedacka && "shadow-md")}
                                      onClick={() => setBookingData({ ...bookingData, sedacka: !bookingData.sedacka })}
                                    >
                                      Sedačka
                                    </Button>
                                  </div>

                                  {bookingData.koberce && (
                                    <div className="space-y-3 p-3 bg-background rounded-xl border-2 border-primary/10 animate-in slide-in-from-left-2 duration-200">
                                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Koberce plocha (m²)</Label>
                                      <Input type="number" placeholder="Plocha m²" className="h-11 rounded-lg border-2" value={bookingData.plocha_koberec || ''} onChange={e => setBookingData({ ...bookingData, plocha_koberec: Number(e.target.value) })} />
                                    </div>
                                  )}

                                  {bookingData.sedacka && (
                                    <div className="space-y-3 p-3 bg-background rounded-xl border-2 border-primary/10 animate-in slide-in-from-left-2 duration-200">
                                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sedačka velikost</Label>
                                      <Select value={bookingData.velikost_sedacka} onValueChange={v => setBookingData({ ...bookingData, velikost_sedacka: v })}>
                                        <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue placeholder="Velikost" /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="2-místná">2-místná</SelectItem>
                                          <SelectItem value="3-místná">3-místná</SelectItem>
                                          <SelectItem value="4-místná">4-místná</SelectItem>
                                          <SelectItem value="L-tvar">L-tvar</SelectItem>
                                          <SelectItem value="U-tvar">U-tvar</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  )}
                                </section>}
                              </div>
                            )}
                          </section>
                        )}

                        {/* Step 5: DateTime & Address */}
                        {cleaningStep === 5 && (
                          <section className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold uppercase tracking-wide text-primary/80">Preferovaný termín úklidu</Label>
                              <DateTimeRow
                                date={bookingData.date ? new Date(bookingData.date) : undefined}
                                time={bookingData.time}
                                onDateChange={(date) => setBookingData({ ...bookingData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                onTimeChange={(time) => setBookingData({ ...bookingData, time })}
                                disabledDates={(date) => {
                                  const minDate = new Date();
                                  minDate.setDate(minDate.getDate() + 2); // block today and tomorrow
                                  minDate.setHours(0, 0, 0, 0);
                                  return date < minDate;
                                }}
                                singleRow={false}
                              />
                            </div>

                            <div className="space-y-3">
                              <Label className="text-sm font-semibold text-primary/80 uppercase tracking-wide">Lokalita úklidu</Label>
                              <div className="space-y-3">
                                <div className="space-y-1.5">
                                  <Label htmlFor="street" className="text-xs">Ulice a číslo popisné</Label>
                                  {isGoogleMapsLoaded ? (
                                    <Autocomplete
                                      onLoad={(autocomplete) => {
                                        autocompleteRef.current = autocomplete;
                                      }}
                                      onPlaceChanged={handlePlaceChanged}
                                      options={{
                                        componentRestrictions: { country: 'cz' },
                                        types: ['address'],
                                        fields: ["address_components", "formatted_address", "geometry", "name"]
                                      }}
                                    >
                                      <Input
                                        id="street"
                                        placeholder="Začněte psát adresu..."
                                        className="h-12 bg-background border-2"
                                        value={bookingData.street}
                                        onChange={e => setBookingData({ ...bookingData, street: e.target.value })}
                                      />
                                    </Autocomplete>
                                  ) : (
                                    <Input
                                      id="street"
                                      placeholder="např. Hlavní 123"
                                      className="h-12 bg-background border-2"
                                      value={bookingData.street}
                                      onChange={e => setBookingData({ ...bookingData, street: e.target.value })}
                                    />
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="city" className="text-xs">Město</Label>
                                    <Input
                                      id="city"
                                      placeholder="Praha"
                                      className="h-12 bg-background border-2"
                                      value={bookingData.city}
                                      onChange={e => setBookingData({ ...bookingData, city: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="postal_code" className="text-xs">PSČ</Label>
                                    <Input
                                      id="postal_code"
                                      placeholder="110 00"
                                      className="h-12 bg-background border-2"
                                      value={bookingData.postal_code}
                                      onChange={e => setBookingData({ ...bookingData, postal_code: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isPublicBooking && !user && (
                              <div className="space-y-4 pt-4 border-t border-primary/10">
                                <Label className="text-sm font-bold text-primary/80 uppercase tracking-wider">Vaše kontaktní údaje</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="guestName" className="text-xs">Celé jméno</Label>
                                    <Input
                                      id="guestName"
                                      placeholder="Jan Novák"
                                      className="h-11 border-2"
                                      value={bookingData.guestName}
                                      onChange={e => setBookingData({ ...bookingData, guestName: e.target.value })}
                                      required={isPublicBooking}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="guestPhone" className="text-xs">Telefon</Label>
                                    <Input
                                      id="guestPhone"
                                      placeholder="+420 777 666 555"
                                      className="h-11 border-2"
                                      value={bookingData.guestPhone}
                                      onChange={e => setBookingData({ ...bookingData, guestPhone: e.target.value })}
                                      required={isPublicBooking}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="guestEmail" className="text-xs">Emailová adresa</Label>
                                  <Input
                                    id="guestEmail"
                                    type="email"
                                    placeholder="jan@email.cz"
                                    className="h-11 border-2"
                                    value={bookingData.guestEmail}
                                    onChange={e => setBookingData({ ...bookingData, guestEmail: e.target.value })}
                                    required={isPublicBooking}
                                  />
                                  <p className="text-[10px] text-muted-foreground italic px-1">
                                    * Na tento email vám zašleme potvrzení rezervace.
                                  </p>
                                </div>
                              </div>
                            )}
                          </section>
                        )}

                        {/* Step 6: Summary & Notes */}
                        {cleaningStep === 6 && (
                          <section className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-primary/5 rounded-2xl border-2 border-primary/10 p-5 space-y-4">
                              <div className="flex items-center gap-2 mb-2 border-b border-primary/10 pb-2">
                                <Check className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-sm uppercase tracking-wider">Shrnutí vašeho výběru</h3>
                              </div>

                              <div className="grid grid-cols-1 gap-y-3.5 text-xs">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Služba:</span>
                                  <div className="font-bold text-sm text-right">
                                    {bookingData.cleaning_type === 'osobni' ? 'Osobní úklid' : 'Firemní úklid'} ({bookingData.plocha_m2} m²)
                                  </div>
                                </div>

                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Termín:</span>
                                  <div className="font-bold text-sm text-right">
                                    {bookingData.date ? format(new Date(bookingData.date), "d. MMM yyyy", { locale: cs }) : 'Neurčeno'} v {bookingData.time || 'Neurčeno'}
                                  </div>
                                </div>

                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Lokalita:</span>
                                  <div className="font-bold text-sm text-right">
                                    {bookingData.street ? `${bookingData.street}, ${bookingData.city} ${bookingData.postal_code}` : 'Neurčeno'}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/5">
                                  <div className="flex flex-col gap-1">
                                    <span className="text-muted-foreground uppercase tracking-tighter font-semibold text-[10px]">Znečištění:</span>
                                    <div className="font-bold uppercase tracking-wider text-[11px]">
                                      {bookingData.znecisteni === 'nizka' ? 'Nízké' : bookingData.znecisteni === 'stredni' ? 'Střední' : 'Vysoké'}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-1 text-right">
                                    <span className="text-muted-foreground uppercase tracking-tighter font-semibold text-[10px]">Frekvence:</span>
                                    <div className="font-bold uppercase tracking-wider text-[11px]">
                                      {bookingData.frekvence === 'jednorazove' ? 'Jednorázově' :
                                        bookingData.frekvence === 'mesicne' ? 'Měsíčně' :
                                          bookingData.frekvence === 'ctyrtydne' ? 'Každé 2 týdny' : 'Týdně'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center gap-4 pt-2 border-t border-primary/5">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold text-[10px] shrink-0">Vybavení:</span>
                                  <div className="font-bold text-right text-[11px]">
                                    {bookingData.equipment_option === 'with' ? 'Mám vlastní (0 Kč)' : 'Přivezete vlastní (+290 Kč)'}
                                  </div>
                                </div>
                              </div>

                              {bookingData.doplnky_home.length > 0 && (
                                <div className="pt-3 border-t border-primary/10">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-extrabold">Doplňkové služby:</span>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {bookingData.doplnky_home.map(id => {
                                      const svc = [
                                        { id: 'window_cleaning', title: 'Mytí oken' },
                                        { id: 'upholstery_cleaning', title: 'Čištění čalounění' },
                                        { id: 'fridge_clean', title: 'Lednice' },
                                        { id: 'oven_clean', title: 'Trouba' }
                                      ].find(s => s.id === id);
                                      return (
                                        <span key={id} className="inline-flex items-center px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tight border border-primary/5">
                                          {svc?.title || id}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 ml-1">
                                <Sparkles className="h-3 w-3 text-primary/60" />
                                Poznámka k úklidu (nepovinné)
                              </Label>
                              <Textarea
                                placeholder="Máte nějaké speciální přání nebo instrukce pro náš tým?"
                                className="min-h-[80px] bg-background border-2 border-primary/10 focus:border-primary/30 transition-all resize-none rounded-2xl p-4 text-sm"
                                value={bookingData.notes}
                                onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                              />
                            </div>

                            {/* Orientační Kalkulace */}
                            <div className="bg-[#059669]/5 rounded-2xl border-2 border-[#059669]/20 p-5 space-y-4 shadow-sm">
                              <div className="flex items-center gap-3 pb-3 border-b border-[#059669]/10">
                                <div className="p-2 rounded-xl bg-[#059669]/10">
                                  <Calculator className="h-5 w-5 text-[#059669]" />
                                </div>
                                <h3 className="font-black text-[#059669] uppercase tracking-wider text-sm">Orientační kalkulace</h3>
                              </div>

                              <div className="space-y-3">
                                {/* Price Breakdown */}
                                <div className="space-y-3.5 text-xs">
                                  <div className="flex justify-between items-baseline gap-4 flex-nowrap">
                                    <span className="text-muted-foreground shrink-0 font-bold">Základní úklid:</span>
                                    <span className="font-black text-foreground text-right whitespace-nowrap">
                                      {(priceEstimate.priceMin - (bookingData.equipment_option === 'without' ? 290 : 0)).toLocaleString()} – {(priceEstimate.priceMax - (bookingData.equipment_option === 'without' ? 290 : 0)).toLocaleString()} Kč
                                    </span>
                                  </div>
                                  {bookingData.equipment_option === 'without' && (
                                    <div className="flex justify-between items-baseline gap-4 flex-nowrap">
                                      <span className="text-muted-foreground shrink-0 font-bold">Vlastní vybavení a chemie:</span>
                                      <span className="font-black text-foreground text-right whitespace-nowrap">+290 Kč</span>
                                    </div>
                                  )}
                                  {priceEstimate.discountPercent > 0 && (
                                    <div className="flex justify-between items-baseline gap-4 flex-nowrap">
                                      <span className="text-[#059669] shrink-0 font-bold">Věrnostní sleva za frekvenci:</span>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-black bg-[#059669] text-white px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap">
                                          -{Math.round(priceEstimate.discountPercent)}%
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t-2 border-dashed border-[#059669]/10 flex flex-col gap-3">
                                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 w-full">
                                    <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Doprava:</span>
                                    <span className="font-black text-foreground text-right text-[10px] uppercase">V ceně</span>
                                  </div>

                                  <div className="grid grid-cols-[auto_1fr] items-center gap-4 w-full mt-1 pb-2">
                                    <span className="text-sm font-black uppercase tracking-tight text-[#059669]">Celkem:</span>
                                    <span className="text-2xl sm:text-3xl font-black text-[#059669] tracking-tighter text-right justify-self-end">
                                      {priceEstimate.priceMin.toLocaleString()} – {priceEstimate.priceMax.toLocaleString()} Kč
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground/60 text-center leading-normal mt-2 font-medium">
                                    *Konečná cena bude upřesněna po tel. dohodě, kde vytvoříme plán úkolů - Na míru pro Váš prostor.
                                  </p>
                                </div>

                                <div className="flex items-start space-x-3 pt-2 px-1">
                                  <div className="flex items-center h-5">
                                    <input
                                      id="gdpr-consent-cleaning"
                                      type="checkbox"
                                      checked={gdprConsent}
                                      onChange={(e) => setGdprConsent(e.target.checked)}
                                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer shrink-0"
                                    />
                                  </div>
                                  <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor="gdpr-consent-cleaning"
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                                    >
                                      Souhlasím se <Link to="/vop" state={{ from: 'booking' }} className="text-primary hover:underline">Všeobecnými obchodními podmínkami</Link> a <Link to="/zasady-ochrany-osobnich-udaju" state={{ from: 'booking' }} className="text-primary hover:underline">Zásadami ochrany osobních údajů</Link>.
                                    </label>

                                  </div>
                                </div>
                              </div>
                            </div>

                          </section>
                        )}
                      </BookingStepContainer>
                    </div>
                  )}

                  {/* Legacy Single-Page Forms (Windows & Upholstery) */}
                  {/* Multi-step Window Cleaning Form */}
                  {service.id === 'window_cleaning' && (
                    <div ref={el => { formRefs.current['window_cleaning'] = el; }}>
                      <BookingStepContainer
                        currentStep={windowStep}
                        totalSteps={4}
                        isSolo={isSolo}
                        title={
                          windowStep === 1 ? "Zadejte parametry oken" :
                            windowStep === 2 ? "Upřesněte detaily mytí" :
                              windowStep === 3 ? "Kdy a kam máme dorazit?" :
                                "Shrnutí vaší poptávky"
                        }
                        onNext={() => {
                          if (windowStep === 4) {
                            handleBooking();
                          } else {
                            setWindowStep(prev => prev + 1);
                            scrollToService('window_cleaning');
                          }
                        }}
                        onBack={() => {
                          setWindowStep(prev => prev - 1);
                          scrollToService('window_cleaning');
                        }}
                        isLastStep={windowStep === 4}
                        isNextDisabled={
                          (windowStep === 1 && !bookingData.pocet_oken) ||
                          (windowStep === 2 && (!bookingData.znecisteni_okna || !bookingData.typ_objektu_okna)) ||
                          (windowStep === 3 && (!bookingData.date || !bookingData.time || !bookingData.street || !bookingData.city || !bookingData.postal_code)) ||
                          (windowStep === 4 && !gdprConsent)
                        }
                        mediaSlot={
                          (windowStep === 1 || windowStep === 2 || windowStep === 3 || windowStep === 4) ? (
                            <div className="flex items-center justify-center w-full h-full p-8">
                              <img
                                src={
                                  windowStep === 1 ? windowCleaningStep1Image :
                                    windowStep === 2 ? windowCleaningStep2Image :
                                      windowStep === 3 ? windowCleaningStep3Image :
                                        cleaningStep6Image
                                }
                                alt="Ilustrace mytí oken"
                                className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in-50 duration-500"
                              />
                            </div>
                          ) : undefined
                        }
                      >
                        {/* Step 1: Parameters */}
                        {windowStep === 1 && (
                          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                              <Label className="text-sm font-bold text-primary/80 uppercase tracking-wider flex items-center gap-2">
                                <Calculator className="h-4 w-4" />
                                Plocha oken (m²)
                              </Label>
                              <div className="relative group">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  max="500"
                                  placeholder="Např. 15"
                                  className="h-14 rounded-2xl bg-background border-2 border-primary/10 group-hover:border-primary/30 focus:border-primary transition-all text-lg font-bold pl-4"
                                  value={bookingData.pocet_oken || ''}
                                  onChange={e => setBookingData({
                                    ...bookingData,
                                    pocet_oken: Number(e.target.value) || 0
                                  })}
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">m²</div>
                              </div>
                              <p className="text-xs text-muted-foreground italic px-1">
                                * Uveďte přibližnou celkovou plochu oken k mytí (jedné strany).
                              </p>
                            </div>
                          </section>
                        )}

                        {/* Step 2: Details */}
                        {windowStep === 2 && (
                          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold">Úroveň znečištění</Label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { id: 'nizke', label: 'Nízké' },
                                  { id: 'stredni', label: 'Střední' },
                                  { id: 'vysoke', label: 'Vysoké' }
                                ].map((level) => (
                                  <div
                                    key={level.id}
                                    className={cn(
                                      "p-3 rounded-xl border-2 text-center cursor-pointer transition-all",
                                      bookingData.znecisteni_okna === level.id
                                        ? "border-primary bg-primary/10 font-bold"
                                        : "border-border hover:border-primary/30"
                                    )}
                                    onClick={() => setBookingData({ ...bookingData, znecisteni_okna: level.id as any })}
                                  >
                                    <span className="text-xs uppercase tracking-wider">
                                      {level.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <Label className="text-sm font-bold text-primary/80 uppercase tracking-wider">Typ objektu</Label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { id: 'byt', label: 'Byt / Dům', icon: Home },
                                  { id: 'kancelar', label: 'Firma', icon: Building2 }
                                ].map((type) => (
                                  <Card
                                    key={type.id}
                                    className={cn(
                                      "cursor-pointer transition-all border-2",
                                      bookingData.typ_objektu_okna === type.id ? "border-primary bg-primary/5 shadow-md" : "hover:border-primary/30"
                                    )}
                                    onClick={() => setBookingData({ ...bookingData, typ_objektu_okna: type.id as any })}
                                  >
                                    <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                                      <type.icon className={cn("h-6 w-6", bookingData.typ_objektu_okna === type.id ? "text-primary" : "text-muted-foreground")} />
                                      <div className="font-bold text-sm">{type.label}</div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}

                        {/* Step 3: Date & Location */}
                        {windowStep === 3 && (
                          <section className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-3">
                              <Label className="text-sm font-semibold uppercase tracking-wide text-primary/80">Preferovaný termín úklidu</Label>
                              <DateTimeRow
                                date={bookingData.date ? new Date(bookingData.date) : undefined}
                                time={bookingData.time}
                                onDateChange={(date) => setBookingData({
                                  ...bookingData,
                                  date: date ? format(date, 'yyyy-MM-dd') : ''
                                })}
                                onTimeChange={(time) => setBookingData({
                                  ...bookingData,
                                  time
                                })}
                                disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                singleRow={false}
                              />
                            </div>

                            <div className="space-y-4">
                              <Label className="text-sm font-bold text-primary/80 uppercase tracking-wider flex items-center gap-2">
                                Lokalita
                              </Label>
                              <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="win-street" className="text-xs uppercase font-bold text-muted-foreground ml-1">Ulice a číslo popisné</Label>
                                  {isGoogleMapsLoaded ? (
                                    <Autocomplete
                                      onLoad={(autocomplete) => {
                                        autocompleteRef.current = autocomplete;
                                      }}
                                      onPlaceChanged={handlePlaceChanged}
                                      options={{
                                        componentRestrictions: { country: 'cz' },
                                        types: ['address'],
                                        fields: ["address_components", "formatted_address", "geometry", "name"]
                                      }}
                                    >
                                      <Input
                                        id="win-street"
                                        placeholder="Začněte psát adresu..."
                                        className="h-12 rounded-xl bg-background border-2 border-primary/10 focus:border-primary"
                                        value={bookingData.street}
                                        onChange={e => setBookingData({ ...bookingData, street: e.target.value })}
                                      />
                                    </Autocomplete>
                                  ) : (
                                    <Input
                                      id="win-street"
                                      placeholder="např. Hlavní 123"
                                      className="h-12 rounded-xl bg-background border-2 border-primary/10 focus:border-primary"
                                      value={bookingData.street}
                                      onChange={e => setBookingData({ ...bookingData, street: e.target.value })}
                                    />
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="win-city" className="text-xs uppercase font-bold text-muted-foreground ml-1">Město</Label>
                                    <Input
                                      id="win-city"
                                      placeholder="např. Praha"
                                      className="h-12 rounded-xl bg-background border-2 border-primary/10 focus:border-primary"
                                      value={bookingData.city}
                                      onChange={e => setBookingData({ ...bookingData, city: e.target.value })}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="win-psc" className="text-xs uppercase font-bold text-muted-foreground ml-1">PSČ</Label>
                                    <Input
                                      id="win-psc"
                                      placeholder="110 00"
                                      className="h-12 rounded-xl bg-background border-2 border-primary/10 focus:border-primary"
                                      value={bookingData.postal_code}
                                      onChange={e => setBookingData({ ...bookingData, postal_code: e.target.value })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isPublicBooking && !user && (
                              <div className="space-y-4 pt-4 border-t border-primary/10">
                                <Label className="text-sm font-bold text-primary/80 uppercase tracking-wider">Vaše kontaktní údaje</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="win-guestName" className="text-xs">Celé jméno</Label>
                                    <Input
                                      id="win-guestName"
                                      placeholder="Jan Novák"
                                      className="h-11 border-2"
                                      value={bookingData.guestName}
                                      onChange={e => setBookingData({ ...bookingData, guestName: e.target.value })}
                                      required={isPublicBooking}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="win-guestPhone" className="text-xs">Telefon</Label>
                                    <Input
                                      id="win-guestPhone"
                                      placeholder="+420 777 666 555"
                                      className="h-11 border-2"
                                      value={bookingData.guestPhone}
                                      onChange={e => setBookingData({ ...bookingData, guestPhone: e.target.value })}
                                      required={isPublicBooking}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="win-guestEmail" className="text-xs">Emailová adresa</Label>
                                  <Input
                                    id="win-guestEmail"
                                    type="email"
                                    placeholder="jan@email.cz"
                                    className="h-11 border-2"
                                    value={bookingData.guestEmail}
                                    onChange={e => setBookingData({ ...bookingData, guestEmail: e.target.value })}
                                    required={isPublicBooking}
                                  />
                                </div>
                              </div>
                            )}
                          </section>
                        )}

                        {/* Step 4: Summary & Price */}
                        {windowStep === 4 && (
                          <section className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-primary/5 rounded-2xl border-2 border-primary/10 p-5 space-y-4">
                              <div className="flex items-center gap-2 mb-2 border-b border-primary/10 pb-2">
                                <Check className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-sm uppercase tracking-wider">Shrnutí vašeho výběru</h3>
                              </div>

                              <div className="grid grid-cols-1 gap-y-3.5 text-xs">
                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Služba:</span>
                                  <div className="font-bold text-sm text-right">Mytí oken ({bookingData.pocet_oken} m²)</div>
                                </div>

                                <div className="flex justify-between items-start gap-4">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Parametry:</span>
                                  <div className="font-bold text-sm text-right">
                                    {bookingData.znecisteni_okna === 'nizke' ? 'Nízké' : bookingData.znecisteni_okna === 'stredni' ? 'Střední' : 'Vysoké'} znečištění, {bookingData.typ_objektu_okna === 'byt' ? 'Byt/Dům' : 'Firma'}
                                  </div>
                                </div>

                                <div className="flex justify-between items-start gap-4 border-t border-primary/5 pt-2">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Termín:</span>
                                  <div className="font-bold text-sm text-right">
                                    {bookingData.date ? format(new Date(bookingData.date), "d. MMM yyyy", { locale: cs }) : '-'} v {bookingData.time}
                                  </div>
                                </div>

                                <div className="flex justify-between items-start gap-4 border-t border-primary/5 pt-2">
                                  <span className="text-muted-foreground uppercase tracking-tighter font-semibold shrink-0">Lokalita:</span>
                                  <div className="font-bold text-[11px] text-right">
                                    {bookingData.street}, {bookingData.city} {bookingData.postal_code}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2 ml-1">
                                <Sparkles className="h-3 w-3 text-primary/60" />
                                Poznámka k úklidu (nepovinné)
                              </Label>
                              <Textarea
                                placeholder="Máte nějaké speciální přání?"
                                className="min-h-[80px] bg-background border-2 border-primary/10 focus:border-primary/30 transition-all resize-none rounded-2xl p-4 text-sm"
                                value={bookingData.notes}
                                onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                              />
                            </div>

                            {/* Orientační Kalkulace */}
                            <div className="bg-[#059669]/5 rounded-2xl border-2 border-[#059669]/20 p-5 space-y-4 shadow-sm">
                              <div className="flex items-center gap-3 pb-3 border-b border-[#059669]/10">
                                <div className="p-2 rounded-xl bg-[#059669]/10">
                                  <Calculator className="h-5 w-5 text-[#059669]" />
                                </div>
                                <h3 className="font-black text-[#059669] uppercase tracking-wider text-sm">Orientační kalkulace</h3>
                              </div>

                              <div className="space-y-3">
                                <div className="pt-2 flex flex-col gap-3">
                                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 w-full">
                                    <span className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider">Doprava:</span>
                                    <span className="font-black text-foreground text-right text-[10px] uppercase">V ceně</span>
                                  </div>

                                  <div className="grid grid-cols-[auto_1fr] items-center gap-4 w-full mt-1 pb-2">
                                    <span className="text-sm font-black uppercase tracking-tight text-[#059669]">Celkem:</span>
                                    <span className="text-2xl sm:text-3xl font-black text-[#059669] tracking-tighter text-right justify-self-end">
                                      {priceEstimate.priceMin.toLocaleString()} – {priceEstimate.priceMax.toLocaleString()} Kč
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground/60 text-center leading-normal mt-2 font-medium">
                                    *Konečná cena bude upřesněna po tel. dohodě, kde vytvoříme plán úkolů - Na míru pro Váš prostor.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start space-x-3 pt-2 px-1">
                              <div className="flex items-center h-5">
                                <input
                                  id="gdpr-consent-window"
                                  type="checkbox"
                                  checked={gdprConsent}
                                  onChange={(e) => setGdprConsent(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer shrink-0"
                                />
                              </div>
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor="gdpr-consent-window"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                                >
                                  Souhlasím se <Link to="/vop" state={{ from: 'booking' }} className="text-primary hover:underline">Všeobecnými obchodními podmínkami</Link> a <Link to="/zasady-ochrany-osobnich-udaju" state={{ from: 'booking' }} className="text-primary hover:underline">Zásadami ochrany osobních údajů</Link>.
                                </label>
                              </div>
                            </div>
                          </section>
                        )}
                      </BookingStepContainer>
                    </div>
                  )}

                  {/* Multi-step Upholstery Cleaning Form */}
                  {service.id === 'upholstery_cleaning' && (
                    <div ref={el => { formRefs.current['upholstery_cleaning'] = el; }}>
                      <BookingStepContainer
                        currentStep={upholsteryStep}
                        totalSteps={4}
                        isSolo={isSolo}
                        title={
                          upholsteryStep === 1 ? "Co potřebujete vyčistit?" :
                            upholsteryStep === 2 ? "Detailní parametry" :
                              upholsteryStep === 3 ? "Kdy a kam máme dorazit?" :
                                "Shrnutí Vaší poptávky"
                        }
                        onNext={() => {
                          if (upholsteryStep === 4) {
                            handleBooking();
                          } else {
                            setUpholsteryStep(prev => prev + 1);
                            scrollToService('upholstery_cleaning');
                          }
                        }}
                        onBack={() => {
                          setUpholsteryStep(prev => prev - 1);
                          scrollToService('upholstery_cleaning');
                        }}
                        isLastStep={upholsteryStep === 4}
                        isNextDisabled={
                          (upholsteryStep === 1 && !bookingData.koberce && !bookingData.sedacka && !bookingData.matrace && !bookingData.kresla && !bookingData.zidle) ||
                          (upholsteryStep === 2 && (
                            (bookingData.koberce && (!bookingData.plocha_koberec || !bookingData.typ_koberec || !bookingData.znecisteni_koberec)) ||
                            (bookingData.sedacka && (!bookingData.velikost_sedacka || !bookingData.znecisteni_sedacka)) ||
                            (bookingData.matrace && (!bookingData.velikost_matrace || !bookingData.strany_matrace || !bookingData.znecisteni_matrace)) ||
                            (bookingData.kresla && (!bookingData.pocet_kresla || !bookingData.znecisteni_kresla)) ||
                            (bookingData.zidle && (!bookingData.pocet_zidle || !bookingData.znecisteni_zidle))
                          )) ||
                          (upholsteryStep === 3 && (!bookingData.date || !bookingData.time || !bookingData.street || !bookingData.city || !bookingData.postal_code)) ||
                          (upholsteryStep === 4 && (priceEstimate.upholsteryBelowMinimum || !gdprConsent))
                        }
                        mediaSlot={
                          upholsteryStep === 1 ? (
                            <div className="flex items-center justify-center w-full h-full p-8">
                              <img
                                src={upholsteryStep1Image}
                                alt="Výběr čalounění"
                                className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in-50 duration-500"
                              />
                            </div>
                          ) : upholsteryStep === 2 ? (
                            <div className="flex items-center justify-center w-full h-full p-8">
                              <img
                                src={upholsteryStep2Image}
                                alt="Detailní parametry čalounění"
                                className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in-50 duration-500"
                              />
                            </div>
                          ) : upholsteryStep === 3 ? (
                            <div className="flex items-center justify-center w-full h-full p-8">
                              <img
                                src={windowCleaningStep3Image}
                                alt="Termín a lokalita"
                                className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in-50 duration-500"
                              />
                            </div>
                          ) : upholsteryStep === 4 ? (
                            <div className="flex items-center justify-center w-full h-full p-8">
                              <img
                                src={cleaningStep6Image}
                                alt="Shrnutí rezervace"
                                className="w-full h-full object-contain drop-shadow-xl animate-in zoom-in-50 duration-500"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full p-8 bg-muted/30">
                              {/* Placeholder for Upholstery Media */}
                              <div className="flex flex-col items-center gap-3 opacity-50">
                                <Sofa className="w-16 h-16 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Vizualizace {upholsteryStep}/4</span>
                              </div>
                            </div>
                          )
                        }
                      >
                        {/* Step 1: Selection */}
                        {upholsteryStep === 1 && (
                          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-700 animate-in fade-in zoom-in-95 duration-300">
                              <Info className="h-4 w-4 shrink-0" />
                              <span>Můžete zakliknout více položek</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { id: 'koberce', label: 'Koberce', icon: LayoutGrid },
                                { id: 'sedacka', label: 'Sedačka', icon: Sofa },
                                { id: 'matrace', label: 'Matrace', icon: BedDouble },
                                { id: 'kresla', label: 'Křesla', icon: Armchair },
                                { id: 'zidle', label: 'Židle', icon: RockingChair },
                              ].map((item) => {
                                const isSelected = bookingData[item.id as keyof BookingData] as boolean;
                                return (
                                  <Card
                                    key={item.id}
                                    className={cn(
                                      "cursor-pointer transition-all border-2 hover:border-primary/50 group",
                                      isSelected ? "border-primary bg-primary/5 shadow-md" : "bg-card"
                                    )}
                                    onClick={() => setBookingData({ ...bookingData, [item.id]: !isSelected })}
                                  >
                                    <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
                                      <div className={cn(
                                        "p-3 rounded-xl transition-colors",
                                        isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                                      )}>
                                        <item.icon className="h-6 w-6" />
                                      </div>
                                      <div className="font-bold text-sm">{item.label}</div>
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all absolute top-3 right-3",
                                        isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                                      )}>
                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </section>
                        )}

                        {/* Step 2: Details */}
                        {upholsteryStep === 2 && (
                          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {bookingData.koberce && (
                              <div className="bg-card border-2 rounded-xl p-4 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                  <LayoutGrid className="h-5 w-5 text-primary" />
                                  <h3 className="font-bold">Koberce</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Typ koberce</Label>
                                    <Select value={bookingData.typ_koberec} onValueChange={v => setBookingData({ ...bookingData, typ_koberec: v })}>
                                      <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Kusový">Kusový</SelectItem>
                                        <SelectItem value="Pokládkový – krátký vlas">Pokládkový – krátký vlas</SelectItem>
                                        <SelectItem value="Pokládkový – dlouhý vlas">Pokládkový – dlouhý vlas</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs uppercase font-bold text-muted-foreground">Plocha (m²)</Label>
                                      <Input type="number" min="1" className="h-11 rounded-lg border-2" value={bookingData.plocha_koberec || ''} onChange={e => setBookingData({ ...bookingData, plocha_koberec: Number(e.target.value) || 0 })} />
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs uppercase font-bold text-muted-foreground">Znečištění</Label>
                                      <Select value={bookingData.znecisteni_koberec} onValueChange={v => setBookingData({ ...bookingData, znecisteni_koberec: v })}>
                                        <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Nízké">Nízké</SelectItem>
                                          <SelectItem value="Střední">Střední</SelectItem>
                                          <SelectItem value="Vysoké">Vysoké</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bookingData.sedacka && (
                              <div className="bg-card border-2 rounded-xl p-4 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                  <Sofa className="h-5 w-5 text-primary" />
                                  <h3 className="font-bold">Sedačka</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Velikost</Label>
                                    <Select value={bookingData.velikost_sedacka} onValueChange={v => setBookingData({ ...bookingData, velikost_sedacka: v })}>
                                      <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="2-místná">2-místná</SelectItem>
                                        <SelectItem value="3-místná">3-místná</SelectItem>
                                        <SelectItem value="4-místná">4-místná</SelectItem>
                                        <SelectItem value="5-místná">5-místná</SelectItem>
                                        <SelectItem value="6-místná">6-místná</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Znečištění</Label>
                                    <Select value={bookingData.znecisteni_sedacka} onValueChange={v => setBookingData({ ...bookingData, znecisteni_sedacka: v })}>
                                      <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Nízké">Nízké</SelectItem>
                                        <SelectItem value="Střední">Střední</SelectItem>
                                        <SelectItem value="Vysoké">Vysoké</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bookingData.matrace && (
                              <div className="bg-card border-2 rounded-xl p-4 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                  <BedDouble className="h-5 w-5 text-primary" />
                                  <h3 className="font-bold">Matrace</h3>
                                </div>
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label className="text-xs uppercase font-bold text-muted-foreground">Velikost</Label>
                                      <Select value={bookingData.velikost_matrace} onValueChange={v => setBookingData({ ...bookingData, velikost_matrace: v })}>
                                        <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="90">90 cm</SelectItem>
                                          <SelectItem value="140">140 cm</SelectItem>
                                          <SelectItem value="160">160 cm</SelectItem>
                                          <SelectItem value="180">180 cm</SelectItem>
                                          <SelectItem value="200">200 cm</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label className="text-xs uppercase font-bold text-muted-foreground">Strany</Label>
                                      <Select value={bookingData.strany_matrace} onValueChange={v => setBookingData({ ...bookingData, strany_matrace: v })}>
                                        <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1 strana">1 strana</SelectItem>
                                          <SelectItem value="obě strany">Obě strany</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Znečištění</Label>
                                    <Select value={bookingData.znecisteni_matrace} onValueChange={v => setBookingData({ ...bookingData, znecisteni_matrace: v })}>
                                      <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Nízké">Nízké</SelectItem>
                                        <SelectItem value="Střední">Střední</SelectItem>
                                        <SelectItem value="Vysoké">Vysoké</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bookingData.kresla && (
                              <div className="bg-card border-2 rounded-xl p-4 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                  <Armchair className="h-5 w-5 text-primary" />
                                  <h3 className="font-bold">Křesla</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Počet kusů</Label>
                                    <Input type="number" min="1" className="h-11 rounded-lg border-2" value={bookingData.pocet_kresla || ''} onChange={e => setBookingData({ ...bookingData, pocet_kresla: Number(e.target.value) || 0 })} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Znečištění</Label>
                                    <Select value={bookingData.znecisteni_kresla} onValueChange={v => setBookingData({ ...bookingData, znecisteni_kresla: v })}>
                                      <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Nízké">Nízké</SelectItem>
                                        <SelectItem value="Střední">Střední</SelectItem>
                                        <SelectItem value="Vysoké">Vysoké</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}

                            {bookingData.zidle && (
                              <div className="bg-card border-2 rounded-xl p-4 space-y-4 shadow-sm animate-in slide-in-from-bottom-2">
                                <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                  <Layers className="h-5 w-5 text-primary" />
                                  <h3 className="font-bold">Židle</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Počet kusů</Label>
                                    <Input type="number" min="1" className="h-11 rounded-lg border-2" value={bookingData.pocet_zidle || ''} onChange={e => setBookingData({ ...bookingData, pocet_zidle: Number(e.target.value) || 0 })} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground">Znečištění</Label>
                                    <Select value={bookingData.znecisteni_zidle} onValueChange={v => setBookingData({ ...bookingData, znecisteni_zidle: v })}>
                                      <SelectTrigger className="h-11 rounded-lg border-2"><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Nízké">Nízké</SelectItem>
                                        <SelectItem value="Střední">Střední</SelectItem>
                                        <SelectItem value="Vysoké">Vysoké</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            )}
                          </section>
                        )}
                        {/* Step 3: Date & Location */}
                        {upholsteryStep === 3 && (
                          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                              <Label className="text-sm font-semibold">PREFEROVANÝ TERMÍN ÚKLIDU</Label>
                              <DateTimeRow
                                date={bookingData.date ? new Date(bookingData.date) : undefined}
                                time={bookingData.time}
                                onDateChange={(date) => setBookingData({ ...bookingData, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                onTimeChange={(time) => setBookingData({ ...bookingData, time })}
                                disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                singleRow={false}
                              />
                            </div>

                            <div className="space-y-4">
                              <Label className="text-sm font-semibold text-primary/80 uppercase tracking-wide">Lokalita úklidu</Label>
                              <div className="space-y-3">
                                {isGoogleMapsLoaded ? (
                                  <Autocomplete
                                    onLoad={(autocomplete) => {
                                      autocompleteRef.current = autocomplete;
                                    }}
                                    onPlaceChanged={handlePlaceChanged}
                                    options={{
                                      componentRestrictions: { country: 'cz' },
                                      types: ['address'],
                                      fields: ["address_components", "formatted_address", "geometry", "name"]
                                    }}
                                  >
                                    <Input placeholder="Začněte psát adresu..." value={bookingData.street} onChange={e => setBookingData({ ...bookingData, street: e.target.value })} required className="h-11 rounded-lg border-2" />
                                  </Autocomplete>
                                ) : (
                                  <Input placeholder="Ulice a číslo popisné" value={bookingData.street} onChange={e => setBookingData({ ...bookingData, street: e.target.value })} required className="h-11 rounded-lg border-2" />
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                  <Input placeholder="Město" value={bookingData.city} onChange={e => setBookingData({ ...bookingData, city: e.target.value })} required className="h-11 rounded-lg border-2" />
                                  <Input placeholder="PSČ" value={bookingData.postal_code} onChange={e => setBookingData({ ...bookingData, postal_code: e.target.value })} required className="h-11 rounded-lg border-2" />
                                </div>
                              </div>
                            </div>

                            {isPublicBooking && !user && (
                              <div className="space-y-4 pt-4 border-t border-primary/10">
                                <Label className="text-sm font-bold text-primary/80 uppercase tracking-wider text-primary/80">Vaše kontaktní údaje</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <Label htmlFor="uph-guestName" className="text-xs font-semibold">Celé jméno</Label>
                                    <Input
                                      id="uph-guestName"
                                      placeholder="Jan Novák"
                                      className="h-11 border-2"
                                      value={bookingData.guestName}
                                      onChange={e => setBookingData({ ...bookingData, guestName: e.target.value })}
                                      required={isPublicBooking}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <Label htmlFor="uph-guestPhone" className="text-xs font-semibold">Telefon</Label>
                                    <Input
                                      id="uph-guestPhone"
                                      placeholder="+420 777 666 555"
                                      className="h-11 border-2"
                                      value={bookingData.guestPhone}
                                      onChange={e => setBookingData({ ...bookingData, guestPhone: e.target.value })}
                                      required={isPublicBooking}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor="uph-guestEmail" className="text-xs font-semibold">Emailová adresa</Label>
                                  <Input
                                    id="uph-guestEmail"
                                    type="email"
                                    placeholder="jan@email.cz"
                                    className="h-11 border-2"
                                    value={bookingData.guestEmail}
                                    onChange={e => setBookingData({ ...bookingData, guestEmail: e.target.value })}
                                    required={isPublicBooking}
                                  />
                                </div>
                              </div>
                            )}
                          </section>
                        )}

                        {/* Step 4: Summary */}
                        {upholsteryStep === 4 && (
                          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-6">
                              <div className="bg-card border-2 rounded-xl p-4 space-y-4">
                                <h3 className="font-bold text-lg mb-2">Vybrané služby</h3>
                                <div className="space-y-3">
                                  {bookingData.koberce && (
                                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                      <LayoutGrid className="h-5 w-5 text-primary mt-0.5" />
                                      <div>
                                        <div className="flex justify-between items-start w-full">
                                          <div className="font-medium">Koberce</div>
                                          <div className="text-sm font-bold text-emerald-600">
                                            {((priceEstimate as any).upholsteryCarpetPrice || 0).toLocaleString()} Kč
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {bookingData.typ_koberec}, {bookingData.plocha_koberec} m², {bookingData.znecisteni_koberec} znečištění
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {bookingData.sedacka && (
                                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                      <Sofa className="h-5 w-5 text-primary mt-0.5" />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <div className="font-medium">Sedačka</div>
                                          <div className="text-sm font-bold text-emerald-600">
                                            {((priceEstimate as any).upholsterySofaPrice || 0).toLocaleString()} Kč
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {bookingData.velikost_sedacka}, {bookingData.znecisteni_sedacka} znečištění
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {bookingData.matrace && (
                                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                      <BedDouble className="h-5 w-5 text-primary mt-0.5" />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <div className="font-medium">Matrace</div>
                                          <div className="text-sm font-bold text-emerald-600">
                                            {((priceEstimate as any).upholsteryMattressPrice || 0).toLocaleString()} Kč
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {bookingData.velikost_matrace}, {bookingData.strany_matrace}, {bookingData.znecisteni_matrace} znečištění
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {bookingData.kresla && (
                                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                      <Armchair className="h-5 w-5 text-primary mt-0.5" />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <div className="font-medium">Křesla</div>
                                          <div className="text-sm font-bold text-emerald-600">
                                            {((priceEstimate as any).upholsteryArmchairPrice || 0).toLocaleString()} Kč
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {bookingData.pocet_kresla} ks, {bookingData.znecisteni_kresla} znečištění
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  {bookingData.zidle && (
                                    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                      <RockingChair className="h-5 w-5 text-primary mt-0.5" />
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                          <div className="font-medium">Židle</div>
                                          <div className="text-sm font-bold text-emerald-600">
                                            {((priceEstimate as any).upholsteryChairPrice || 0).toLocaleString()} Kč
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {bookingData.pocet_zidle} ks, {bookingData.znecisteni_zidle} znečištění
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-emerald-200/50">
                                  <span className="text-sm font-medium text-emerald-900">Odhadovaná cena</span>
                                  <div className="text-left sm:text-right">
                                    <div className="text-3xl font-black text-emerald-600 tracking-tight">
                                      {priceEstimate.priceMin.toLocaleString()} – {priceEstimate.priceMax.toLocaleString()} Kč
                                    </div>
                                  </div>
                                </div>

                                {priceEstimate.upholsteryBelowMinimum && (
                                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-sm text-amber-800">
                                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                                    <p>
                                      Minimální hodnota objednávky je <span className="font-bold">{priceEstimate.upholsteryMinimumOrder} Kč</span>.
                                      Prosím přidejte další položky k čištění.
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-center justify-center gap-2 text-xs text-emerald-700/80 font-medium">
                                  <Info className="h-3.5 w-3.5" />
                                  <span>Konečná cena bude upřesněna po tel. dohodě, kde vytvoříme plán úkolů - Na míru pro Váš prostor.</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start space-x-3 pt-2 px-1">
                              <div className="flex items-center h-5">
                                <input
                                  id="gdpr-consent-upholstery"
                                  type="checkbox"
                                  checked={gdprConsent}
                                  onChange={(e) => setGdprConsent(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer shrink-0"
                                />
                              </div>
                              <div className="grid gap-1.5 leading-none">
                                <label
                                  htmlFor="gdpr-consent-upholstery"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                                >
                                  Souhlasím se <Link to="/vop" state={{ from: 'booking' }} className="text-primary hover:underline">Všeobecnými obchodními podmínkami</Link> a <Link to="/zasady-ochrany-osobnich-udaju" state={{ from: 'booking' }} className="text-primary hover:underline">Zásadami ochrany osobních údajů</Link>.
                                </label>
                              </div>
                            </div>
                          </section>
                        )}
                      </BookingStepContainer>
                    </div>
                  )
                  }
                </ServiceCard>
              </div>
            </div >
          );
        })}
    </div >

    {/* Support Section - Match width of service card when pre-selected */}
    {
      !isSolo && (
        <div className={cn(
          "rounded-xl bg-card border border-border p-4 space-y-3",
          preSelectedService ? "lg:max-w-3xl lg:mx-auto" : "lg:max-w-4xl lg:mx-auto"
        )}>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Potřebujete pomoct?</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Zavolejte nám a rádi vám pomůžeme s výběrem
          </p>
          <PremiumButton
            className="h-12 w-full"
            onClick={() => window.location.href = 'tel:+420777645610'}
          >
            <Phone className="h-4 w-4 mr-2" />
            Zavolat
          </PremiumButton>
        </div>
      )
    }

    {/* Success Dialog */}
    <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">🎉 Děkujeme za poptávku!</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 text-center py-4">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center ring-4 ring-success/20">
            <Check className="h-8 w-8 text-success" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-medium">
              Vaše poptávka byla úspěšně odeslána
            </p>
            <p className="text-sm text-muted-foreground">
              Ozveme se vám co nejdříve a doladíme všechny detaily.
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Kontaktujte nás
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="tel:+420777645610"
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium">+420 777 645 610</span>
              </a>
              <a
                href="mailto:uklid@drclean.cz"
                className="flex items-center justify-center gap-2 p-3 rounded-lg bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <Mail className="h-4 w-4 text-primary" />
                <span className="font-medium">uklid@drclean.cz</span>
              </a>
            </div>
          </div>
          <PremiumButton
            onClick={() => setShowSuccess(false)}
            className="w-full"
          >
            Rozumím
          </PremiumButton>
        </div>
      </DialogContent>
    </Dialog>
    {loading && <LoadingOverlay message="Vytvářím rezervaci..." />}
  </div >;
}