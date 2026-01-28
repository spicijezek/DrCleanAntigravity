import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Sparkles, Building2, AppWindow, Sofa, Construction, ChevronDown, Check, X, Phone, Mail, Droplet, Wind, Flame, Package, Shirt, Bed, Calculator, Info, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { kalkulujUklidDomacnosti400, kalkulujUklidFirmy, kalkulujMytiOken, kalkulujCalouneni, DirtinessLevel, FrequencyType, OfficeDirtinessLevel, OfficeFrequencyType, OfficeSpaceType, CleaningTimeType, WindowDirtinessLevel, WindowObjectType, UpholsteryCalculatorResult } from '@/lib/cleaningCalculator';
import { useIsMobile } from '@/hooks/use-mobile';
import { UpholsteryServiceSelector } from '@/components/booking/UpholsteryServiceSelector';
import { AlertTriangle } from 'lucide-react';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { ServiceCard } from '@/components/client/services/ServiceCard';
import { cn } from '@/lib/utils';
import { bookingDetailsSchema, bookingAddressSchema } from '@/lib/validationSchemas';
import { DateTimeRow } from '@/components/ui/date-time-picker';
import { LoadingOverlay } from '@/components/LoadingOverlay';

// Import media assets
import uklidImage from '@/assets/uklid-image.png';
import windowCleaningImage from '@/assets/window-cleaning-image.jpg';
import upholsteryImage from '@/assets/upholstery-image-new.jpg';

const services = [{
  id: 'cleaning',
  title: 'Úklid',
  icon: Sparkles,
  description: 'Kompletní úklid domácnosti nebo firmy',
  category: 'home_cleaning',
  media: uklidImage,
  mediaType: 'image' as const,
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
export default function ClientServices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);
  const serviceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
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
  const {
    toast
  } = useToast();
  const isMobile = useIsMobile();
  const isAdminBooking = user?.email === 'stepan.tomov5@seznam.cz';

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
          data: client
        } = await supabase.from('clients').select('address, city, postal_code').eq('user_id', user.id).maybeSingle();
        if (client) {
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
  }, [user, isAdminBooking]);

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
        setTimeout(() => {
          serviceRefs.current[serviceId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [searchParams, setSearchParams]);

  // Calculate price when relevant fields change
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
    if (!selectedService || !user) return;

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
        } = await supabase.from('clients').select('id, user_id').eq('id', selectedClientForBooking).single();
        client = selectedClient;
      } else {
        // Regular client booking for themselves
        let {
          data: existingClient
        } = await supabase.from('clients').select('id, user_id').eq('user_id', user.id).maybeSingle();
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
          }]).select('id, user_id').single();
          if (createClientError) throw createClientError;
          existingClient = newClient;
        }
        client = existingClient;
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
        bookingDetails.typ_objektu = bookingData.typ_objektu_okna;
        bookingDetails.znecisteni = bookingData.znecisteni_okna;
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
      const adminUserId = client.user_id;
      const fullAddress = `${addressValidation.data.street}, ${addressValidation.data.city}, ${addressValidation.data.postal_code}`;
      const {
        error
      } = await supabase.from('bookings').insert([{
        user_id: adminUserId,
        client_id: client.id,
        service_type: selectedService.id,
        scheduled_date: scheduledDate.toISOString(),
        address: fullAddress,
        booking_details: (detailsValidation.success ? detailsValidation.data : bookingDetails) as unknown as import('@/integrations/supabase/types').Json,
        status: 'pending'
      }]);
      if (error) throw error;
      toast({
        title: 'Rezervace odeslána!',
        description: 'Brzy Vás budeme kontaktovat.'
      });

      // Redirect to client dashboard
      window.location.href = '/klient';
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
  return <div className="container mx-auto px-4 pt-6 pb-20 space-y-6">
    {/* Hero Header */}
    <ClientHeroHeader
      icon={Sparkles}
      title="Naše Služby"
      subtitle="Vyberte si službu, kterou potřebujete"
    />

    {isAdminBooking && <Card className="border-primary">
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

    {/* Intro Section */}
    <div className="bg-muted/50 rounded-xl p-4 border border-border">
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

    {/* Services Grid */}
    <div className="space-y-4">
      {services.map(service => {
        const isOpen = selectedService?.id === service.id;
        return (
          <div key={service.id} ref={(el) => { serviceRefs.current[service.id] = el; }}>
            <ServiceCard
              id={service.id}
              title={service.title}
              description={service.description}
              icon={service.icon}
              media={service.media}
              mediaType={service.mediaType}
              painPoints={service.painPoints}
              benefits={service.benefits}
              isOpen={isOpen}
              onOpenChange={(open) => {
                if (open) {
                  setSelectedService(service);
                } else {
                  setSelectedService(null);
                }
              }}
            >
              {/* Alert info */}
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm">
                  Po vyplnění formuláře zjistíte orientační cenu. Spojíme se s Vámi a doladíme detaily.
                </AlertDescription>
              </Alert>

              {/* Combined Cleaning Form */}
              {service.id === 'cleaning' && <>
                {/* Cleaning Type Selector */}
                <section className="space-y-3">
                  <Label className="text-sm font-medium">Typ úklidu</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${bookingData.cleaning_type === 'osobni' ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/50'}`}
                      onClick={() => setBookingData({
                        ...bookingData,
                        cleaning_type: 'osobni'
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bookingData.cleaning_type === 'osobni' ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                          {bookingData.cleaning_type === 'osobni' && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                        </div>
                        <span className="font-medium text-sm">Domácnost</span>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${bookingData.cleaning_type === 'firemni' ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/50'}`}
                      onClick={() => setBookingData({
                        ...bookingData,
                        cleaning_type: 'firemni'
                      })}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bookingData.cleaning_type === 'firemni' ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                          {bookingData.cleaning_type === 'firemni' && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                        </div>
                        <span className="font-medium text-sm">Firma</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Home Cleaning Fields */}
                {bookingData.cleaning_type === 'osobni' && <>
                  <section className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Plocha (m²)</Label>
                        <Input type="number" inputMode="numeric" min="20" max="500" placeholder="Zadejte plochu" className="h-11 rounded-lg bg-background" value={bookingData.plocha_m2 || ''} onChange={e => setBookingData({
                          ...bookingData,
                          plocha_m2: Number(e.target.value) || 0
                        })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Počet koupelen</Label>
                        <Input type="number" inputMode="numeric" min="0" max="10" placeholder="Zadejte počet" className="h-11 rounded-lg bg-background" value={bookingData.pocet_koupelen || ''} onChange={e => setBookingData({
                          ...bookingData,
                          pocet_koupelen: Number(e.target.value) || 0
                        })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Počet kuchyní</Label>
                      <Input type="number" inputMode="numeric" min="0" max="5" placeholder="Zadejte počet" className="h-11 rounded-lg bg-background" value={bookingData.pocet_kuchyni || ''} onChange={e => setBookingData({
                        ...bookingData,
                        pocet_kuchyni: Number(e.target.value) || 0
                      })} />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="space-y-2">
                      {isMobile ? <StyledSelect value={bookingData.typ_domacnosti || ''} onChange={e => setBookingData({
                        ...bookingData,
                        typ_domacnosti: e.target.value as 'byt' | 'rodinny_dum'
                      })}>
                        <option value="" disabled>Zvolte typ domácnosti</option>
                        <option value="byt">Byt</option>
                        <option value="rodinny_dum">Rodinný dům</option>
                      </StyledSelect> : <Select value={bookingData.typ_domacnosti || undefined} onValueChange={(value: 'byt' | 'rodinny_dum') => setBookingData({
                        ...bookingData,
                        typ_domacnosti: value
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm relative z-[200]">
                          <SelectValue placeholder="Zvolte typ domácnosti" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-[10050]">
                          <SelectItem value="byt">Byt</SelectItem>
                          <SelectItem value="rodinny_dum">Rodinný dům</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="space-y-2">
                      {isMobile ? <StyledSelect value={bookingData.znecisteni || ''} onChange={e => setBookingData({
                        ...bookingData,
                        znecisteni: e.target.value as DirtinessLevel
                      })}>
                        <option value="" disabled>Zvolte úroveň znečištění</option>
                        <option value="nizka">Nízké</option>
                        <option value="stredni">Střední</option>
                        <option value="vysoka">Vysoké</option>
                      </StyledSelect> : <Select value={bookingData.znecisteni || undefined} onValueChange={(value: DirtinessLevel) => setBookingData({
                        ...bookingData,
                        znecisteni: value
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm relative z-[200]">
                          <SelectValue placeholder="Zvolte úroveň znečištění" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-[10050]">
                          <SelectItem value="nizka">Nízké</SelectItem>
                          <SelectItem value="stredni">Střední</SelectItem>
                          <SelectItem value="vysoka">Vysoké</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="space-y-2">
                      {isMobile ? <StyledSelect value={bookingData.frekvence || ''} onChange={e => setBookingData({
                        ...bookingData,
                        frekvence: e.target.value as FrequencyType
                      })}>
                        <option value="" disabled>Zvolte frekvenci</option>
                        <option value="jednorazove">Jednorázově</option>
                        <option value="mesicne">Měsíčně (−10 %)</option>
                        <option value="ctyrtydne">Každé 2 týdny (−15 %)</option>
                        <option value="tydne">Každý týden (−20 %)</option>
                      </StyledSelect> : <Select value={bookingData.frekvence || undefined} onValueChange={(value: FrequencyType) => setBookingData({
                        ...bookingData,
                        frekvence: value
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm relative z-[200]">
                          <SelectValue placeholder="Zvolte frekvenci" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-[10050]">
                          <SelectItem value="jednorazove">Jednorázově</SelectItem>
                          <SelectItem value="mesicne">Měsíčně (−10 %)</SelectItem>
                          <SelectItem value="ctyrtydne">Každé 2 týdny (−15 %)</SelectItem>
                          <SelectItem value="tydne">Každý týden (−20 %)</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <Label className="text-sm font-medium">Úklidové vybavení</Label>
                    <div className="space-y-2">
                      <div className={`p-4 rounded-lg border cursor-pointer transition-all ${bookingData.equipment_option === 'with' ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/50'}`} onClick={() => setBookingData({
                        ...bookingData,
                        equipment_option: 'with'
                      })}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bookingData.equipment_option === 'with' ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {bookingData.equipment_option === 'with' && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">Mám úklidové vybavení a prostředky</div>
                            <div className="text-xs text-muted-foreground">Hadry z mikrovlákna, Vysavač, Mop + Kbelík, Houbička, Čistící prostředky</div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border cursor-pointer transition-all ${bookingData.equipment_option === 'without' ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/50'}`} onClick={() => setBookingData({
                        ...bookingData,
                        equipment_option: 'without'
                      })}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bookingData.equipment_option === 'without' ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {bookingData.equipment_option === 'without' && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">Nemám úklidové vybavení a prostředky</div>
                            <div className="text-xs font-semibold text-primary">+290 Kč</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </>}

                {/* Office Cleaning Fields */}
                {bookingData.cleaning_type === 'firemni' && <>
                  <section className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Plocha (m²)</Label>
                        <Input type="number" inputMode="numeric" min="20" max="5000" placeholder="Zadejte plochu" className="h-11 rounded-lg bg-background" value={bookingData.plocha_m2 || ''} onChange={e => setBookingData({
                          ...bookingData,
                          plocha_m2: Number(e.target.value) || 0
                        })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Počet WC</Label>
                        <Input type="number" inputMode="numeric" min="0" max="50" placeholder="Zadejte počet" className="h-11 rounded-lg bg-background" value={bookingData.pocet_wc || ''} onChange={e => setBookingData({
                          ...bookingData,
                          pocet_wc: Number(e.target.value) || 0
                        })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Počet kuchyněk</Label>
                      <Input type="number" inputMode="numeric" min="0" max="20" placeholder="Zadejte počet" className="h-11 rounded-lg bg-background" value={bookingData.pocet_kuchynek || ''} onChange={e => setBookingData({
                        ...bookingData,
                        pocet_kuchynek: Number(e.target.value) || 0
                      })} />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="space-y-2">
                      {isMobile ? <StyledSelect value={bookingData.typ_prostoru || ''} onChange={e => setBookingData({
                        ...bookingData,
                        typ_prostoru: e.target.value as OfficeSpaceType
                      })}>
                        <option value="" disabled>Zvolte typ objektu</option>
                        <option value="kancelar">Kancelář</option>
                        <option value="obchod">Obchod / Prodejna</option>
                        <option value="sklad">Sklad</option>
                        <option value="vyroba">Výroba / Průmysl</option>
                      </StyledSelect> : <Select value={bookingData.typ_prostoru || undefined} onValueChange={(value: OfficeSpaceType) => setBookingData({
                        ...bookingData,
                        typ_prostoru: value
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm">
                          <SelectValue placeholder="Zvolte typ objektu" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="kancelar">Kancelář</SelectItem>
                          <SelectItem value="obchod">Obchod / Prodejna</SelectItem>
                          <SelectItem value="sklad">Sklad</SelectItem>
                          <SelectItem value="vyroba">Výroba / Průmysl</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="space-y-2">
                      {isMobile ? <StyledSelect value={bookingData.znecisteni_office || ''} onChange={e => setBookingData({
                        ...bookingData,
                        znecisteni_office: e.target.value as OfficeDirtinessLevel
                      })}>
                        <option value="" disabled>Zvolte úroveň znečištění</option>
                        <option value="nizke">Nízké</option>
                        <option value="stredni">Střední</option>
                        <option value="vysoke">Vysoké</option>
                        <option value="extremni">Extrémní</option>
                      </StyledSelect> : <Select value={bookingData.znecisteni_office || undefined} onValueChange={(value: OfficeDirtinessLevel) => setBookingData({
                        ...bookingData,
                        znecisteni_office: value
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm">
                          <SelectValue placeholder="Zvolte úroveň znečištění" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="nizke">Nízké</SelectItem>
                          <SelectItem value="stredni">Střední</SelectItem>
                          <SelectItem value="vysoke">Vysoké</SelectItem>
                          <SelectItem value="extremni">Extrémní</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="space-y-2">
                      {isMobile ? <StyledSelect value={bookingData.frekvence_office || ''} onChange={e => setBookingData({
                        ...bookingData,
                        frekvence_office: e.target.value as OfficeFrequencyType
                      })}>
                        <option value="" disabled>Zvolte frekvenci</option>
                        <option value="jednorazove">Jednorázově</option>
                        <option value="mesicne">Měsíčně (−10 %)</option>
                        <option value="tydne">Každý týden (−20 %)</option>
                        <option value="denne">Denně (−30 %)</option>
                      </StyledSelect> : <Select value={bookingData.frekvence_office || undefined} onValueChange={(value: OfficeFrequencyType) => setBookingData({
                        ...bookingData,
                        frekvence_office: value
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm">
                          <SelectValue placeholder="Zvolte frekvenci" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="jednorazove">Jednorázově</SelectItem>
                          <SelectItem value="mesicne">Měsíčně (−10 %)</SelectItem>
                          <SelectItem value="tydne">Každý týden (−20 %)</SelectItem>
                          <SelectItem value="denne">Denně (−30 %)</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <Label className="text-sm font-medium">Úklidové vybavení</Label>
                    <div className="space-y-2">
                      <div className={`p-4 rounded-lg border cursor-pointer transition-all ${bookingData.equipment_option === 'with' ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/50'}`} onClick={() => setBookingData({
                        ...bookingData,
                        equipment_option: 'with'
                      })}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bookingData.equipment_option === 'with' ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {bookingData.equipment_option === 'with' && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">Mám úklidové vybavení a prostředky</div>
                            <div className="text-xs text-muted-foreground">Hadry z mikrovlákna, Vysavač, Mop + Kbelík, Houbička, Čistící prostředky</div>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-lg border cursor-pointer transition-all ${bookingData.equipment_option === 'without' ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : 'bg-card border-border hover:border-primary/50'}`} onClick={() => setBookingData({
                        ...bookingData,
                        equipment_option: 'without'
                      })}>
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${bookingData.equipment_option === 'without' ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`}>
                            {bookingData.equipment_option === 'without' && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm mb-1">Nemám úklidové vybavení a prostředky</div>
                            <div className="text-xs font-semibold text-primary">+290 Kč</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </>}
              </>}

              {/* Window Cleaning Form */}
              {service.id === 'window_cleaning' && <>
                <section className="space-y-4">
                  <div className="space-y-2">
                    <Input type="number" inputMode="numeric" min="1" max="100" placeholder="Např. 8 m²" className="h-11 rounded-lg bg-background" value={bookingData.pocet_oken || ''} onChange={e => setBookingData({
                      ...bookingData,
                      pocet_oken: Number(e.target.value) || 0
                    })} />
                    <p className="text-xs text-muted-foreground">*přibližná plocha jedné strany oken (m²) </p>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="space-y-2">
                    {isMobile ? <StyledSelect value={bookingData.znecisteni_okna || ''} onChange={e => setBookingData({
                      ...bookingData,
                      znecisteni_okna: e.target.value as WindowDirtinessLevel
                    })}>
                      <option value="" disabled>Zvolte úroveň znečištění</option>
                      <option value="nizke">Nízké</option>
                      <option value="stredni">Střední</option>
                      <option value="vysoke">Vysoké</option>
                    </StyledSelect> : <Select value={bookingData.znecisteni_okna || undefined} onValueChange={(value: WindowDirtinessLevel) => setBookingData({
                      ...bookingData,
                      znecisteni_okna: value
                    })}>
                      <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm">
                        <SelectValue placeholder="Zvolte úroveň znečištění" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="nizke">Nízké</SelectItem>
                        <SelectItem value="stredni">Střední</SelectItem>
                        <SelectItem value="vysoke">Vysoké</SelectItem>
                      </SelectContent>
                    </Select>}
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="space-y-2">
                    {isMobile ? <StyledSelect value={bookingData.typ_objektu_okna || ''} onChange={e => setBookingData({
                      ...bookingData,
                      typ_objektu_okna: e.target.value as WindowObjectType
                    })}>
                      <option value="" disabled>Zvolte typ objektu</option>
                      <option value="byt">Byt / Dům</option>
                      <option value="kancelar">Kancelář / Obchod</option>
                    </StyledSelect> : <Select value={bookingData.typ_objektu_okna || undefined} onValueChange={(value: WindowObjectType) => setBookingData({
                      ...bookingData,
                      typ_objektu_okna: value
                    })}>
                      <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm">
                        <SelectValue placeholder="Zvolte typ objektu" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="byt">Byt / Dům</SelectItem>
                        <SelectItem value="kancelar">Kancelář / Obchod</SelectItem>
                      </SelectContent>
                    </Select>}
                  </div>
                </section>
              </>}

              {/* Upholstery Cleaning Form */}
              {service.id === 'upholstery_cleaning' && <UpholsteryServiceSelector data={bookingData} onChange={changes => setBookingData(prev => ({
                ...prev,
                ...changes
              }))} />}

              {/* Common Fields for All Services */}
              <section className="space-y-4">
                <DateTimeRow
                  date={bookingData.date ? new Date(bookingData.date) : undefined}
                  time={bookingData.time}
                  onDateChange={(date) => setBookingData({
                    ...bookingData,
                    date: date ? date.toISOString().split('T')[0] : ''
                  })}
                  onTimeChange={(time) => setBookingData({
                    ...bookingData,
                    time
                  })}
                  disabledDates={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  singleRow={false}
                />
              </section>

              <section className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="street">Ulice a číslo popisné</Label>
                    <Input id="street" placeholder="např. Hlavní 123" className="h-11 rounded-lg bg-background" value={bookingData.street} onChange={e => setBookingData({
                      ...bookingData,
                      street: e.target.value
                    })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">Město</Label>
                      <Input id="city" placeholder="např. Praha" className="h-11 rounded-lg bg-background" value={bookingData.city} onChange={e => setBookingData({
                        ...bookingData,
                        city: e.target.value
                      })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">PSČ</Label>
                      <Input id="postal_code" placeholder="např. 110 00" className="h-11 rounded-lg bg-background" value={bookingData.postal_code} onChange={e => setBookingData({
                        ...bookingData,
                        postal_code: e.target.value
                      })} required />
                    </div>
                  </div>
                </div>
              </section>


              {/* Detail forms for selected doplňkové služby */}
              {service.id === 'cleaning' && bookingData.cleaning_type === 'osobni' && bookingData.doplnky_home.includes('Mytí oken') && <section className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <Label className="text-sm">Přibližná okenní plocha (m²)</Label>
                  <Input type="number" inputMode="numeric" min="1" max="100" placeholder="Např. 8" className="h-11 rounded-lg bg-background" value={bookingData.pocet_oken || ''} onChange={e => setBookingData({
                    ...bookingData,
                    pocet_oken: Number(e.target.value) || 0
                  })} />
                  <p className="text-xs text-muted-foreground">*zadejte plochu pouze jedné strany oken</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Úroveň znečištění</Label>
                  {isMobile ? <select className="h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground" value={bookingData.znecisteni_okna || ''} onChange={e => setBookingData({
                    ...bookingData,
                    znecisteni_okna: e.target.value as WindowDirtinessLevel
                  })}>
                    <option value="" disabled>Zvolte úroveň znečištění</option>
                    <option value="nizke">Nízké</option>
                    <option value="stredni">Střední</option>
                    <option value="vysoke">Vysoké</option>
                  </select> : <Select value={bookingData.znecisteni_okna || undefined} onValueChange={(value: WindowDirtinessLevel) => setBookingData({
                    ...bookingData,
                    znecisteni_okna: value
                  })}>
                    <SelectTrigger className="bg-background h-11 rounded-lg shadow-sm">
                      <SelectValue placeholder="Zvolte úroveň znečištění" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="nizke">Nízké</SelectItem>
                      <SelectItem value="stredni">Střední</SelectItem>
                      <SelectItem value="vysoke">Vysoké</SelectItem>
                    </SelectContent>
                  </Select>}
                </div>

              </section>}


              {service.id === 'cleaning' && bookingData.cleaning_type === 'osobni' && bookingData.doplnky_home.includes('Čištění čalounění') && <section className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button type="button" variant={bookingData.koberce ? 'default' : 'outline'} className="flex-1 h-10" onClick={() => setBookingData({
                      ...bookingData,
                      koberce: !bookingData.koberce
                    })}>
                      Koberce
                    </Button>
                  </div>
                  {bookingData.koberce && <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label className="text-sm">Typ koberce</Label>
                      {isMobile ? <StyledSelect value={bookingData.typ_koberec} onChange={e => setBookingData({
                        ...bookingData,
                        typ_koberec: e.target.value
                      })}>
                        <option value="Kusový">Kusový</option>
                        <option value="Pokládkový – krátký vlas">Pokládkový – krátký vlas</option>
                        <option value="Pokládkový – dlouhý vlas">Pokládkový – dlouhý vlas</option>
                      </StyledSelect> : <Select value={bookingData.typ_koberec} onValueChange={v => setBookingData({
                        ...bookingData,
                        typ_koberec: v
                      })}>
                        <SelectTrigger className="bg-background h-11 rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          <SelectItem value="Kusový">Kusový</SelectItem>
                          <SelectItem value="Pokládkový – krátký vlas">Pokládkový – krátký vlas</SelectItem>
                          <SelectItem value="Pokládkový – dlouhý vlas">Pokládkový – dlouhý vlas</SelectItem>
                        </SelectContent>
                      </Select>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Plocha (m²)</Label>
                        <Input type="number" min="0" className="h-11 rounded-lg bg-background" value={bookingData.plocha_koberec || ''} onChange={e => setBookingData({
                          ...bookingData,
                          plocha_koberec: Number(e.target.value) || 0
                        })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Znečištění</Label>
                        {isMobile ? <StyledSelect value={bookingData.znecisteni_koberec} onChange={e => setBookingData({
                          ...bookingData,
                          znecisteni_koberec: e.target.value
                        })}>
                          <option value="Nízké">Nízké</option>
                          <option value="Střední">Střední</option>
                          <option value="Vysoké">Vysoké</option>
                        </StyledSelect> : <Select value={bookingData.znecisteni_koberec} onValueChange={v => setBookingData({
                          ...bookingData,
                          znecisteni_koberec: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="Nízké">Nízké</SelectItem>
                            <SelectItem value="Střední">Střední</SelectItem>
                            <SelectItem value="Vysoké">Vysoké</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                    </div>
                  </div>}
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button type="button" variant={bookingData.sedacka ? 'default' : 'outline'} className="flex-1 h-10" onClick={() => setBookingData({
                      ...bookingData,
                      sedacka: !bookingData.sedacka
                    })}>
                      Sedačka
                    </Button>
                  </div>
                  {bookingData.sedacka && <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Velikost</Label>
                        {isMobile ? <StyledSelect value={bookingData.velikost_sedacka} onChange={e => setBookingData({
                          ...bookingData,
                          velikost_sedacka: e.target.value
                        })}>
                          <option value="2-místná">2-místná</option>
                          <option value="3-místná">3-místná</option>
                          <option value="4-místná">4-místná</option>
                          <option value="5-místná">5-místná</option>
                          <option value="6-místná">6-místná</option>
                        </StyledSelect> : <Select value={bookingData.velikost_sedacka} onValueChange={v => setBookingData({
                          ...bookingData,
                          velikost_sedacka: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="2-místná">2-místná</SelectItem>
                            <SelectItem value="3-místná">3-místná</SelectItem>
                            <SelectItem value="4-místná">4-místná</SelectItem>
                            <SelectItem value="5-místná">5-místná</SelectItem>
                            <SelectItem value="6-místná">6-místná</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Znečištění</Label>
                        {isMobile ? <StyledSelect value={bookingData.znecisteni_sedacka} onChange={e => setBookingData({
                          ...bookingData,
                          znecisteni_sedacka: e.target.value
                        })}>
                          <option value="Nízké">Nízké</option>
                          <option value="Střední">Střední</option>
                          <option value="Vysoké">Vysoké</option>
                        </StyledSelect> : <Select value={bookingData.znecisteni_sedacka} onValueChange={v => setBookingData({
                          ...bookingData,
                          znecisteni_sedacka: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="Nízké">Nízké</SelectItem>
                            <SelectItem value="Střední">Střední</SelectItem>
                            <SelectItem value="Vysoké">Vysoké</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                    </div>
                  </div>}
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button type="button" variant={bookingData.matrace ? 'default' : 'outline'} className="flex-1 h-10" onClick={() => setBookingData({
                      ...bookingData,
                      matrace: !bookingData.matrace
                    })}>
                      Matrace
                    </Button>
                  </div>
                  {bookingData.matrace && <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Velikost</Label>
                        {isMobile ? <StyledSelect value={bookingData.velikost_matrace} onChange={e => setBookingData({
                          ...bookingData,
                          velikost_matrace: e.target.value
                        })}>
                          <option value="90">90 cm</option>
                          <option value="140">140 cm</option>
                          <option value="160">160 cm</option>
                          <option value="180">180 cm</option>
                          <option value="200">200 cm</option>
                        </StyledSelect> : <Select value={bookingData.velikost_matrace} onValueChange={v => setBookingData({
                          ...bookingData,
                          velikost_matrace: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="90">90 cm</SelectItem>
                            <SelectItem value="140">140 cm</SelectItem>
                            <SelectItem value="160">160 cm</SelectItem>
                            <SelectItem value="180">180 cm</SelectItem>
                            <SelectItem value="200">200 cm</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Strany</Label>
                        {isMobile ? <StyledSelect value={bookingData.strany_matrace} onChange={e => setBookingData({
                          ...bookingData,
                          strany_matrace: e.target.value
                        })}>
                          <option value="1 strana">1 strana</option>
                          <option value="obě strany">obě strany</option>
                        </StyledSelect> : <Select value={bookingData.strany_matrace} onValueChange={v => setBookingData({
                          ...bookingData,
                          strany_matrace: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="1 strana">1 strana</SelectItem>
                            <SelectItem value="obě strany">obě strany</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                    </div>
                  </div>}
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button type="button" variant={bookingData.kresla ? 'default' : 'outline'} className="flex-1 h-10" onClick={() => setBookingData({
                      ...bookingData,
                      kresla: !bookingData.kresla
                    })}>
                      Křeslo
                    </Button>
                  </div>
                  {bookingData.kresla && <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Počet</Label>
                        <Input type="number" min="0" className="h-11 rounded-lg bg-background" value={bookingData.pocet_kresla || ''} onChange={e => setBookingData({
                          ...bookingData,
                          pocet_kresla: Number(e.target.value) || 0
                        })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Znečištění</Label>
                        {isMobile ? <StyledSelect value={bookingData.znecisteni_kresla} onChange={e => setBookingData({
                          ...bookingData,
                          znecisteni_kresla: e.target.value
                        })}>
                          <option value="Nízké">Nízké</option>
                          <option value="Střední">Střední</option>
                          <option value="Vysoké">Vysoké</option>
                        </StyledSelect> : <Select value={bookingData.znecisteni_kresla} onValueChange={v => setBookingData({
                          ...bookingData,
                          znecisteni_kresla: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="Nízké">Nízké</SelectItem>
                            <SelectItem value="Střední">Střední</SelectItem>
                            <SelectItem value="Vysoké">Vysoké</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                    </div>
                  </div>}
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button type="button" variant={bookingData.zidle ? 'default' : 'outline'} className="flex-1 h-10" onClick={() => setBookingData({
                      ...bookingData,
                      zidle: !bookingData.zidle
                    })}>
                      Židle
                    </Button>
                  </div>
                  {bookingData.zidle && <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Počet</Label>
                        <Input type="number" min="0" className="h-11 rounded-lg bg-background" value={bookingData.pocet_zidle || ''} onChange={e => setBookingData({
                          ...bookingData,
                          pocet_zidle: Number(e.target.value) || 0
                        })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Znečištění</Label>
                        {isMobile ? <StyledSelect value={bookingData.znecisteni_zidle} onChange={e => setBookingData({
                          ...bookingData,
                          znecisteni_zidle: e.target.value
                        })}>
                          <option value="Nízké">Nízké</option>
                          <option value="Střední">Střední</option>
                          <option value="Vysoké">Vysoké</option>
                        </StyledSelect> : <Select value={bookingData.znecisteni_zidle} onValueChange={v => setBookingData({
                          ...bookingData,
                          znecisteni_zidle: v
                        })}>
                          <SelectTrigger className="bg-background h-11 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="Nízké">Nízké</SelectItem>
                            <SelectItem value="Střední">Střední</SelectItem>
                            <SelectItem value="Vysoké">Vysoké</SelectItem>
                          </SelectContent>
                        </Select>}
                      </div>
                    </div>
                  </div>}
                </div>
              </section>}

              {(service.id === 'cleaning' || service.id === 'window_cleaning' || service.id === 'upholstery_cleaning') && (() => {
                // Check if all required fields are filled based on service type
                const isCleaningComplete = service.id === 'cleaning' && (
                  (bookingData.cleaning_type === 'osobni' && bookingData.plocha_m2 > 0 && bookingData.typ_domacnosti && bookingData.znecisteni && bookingData.frekvence && bookingData.equipment_option) ||
                  (bookingData.cleaning_type === 'firemni' && bookingData.plocha_m2 > 0 && bookingData.typ_prostoru && bookingData.znecisteni_office && bookingData.frekvence_office && bookingData.equipment_option)
                );
                const isWindowComplete = service.id === 'window_cleaning' && bookingData.pocet_oken > 0 && bookingData.znecisteni_okna && bookingData.typ_objektu_okna;
                const isUpholsteryComplete = service.id === 'upholstery_cleaning' && (bookingData.koberce || bookingData.sedacka || bookingData.matrace || bookingData.kresla || bookingData.zidle);
                const isFormComplete = isCleaningComplete || isWindowComplete || isUpholsteryComplete;

                return (
                  <section className="space-y-3 p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Orientační cena</Label>
                        {isFormComplete ? (
                          <div className="text-lg font-bold">
                            {priceEstimate.priceMin} – {priceEstimate.priceMax} Kč
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-lg font-bold">0 Kč</div>
                            <p className="text-sm text-muted-foreground">Doplňte všechna políčka</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">Na přesné ceně se domluvíme před úklidem.</p>
                      </div>

                      {/* Price breakdown - only for cleaning when complete */}
                      {isFormComplete && service.id === 'cleaning' && bookingData.cleaning_type && <div className="space-y-1 pt-2 border-t border-border/50">
                        {/* Base service */}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Základní služba</span>
                          <span>{priceEstimate.baseServiceMin} – {priceEstimate.baseServiceMax} Kč</span>
                        </div>

                        {/* Equipment cost */}
                        {priceEstimate.equipmentCost > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Přivezeme vybavení</span>
                          <span>+{priceEstimate.equipmentCost} Kč</span>
                        </div>}

                        {/* Window cleaning add-on */}
                        {priceEstimate.windowMin > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Mytí oken</span>
                          <span>+{priceEstimate.windowMin} – {priceEstimate.windowMax} Kč</span>
                        </div>}

                        {/* Upholstery cleaning add-on */}
                        {priceEstimate.upholsteryMin > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Čištění čalounění</span>
                          <span>+{priceEstimate.upholsteryMin} – {priceEstimate.upholsteryMax} Kč</span>
                        </div>}

                        {/* Discount by frequency */}
                        {priceEstimate.discountPercent > 0 && <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                          <span>Sleva za pravidelnost</span>
                          <span>-{Math.round(priceEstimate.discountPercent)}%</span>
                        </div>}
                      </div>}

                      {/* Price breakdown - for upholstery cleaning when multiple items selected */}
                      {isFormComplete && service.id === 'upholstery_cleaning' && (
                        (priceEstimate.upholsteryCarpetPrice > 0 ? 1 : 0) +
                        (priceEstimate.upholsterySofaPrice > 0 ? 1 : 0) +
                        (priceEstimate.upholsteryMattressPrice > 0 ? 1 : 0) +
                        (priceEstimate.upholsteryArmchairPrice > 0 ? 1 : 0) +
                        (priceEstimate.upholsteryChairPrice > 0 ? 1 : 0)
                      ) > 1 && <div className="space-y-1 pt-2 border-t border-border/50">
                          {/* Carpet */}
                          {priceEstimate.upholsteryCarpetPrice > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Koberec</span>
                            <span>{Math.round(priceEstimate.upholsteryCarpetPrice * 0.9)} – {Math.round(priceEstimate.upholsteryCarpetPrice * 1.1)} Kč</span>
                          </div>}

                          {/* Sofa */}
                          {priceEstimate.upholsterySofaPrice > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Sedačka</span>
                            <span>{Math.round(priceEstimate.upholsterySofaPrice * 0.9)} – {Math.round(priceEstimate.upholsterySofaPrice * 1.1)} Kč</span>
                          </div>}

                          {/* Mattress */}
                          {priceEstimate.upholsteryMattressPrice > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Matrace</span>
                            <span>{Math.round(priceEstimate.upholsteryMattressPrice * 0.9)} – {Math.round(priceEstimate.upholsteryMattressPrice * 1.1)} Kč</span>
                          </div>}

                          {/* Armchair */}
                          {priceEstimate.upholsteryArmchairPrice > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Křesla</span>
                            <span>{Math.round(priceEstimate.upholsteryArmchairPrice * 0.9)} – {Math.round(priceEstimate.upholsteryArmchairPrice * 1.1)} Kč</span>
                          </div>}

                          {/* Chair */}
                          {priceEstimate.upholsteryChairPrice > 0 && <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Židle</span>
                            <span>{Math.round(priceEstimate.upholsteryChairPrice * 0.9)} – {Math.round(priceEstimate.upholsteryChairPrice * 1.1)} Kč</span>
                          </div>}

                          {/* Total line */}
                          <div className="flex justify-between text-xs font-medium text-foreground pt-1 border-t border-border/30">
                            <span>Celkem</span>
                            <span>{priceEstimate.priceMin} – {priceEstimate.priceMax} Kč</span>
                          </div>
                        </div>}

                      {/* Minimum order warning for all services */}
                      {isFormComplete && priceEstimate.priceMax > 0 && priceEstimate.priceMax < MINIMUM_ORDER && <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-medium text-amber-800 dark:text-amber-200">Minimální objednávka: {MINIMUM_ORDER} Kč</span>
                          <p className="text-amber-600 dark:text-amber-400 text-xs mt-1">
                            Fakturovaná částka bude min. {MINIMUM_ORDER} Kč.
                          </p>
                        </div>
                      </div>}

                    </div>
                  </section>
                );
              })()}

              {isAdminBooking && <section className="space-y-2">
                <Label>Upravit Orientační Cenu (Admin)</Label>
                <Input type="number" value={adminPriceOverride} onChange={e => setAdminPriceOverride(e.target.value)} placeholder="Ponechte prázdné pro automatickou cenu..." />
              </section>}

              <section className="space-y-2">
                <Label>Poznámky (volitelné)</Label>
                <Textarea value={bookingData.notes} onChange={e => setBookingData({
                  ...bookingData,
                  notes: e.target.value
                })} placeholder="Speciální požadavky..." rows={3} />
              </section>

              <PremiumButton
                className="w-full py-6 text-base"
                onClick={handleBooking}
                disabled={loading || !bookingData.date || !bookingData.time || !bookingData.street || !bookingData.city || !bookingData.postal_code || service.id === 'upholstery_cleaning' && priceEstimate.upholsteryBelowMinimum}
              >
                {loading ? 'Odesílám...' : service.id === 'upholstery_cleaning' && priceEstimate.upholsteryBelowMinimum ? `Min. objednávka ${priceEstimate.upholsteryMinimumOrder} Kč` : 'Odeslat Poptávku'}
              </PremiumButton>
            </ServiceCard>
          </div>
        );
      })}
    </div>

    {/* Support Section */}
    <div className="rounded-xl bg-card border border-border p-4 space-y-3">
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
  </div>;
}