import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PremiumButton } from '@/components/ui/PremiumButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import klinrLogoFull from '@/assets/Klinr Logo Full.png';
import klinrLogoCropped from '@/assets/Klinr Logo Full.png';
import klinrLogoFavicon from '@/assets/Klinr Logo Favicon.png';
import { Mail, Lock, User, Building2, MapPin, Phone, Calendar, FileText, ArrowLeft, ArrowRight, Check, Info, Smartphone } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-time-picker';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = 'AIzaSyATxE6HkAJcLTbYyLoOwVlYqEhak32DDCQ';
const libraries: ('places')[] = ['places'];

// Phone formatting helper
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`;
};

type ClientType = 'person' | 'company';

export default function ClientAuth() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sign In State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Registration Multi-Step State
  const [step, setStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem('registration_step');
      const parsed = saved ? parseInt(saved) : 1;
      return isNaN(parsed) ? 1 : parsed;
    } catch {
      return 1;
    }
  });
  const [clientType, setClientType] = useState<ClientType>('person');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [fetchingAres, setFetchingAres] = useState(false);
  const companyIdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useLoadScript({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    language: 'cs',
    region: 'CZ',
  });

  useEffect(() => {
    if (loadError) {
      console.error("Google Maps load error:", loadError);
      toast({
        variant: "destructive",
        title: "Chyba Google Maps",
        description: "Nepodařilo se načíst mapy. Zkontrolujte připojení nebo nastavení API klíče.",
      });
    }
  }, [loadError, toast]);

  const [formData, setFormData] = useState<any>(() => {
    // Session storage fallback for initial state, but we'll primarily rely on DB sync
    try {
      const saved = sessionStorage.getItem('registration_formData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error parsing sessionStorage formData:', err);
      // Clear corrupted data
      sessionStorage.removeItem('registration_formData');
      sessionStorage.removeItem('registration_step');
    }
    return {
      // Step 1
      name: '',
      email: '',
      password: '',
      company_id: '',

      // Step 3
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      dic: '',
      reliable_person: '',

      // Step 4 (Osoba)
      has_children: false,
      has_pets: false,
      allergies_notes: '',
      special_instructions: '',
      referral_code: '',
      referred_by_id: null
    };
  });

  // Load progress from DB on mount/auth
  useEffect(() => {
    const syncProgress = async () => {
      if (!user) return;

      try {
        const { data: client, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (client) {
          const c = client as any;
          // If already completed, redirect
          if (c.onboarding_completed) {
            navigate('/klient', { replace: true });
            return;
          }

          // Sync DB data to form state (prioritize DB over session storage)
          setFormData(prev => ({
            ...prev,
            name: c.name || prev.name,
            email: c.email || prev.email,
            phone: c.phone || prev.phone,
            address: c.address || prev.address,
            city: c.city || prev.city,
            postal_code: c.postal_code || prev.postal_code,
            company_id: c.company_id || prev.company_id,
            dic: c.dic || prev.dic,
            reliable_person: c.reliable_person || prev.reliable_person,
            has_children: c.has_children || prev.has_children,
            has_pets: c.has_pets || prev.has_pets,
            allergies_notes: c.allergies_notes || prev.allergies_notes,
            special_instructions: c.special_instructions || prev.special_instructions,
            // Keep referral info if we have it in state, otherwise try to get from DB if we tracked it (we track referred_by_id)
            referred_by_id: c.referred_by_id || prev.referred_by_id
          }));

          // Resume step
          if (c.onboarding_step && c.onboarding_step > 1) {
            setStep(c.onboarding_step);
          }

          // If we have data, we're likely past step 1/2 in reality, ensure proper client type
          if (c.client_type) {
            setClientType(c.client_type as ClientType);
          }
        }
      } catch (err) {
        console.error("Error syncing progress:", err);
      }
    };

    syncProgress();
  }, [user, navigate]);

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('registration_step', step.toString());
    sessionStorage.setItem('registration_formData', JSON.stringify(formData));
  }, [step, formData]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;

      toast({
        title: "Přihlášení úspěšné!",
        description: "Vítejte zpět.",
        duration: 1500,
      });

      // Check for desktop environment
      if (window.innerWidth >= 1024) { // lg breakpoint
        navigate('/klient/aplikace');
      } else {
        navigate('/klient');
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chyba přihlášení",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only redirect if fully registered as a client
    if (user && profile?.roles?.includes('client') && step === 1) {
      if (window.innerWidth >= 1024) {
        navigate('/klient/aplikace', { replace: true });
      } else {
        navigate('/klient', { replace: true });
      }
    }
  }, [user, profile, navigate, step]);

  const fetchAresData = async (ico: string) => {
    if (!ico || ico.length < 8) return;

    setFetchingAres(true);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);

      if (!response.ok) throw new Error('Firma nenalezena');

      const data = await response.json();

      const companyName = data.obchodniJmeno || '';
      const vat_id = data.dic || '';

      const sidlo = data.sidlo;
      let fullAddress = '';
      let cityName = '';
      let postal = '';

      if (sidlo) {
        const street = sidlo.nazevUlice || '';
        const houseNumber = sidlo.cisloDomovni || '';
        const orientationNumber = sidlo.cisloOrientacni || '';
        cityName = sidlo.nazevObce || '';
        postal = sidlo.psc?.toString() || '';

        fullAddress = [street, houseNumber, orientationNumber].filter(Boolean).join(' ');
      }

      setFormData(prev => ({
        ...prev,
        name: companyName || prev.name,
        dic: vat_id || prev.dic,
        address: fullAddress || prev.address,
        city: cityName || prev.city,
        postal_code: postal || prev.postal_code,
      }));

      toast({
        title: 'Úspěch',
        description: 'Data firmy načtena z ARES',
        duration: 1500,
      });
    } catch (error) {
      console.error('Error fetching ARES data:', error);
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst data z ARES',
        variant: 'destructive',
      });
    } finally {
      setFetchingAres(false);
    }
  };

  const handleCompanyIdChange = (value: string) => {
    setFormData(prev => ({ ...prev, company_id: value }));

    if (companyIdTimeoutRef.current) {
      clearTimeout(companyIdTimeoutRef.current);
    }

    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 8) {
      companyIdTimeoutRef.current = setTimeout(() => {
        fetchAresData(cleanValue);
      }, 500);
    }
  };

  const checkSupabaseConnectivity = async () => {
    try {
      const supabaseUrl = (supabase as any).supabaseUrl;
      // We don't check response.ok because auth/v1/health might return 401 or 404
      // but receiving ANY response means the domain is not blocked.
      await fetch(`${supabaseUrl}/auth/v1/health`, { method: 'GET' });
      return true;
    } catch (err) {
      console.error('Supabase connectivity check failed:', err);
      // Only return false if it's a network error (like TypeError: Failed to fetch)
      return false;
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate Step 1 fields
      if (!formData.email || !formData.password || !formData.name) {
        throw new Error('Prosím vyplňte všechna povinná pole');
      }

      if (clientType === 'company' && !formData.company_id) {
        throw new Error('IČO je povinné pro firmy');
      }

      if (formData.password.length < 6) {
        throw new Error('Heslo musí mít alespoň 6 znaků');
      }

      // Connectivity pre-check
      const isConnected = await checkSupabaseConnectivity();
      if (!isConnected) {
        throw new Error('Nepodařilo se připojit k autentizačnímu serveru. Zkontrolujte prosím své internetové připojení nebo vypněte adblocker, který by mohl blokovat Supabase.');
      }

      // Validate Referral Code if provided
      let referredById = null;
      if (formData.referral_code) {
        const { data: referee, error: refereeError } = await supabase
          .from('clients')
          .select('id')
          .eq('referral_code', formData.referral_code.toUpperCase())
          .maybeSingle();

        if (refereeError) throw refereeError;
        if (!referee) {
          throw new Error('Neplatný referral kód. Prosím zkontrolujte jej nebo nechte pole prázdné.');
        }
        referredById = (referee as any).id;
      }

      // Send OTP to email using Supabase signInWithOtp (which sends a 6-digit code)
      let otpResult;
      let lastError;
      for (let i = 0; i < 2; i++) {
        try {
          otpResult = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
              shouldCreateUser: true,
              data: {
                full_name: formData.name,
                is_client: true,
                referred_by_id: referredById,
              }
            }
          });
          if (!otpResult.error) break;
          lastError = otpResult.error;
        } catch (err: any) {
          lastError = err;
          if (err.name === 'TypeError' && err.message.includes('Load failed')) {
            await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 0));
            continue;
          }
          throw err;
        }
      }

      const { data, error } = otpResult || { data: null, error: lastError };
      if (error) {
        if (error.message.includes('Load failed')) {
          throw new Error('Chyba sítě při odesílání registrace. To je často způsobeno adblockerem nebo firewallem blokujícím doménu Supabase.');
        }
        throw error;
      }

      // Store referredById in formData for subsequent steps
      setFormData(prev => ({ ...prev, referred_by_id: referredById }));

      setResendTimer(180);
      setStep(2);

      toast({
        title: "Ověřovací kód odeslán",
        description: `Zkontrolujte svůj email ${formData.email}`,
        duration: 1500,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chyba",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const upsertClientData = async (currentFormData: any, userId: string) => {
    if (!userId) {
      console.error('upsertClientData: No userId provided');
      return;
    }

    try {
      console.log('Upserting client data for:', userId, currentFormData);

      const clientPayload = {
        user_id: userId,
        client_type: clientType,
        name: currentFormData.name,
        email: currentFormData.email,
        phone: currentFormData.phone,
        address: currentFormData.address,
        city: currentFormData.city,
        postal_code: currentFormData.postal_code,
        company_id: clientType === 'company' ? currentFormData.company_id : null,
        dic: clientType === 'company' ? currentFormData.dic || null : null,
        reliable_person: clientType === 'company' ? currentFormData.reliable_person : null,
        has_children: clientType === 'person' ? !!currentFormData.has_children : false,
        has_pets: clientType === 'person' ? !!currentFormData.has_pets : false,
        allergies_notes: clientType === 'person' ? currentFormData.allergies_notes || null : null,
        special_instructions: clientType === 'person' ? currentFormData.special_instructions || null : null,
        referred_by_id: currentFormData.referred_by_id,
        client_source: 'App',
        onboarding_step: currentFormData.onboarding_step, // Pass this in
        onboarding_completed: currentFormData.onboarding_completed // Pass this in
      };

      // Check if client record already exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingClient) {
        // Update existing client
        const { error: clientError } = await supabase
          .from('clients')
          .update(clientPayload as any)
          .eq('user_id', userId);

        if (clientError) {
          console.error('Client update error:', clientError);
          throw clientError;
        }
      } else {
        // Insert new client
        const { error: clientError } = await supabase
          .from('clients')
          .insert(clientPayload as any);

        if (clientError) {
          console.error('Client insert error:', clientError);
          throw clientError;
        }
      }

      // Also ensure role is assigned (best effort - may fail due to RLS)
      // Note: Role assignment should ideally be handled by a database trigger
      try {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'client'
          } as any, { onConflict: 'user_id,role' } as any);

        if (roleError && !roleError.message.includes('duplicate')) {
          console.warn('Role upsert failed (expected if RLS is enabled):', roleError.message);
          // Don't throw - the trigger or admin will handle role assignment
        }
      } catch (roleErr) {
        console.warn('Role upsert exception:', roleErr);
        // Don't throw - continue with registration
      }

      console.log('Upsert successful');
    } catch (error) {
      console.error('Error in upsertClientData:', error);
      throw error;
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (verificationCode.length !== 6) {
        throw new Error('Zadejte 6-místný kód');
      }

      // CRITICAL: Verify OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: verificationCode,
        type: 'email'
      });

      if (error) throw error;

      // OTP verified successfully - now do best-effort operations
      if (data.user) {
        // Set password (best effort - don't block on failure)
        if (formData.password) {
          try {
            await supabase.auth.updateUser({ password: formData.password });
          } catch (pwErr) {
            console.error('Password update failed:', pwErr);
          }
        }

        // Save initial data (best effort - don't block on failure)
        try {
          await upsertClientData({ ...formData, onboarding_step: 3 } as any, data.user.id);
        } catch (dataErr: any) {
          console.error('Data save failed:', dataErr);
          toast({
            variant: 'destructive',
            title: 'Upozornění',
            description: 'Nepodařilo se uložit některé údaje. Prosím zkontrolujte je v dalších krocích.',
            duration: 4000,
          });
        }
      }

      // ALWAYS advance to step 3 after successful OTP verification
      setStep(3);
      toast({
        title: "Email ověřen!",
        description: "Pokračujte v registraci",
        duration: 1500,
      });
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        variant: "destructive",
        title: "Neplatný kód",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) throw error;

      setResendTimer(180);
      toast({
        title: "Kód odeslán znovu",
        description: "Zkontrolujte svůj email",
        duration: 1500,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chyba",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Step 3 fields
    if (!formData.phone || !formData.address || !formData.city || !formData.postal_code) {
      toast({
        variant: "destructive",
        title: "Chybí povinná pole",
        description: "Prosím vyplňte všechna povinná pole",
      });
      return;
    }

    if (clientType === 'company' && !formData.reliable_person) {
      toast({
        variant: "destructive",
        title: "Chybí kontaktní osoba",
        description: "Kontaktní osoba je povinná pro firmy",
      });
      return;
    }

    setLoading(true);
    try {
      // Incremental save - get latest user from session if context is slow
      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        currentUserId = sessionData.session?.user?.id;
      }

      if (currentUserId) {
        // Step 3 done -> moving to Step 4 (best effort save)
        try {
          await upsertClientData({ ...formData, onboarding_step: 4 }, currentUserId);
        } catch (dataErr: any) {
          console.error('Step 3 data save failed:', dataErr);
          // Silent failure - data will be saved in final step
        }
      }

      // ALWAYS advance to step 4 after validation passes
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      // Incremental save for step 4 data
      let currentUserId = user?.id;
      if (!currentUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        currentUserId = sessionData.session?.user?.id;
      }

      if (currentUserId) {
        try {
          // Save step 4 data with onboarding_completed flag
          await upsertClientData({ ...formData, onboarding_step: 4, onboarding_completed: true }, currentUserId);
        } catch (dataErr: any) {
          console.error('Step 4 data save failed:', dataErr);
        }
      }

      // Complete final registration
      await handleFinalSubmit();

    } catch (error: any) {
      console.error('Step 4 submission error:', error);
      toast({
        variant: "destructive",
        title: "Chyba při ukládání",
        description: error.message || "Zkuste to prosím znovu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    try {
      // Password was already set in handleVerifyCode (step 2)
      // No need to update it again here

      let finalUserId = user?.id;

      // If user is not detected yet, try to get the session again or wait
      if (!finalUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        finalUserId = sessionData.session?.user?.id;
      }

      if (!finalUserId) throw new Error('Nepodařilo se zjistit ID uživatele. Zkuste prosím stránku obnovit.');

      // Update client record one last time - COMPLETED
      await upsertClientData({ ...formData, onboarding_step: 5, onboarding_completed: true }, finalUserId);

      toast({
        title: "Registrace dokončena!",
        description: "Vítejte v Klinr",
        duration: 1500,
      });

      // Clear session storage on success
      sessionStorage.removeItem('registration_step');
      sessionStorage.removeItem('registration_formData');

      // Check if user came from landing page with a pending booking
      const pendingService = sessionStorage.getItem('pending_booking_service');
      if (pendingService) {
        sessionStorage.removeItem('pending_booking_service');
        navigate(`/klient/sluzby?service=${pendingService}`);
      } else {
        // Navigate to client dashboard or app info based on device
        if (window.innerWidth >= 1024) {
          navigate('/klient/aplikace');
        } else {
          navigate('/klient');
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Chyba registrace",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

    return (
      <div className="mb-8 w-full space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Krok {step}/{totalSteps}
          </span>
          <span className="text-sm font-medium text-white/60 whitespace-nowrap ml-2">
            {Math.round(progress)}% hotovo
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-5">
      {/* Client Type Selection */}
      <div className="space-y-3">
        <Label className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Typ účtu</Label>
        <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-xl border border-white/10">
          <Button
            type="button"
            variant={clientType === 'person' ? 'default' : 'outline'}
            className={`h-12 rounded-lg transition-all duration-300 ${clientType === 'person'
              ? 'bg-white text-slate-950 shadow-lg hover:bg-white/90 border-2 border-white font-bold'
              : 'bg-transparent text-white border-2 border-white/20 hover:bg-white/10'
              }`}
            onClick={() => setClientType('person')}
          >
            <User className="w-4 h-4 mr-2" />
            Osoba
          </Button>
          <Button
            type="button"
            variant={clientType === 'company' ? 'default' : 'outline'}
            className={`h-12 rounded-lg transition-all duration-300 ${clientType === 'company'
              ? 'bg-white text-slate-950 shadow-lg hover:bg-white/90 border-2 border-white font-bold'
              : 'bg-transparent text-white border-2 border-white/20 hover:bg-white/10'
              }`}
            onClick={() => setClientType('company')}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Firma
          </Button>
        </div>
      </div>

      {/* Company ID (IČO) - Only for companies */}
      {clientType === 'company' && (
        <div className="space-y-2.5">
          <Label htmlFor="company_id" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            IČO *
          </Label>
          <div className="relative group">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
            <Input
              id="company_id"
              value={formData.company_id}
              onChange={(e) => handleCompanyIdChange(e.target.value)}
              required
              disabled={fetchingAres}
              placeholder="12345678"
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
            />
            {fetchingAres && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2.5">
        <Label htmlFor="name" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
          {clientType === 'company' ? 'Název firmy *' : 'Celé jméno *'}
        </Label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={fetchingAres && clientType === 'company'}
            placeholder={clientType === 'company' ? 'Název firmy' : 'Jan Novák'}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Email *</Label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="vas@email.cz"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2.5">
        <Label htmlFor="password" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Heslo *</Label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            placeholder="••••••••"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
        </div>
        <p className="text-xs text-white/40 ml-1">Minimálně 6 znaků</p>
      </div>

      {/* Referral Code (Optional) */}
      <div className="space-y-2.5">
        <Label htmlFor="referral_code" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Kód doporučení (Volitelné)</Label>
        <div className="relative group">
          <Check className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
          <Input
            id="referral_code"
            value={formData.referral_code}
            onChange={(e) => setFormData({ ...formData, referral_code: e.target.value.toUpperCase() })}
            placeholder="DRXXXX"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all font-mono tracking-widest"
          />
        </div>
        <p className="text-[10px] text-white/40 ml-1">Pokud vás doporučil přítel, získáte oba bonusové body!</p>
      </div>


      <div className="flex items-start space-x-3 my-4 px-1">
        <div className="flex items-center h-5">
          <input
            id="gdpr-consent-step1"
            type="checkbox"
            checked={gdprConsent}
            onChange={(e) => setGdprConsent(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 transition-all cursor-pointer shrink-0"
          />
        </div>
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="gdpr-consent-step1"
            className="text-sm font-medium leading-tight text-white/80 cursor-pointer select-none"
          >
            Souhlasím se <Link to="/vop" state={{ from: 'registration' }} className="text-white hover:text-primary hover:underline transition-colors">Všeobecnými obchodními podmínkami</Link> a <Link to="/zasady-ochrany-osobnich-udaju" state={{ from: 'registration' }} className="text-white hover:text-primary hover:underline transition-colors">Zásadami ochrany osobních údajů</Link>.
          </label>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full h-14 bg-white text-blue-900 hover:bg-blue-50 font-bold rounded-[1.25rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        disabled={loading || !gdprConsent}
      >
        {loading ? "Odesílám..." : "Zaregistrovat se"}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={handleVerifyCode} className="space-y-5">
      <div className="text-center space-y-2 mb-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white">Ověřte svůj email</h3>
        <p className="text-sm text-white/60">
          Poslali jsme 6-místný kód na<br />
          <span className="text-white font-semibold">{formData.email}</span>
        </p>
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="code" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
          Ověřovací kód
        </Label>
        <Input
          id="code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          required
          maxLength={6}
          placeholder="000000"
          className="h-14 bg-white/5 border-white/10 text-white text-center text-2xl font-bold tracking-[0.5em] placeholder:text-white/20 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
        />
      </div>

      <div className="flex flex-col gap-3">
        <PremiumButton
          type="submit"
          className="w-full h-12 rounded-xl shadow-lg bg-white text-blue-950 hover:bg-white/90"
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? "Ověřuji..." : "Ověřit kód"}
        </PremiumButton>
        <div className="flex items-center gap-2 text-white/60 text-xs justify-center">
          <Info className="h-3.5 w-3.5" />
          <p>Doručení kódu trvá okolo 2 minut.</p>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={handleResendCode}
        disabled={resendTimer > 0}
        className="w-full text-white/60 hover:text-white hover:bg-white/5"
      >
        {resendTimer > 0 ? `Odeslat znovu za ${resendTimer}s` : 'Odeslat kód znovu'}
      </Button>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-5">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-white">
          {clientType === 'company' ? 'Detaily firmy' : 'Vaše údaje'}
        </h3>
        <p className="text-sm text-white/60">Vyplňte kontaktní informace</p>
      </div>

      {/* DIČ - Only for companies */}
      {clientType === 'company' && (
        <div className="space-y-2.5">
          <Label htmlFor="dic" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            DIČ
          </Label>
          <div className="relative group">
            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
            <Input
              id="dic"
              name="dic"
              value={formData.dic}
              onChange={(e) => setFormData({ ...formData, dic: e.target.value })}
              placeholder="CZ12345678"
              disabled={fetchingAres}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
            />
          </div>
        </div>
      )}

      {/* Phone */}
      <div className="space-y-2.5">
        <Label htmlFor="phone" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Telefon *</Label>
        <div className="relative group">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
          <div className="flex items-center h-12 bg-white/5 border border-white/10 rounded-2xl focus-within:ring-2 focus-within:ring-white/20 focus-within:border-white/20 transition-all">
            <span className="pl-11 pr-2 text-white/60 text-sm">+420</span>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={formatPhoneNumber(formData.phone.replace(/^\+420\s*/, ''))}
              onChange={(e) => {
                const numbers = e.target.value.replace(/\D/g, '').slice(0, 9);
                setFormData({ ...formData, phone: numbers });
              }}
              required
              placeholder="123 456 789"
              className="flex-1 h-full bg-transparent border-0 text-white placeholder:text-white/20 rounded-r-2xl focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2.5">
        <Label htmlFor="address" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Adresa *</Label>
        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors z-10" />
          {isLoaded ? (
            <Autocomplete
              onLoad={(autocomplete) => {
                autocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={() => {
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
                      } else if (component.types.includes('postal_code')) {
                        postalCode = component.long_name;
                      }
                    });

                    const fullStreetAddress = street ? `${street} ${houseNumber}`.trim() : (place.name || '');

                    setFormData({
                      ...formData,
                      address: fullStreetAddress || formData.address,
                      city: city || formData.city,
                      postal_code: postalCode || formData.postal_code
                    });
                  }
                }
              }}
              options={{
                componentRestrictions: { country: 'cz' },
                types: ['address'],
                fields: ["address_components", "formatted_address", "geometry", "name"]
              }}
            >
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                disabled={fetchingAres && clientType === 'company'}
                placeholder="Začněte psát adresu..."
                className="w-full h-12 bg-white/5 border border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
              />
            </Autocomplete>
          ) : (
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              disabled={fetchingAres && clientType === 'company'}
              placeholder="Ulice a číslo popisné"
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
            />
          )}
        </div>
      </div>

      {/* City and Postal Code */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2.5">
          <Label htmlFor="city" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Město *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
            disabled={fetchingAres && clientType === 'company'}
            placeholder="Praha"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
        </div>
        <div className="space-y-2.5">
          <Label htmlFor="postal_code" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">PSČ *</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            required
            disabled={fetchingAres && clientType === 'company'}
            placeholder="110 00"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
        </div>
      </div>



      {/* Contact Person - Only for companies */}
      {clientType === 'company' && (
        <div className="space-y-2.5">
          <Label htmlFor="reliable_person" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            Kontaktní osoba *
          </Label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
            <Input
              id="reliable_person"
              value={formData.reliable_person}
              onChange={(e) => setFormData({ ...formData, reliable_person: e.target.value })}
              required
              placeholder="Jméno kontaktní osoby"
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
            />
          </div>
        </div>
      )}

      <div className="pt-2">
        <PremiumButton
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl shadow-lg bg-white text-slate-950 hover:bg-white/90"
        >
          {loading ? 'Ukládám...' : 'Pokračovat'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </PremiumButton>
      </div>
    </form>
  );

  const renderStep4 = () => {
    if (clientType === 'company') {
      // For companies, show a simple confirmation
      return (
        <form onSubmit={handleStep4Submit} className="space-y-5">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white">Téměř hotovo!</h3>
            <p className="text-sm text-white/60">Zkontrolujte své údaje v dalším kroku</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{formData.name}</p>
                <p className="text-white/60 text-sm">IČO: {formData.company_id}</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <PremiumButton
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl shadow-lg bg-white text-slate-950 hover:bg-white/90"
            >
              {loading ? 'Dokončuji registraci...' : 'Dokončit registraci'}
              <Check className="ml-2 h-4 w-4" />
            </PremiumButton>
          </div>
        </form >
      );
    }

    // For persons, show preferences
    return (
      <form onSubmit={handleStep4Submit} className="space-y-5">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-white">Vaše preference</h3>
          <p className="text-sm text-white/60">Pomozte nám lépe vám sloužit</p>
        </div>

        {/* Children */}
        <div className="space-y-2.5">
          <Label className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            Děti v domácnosti
          </Label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-xl border border-white/10">
            <Button
              type="button"
              variant={formData.has_children ? 'default' : 'outline'}
              className={`h-10 rounded-lg transition-all ${formData.has_children
                ? 'bg-white text-slate-950 shadow-md border-2 border-white'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 border-2 border-white/20'
                }`}
              onClick={() => setFormData({ ...formData, has_children: true })}
            >
              Ano
            </Button>
            <Button
              type="button"
              variant={!formData.has_children ? 'default' : 'outline'}
              className={`h-10 rounded-lg transition-all ${!formData.has_children
                ? 'bg-white text-slate-950 shadow-md border-2 border-white'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 border-2 border-white/20'
                }`}
              onClick={() => setFormData({ ...formData, has_children: false })}
            >
              Ne
            </Button>
          </div>
        </div>

        {/* Pets */}
        <div className="space-y-2.5">
          <Label className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            Domácí mazlíčci
          </Label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-white/5 rounded-xl border border-white/10">
            <Button
              type="button"
              variant={formData.has_pets ? 'default' : 'outline'}
              className={`h-10 rounded-lg transition-all ${formData.has_pets
                ? 'bg-white text-slate-950 shadow-md border-2 border-white'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 border-2 border-white/20'
                }`}
              onClick={() => setFormData({ ...formData, has_pets: true })}
            >
              Ano
            </Button>
            <Button
              type="button"
              variant={!formData.has_pets ? 'default' : 'outline'}
              className={`h-10 rounded-lg transition-all ${!formData.has_pets
                ? 'bg-white text-slate-950 shadow-md border-2 border-white'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 border-2 border-white/20'
                }`}
              onClick={() => setFormData({ ...formData, has_pets: false })}
            >
              Ne
            </Button>
          </div>
        </div>

        {/* Allergies */}
        <div className="space-y-2.5">
          <Label htmlFor="allergies" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            Alergie
          </Label>
          <Textarea
            id="allergies"
            value={formData.allergies_notes}
            onChange={(e) => setFormData({ ...formData, allergies_notes: e.target.value })}
            placeholder="Máte nějaké alergie na čistící prostředky?"
            rows={2}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 resize-none"
          />
        </div>

        {/* Special Instructions */}
        <div className="space-y-2.5">
          <Label htmlFor="instructions" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            Specifické pokyny
          </Label>
          <Textarea
            id="instructions"
            value={formData.special_instructions}
            onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
            placeholder="např. Nezvonit, děti spí."
            rows={2}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 resize-none"
          />
        </div>

        <div className="pt-2">
          <PremiumButton
            type="submit"
            className="w-full h-12 rounded-xl shadow-lg bg-white text-blue-950 hover:bg-white/90"
          >
            Dokončit registraci
            <Check className="ml-2 h-4 w-4" />
          </PremiumButton>
        </div>
      </form>
    );
  };

  const renderStep5Summary = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-3">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">Shrnutí registrace</h3>
        <p className="text-sm text-white/60">Zkontrolujte své údaje před dokončením</p>
      </div>

      <div className="space-y-3">
        {/* Account Type */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Typ účtu</p>
          <p className="text-white font-semibold flex items-center gap-2">
            {clientType === 'person' ? (
              <><User className="w-4 h-4" /> Osoba</>
            ) : (
              <><Building2 className="w-4 h-4" /> Firma</>
            )}
          </p>
        </div>

        {/* Basic Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Základní údaje</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/60 text-xs">Jméno</p>
              <p className="text-white font-medium">{formData.name}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Email</p>
              <p className="text-white font-medium">{formData.email}</p>
            </div>
            {clientType === 'company' && (
              <>
                <div>
                  <p className="text-white/60 text-xs">IČO</p>
                  <p className="text-white font-medium">{formData.company_id}</p>
                </div>
                {formData.vat_id && (
                  <div>
                    <p className="text-white/60 text-xs">DIČ</p>
                    <p className="text-white font-medium">{formData.vat_id}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Kontaktní údaje</p>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-white/60 text-xs">Telefon</p>
              <p className="text-white font-medium">{formData.phone}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs">Adresa</p>
              <p className="text-white font-medium">{formData.address}, {formData.city}, {formData.postal_code}</p>
            </div>
            {clientType === 'company' && formData.reliable_person && (
              <div>
                <p className="text-white/60 text-xs">Kontaktní osoba</p>
                <p className="text-white font-medium">{formData.reliable_person}</p>
              </div>
            )}
          </div>
        </div>

        {/* Preferences - Only for persons */}
        {clientType === 'person' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Preference</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60 text-xs">Děti</p>
                <p className="text-white font-medium">{formData.has_children ? 'Ano' : 'Ne'}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs">Mazlíčci</p>
                <p className="text-white font-medium">{formData.has_pets ? 'Ano' : 'Ne'}</p>
              </div>
            </div>
            {formData.allergies_notes && (
              <div className="mt-2">
                <p className="text-white/60 text-xs">Alergie</p>
                <p className="text-white font-medium text-sm">{formData.allergies_notes}</p>
              </div>
            )}
            {formData.special_instructions && (
              <div className="mt-2">
                <p className="text-white/60 text-xs">Pokyny</p>
                <p className="text-white font-medium text-sm">{formData.special_instructions}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(4)}
          className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět
        </Button>
        <PremiumButton
          onClick={handleFinalSubmit}
          className="flex-1 h-14 rounded-xl shadow-xl bg-white text-slate-950 hover:bg-white/90"
          disabled={loading || !gdprConsent}
        >
          {loading ? "Dokončuji..." : "Dokončit registraci"}
          <Check className="ml-2 h-5 w-5" />
        </PremiumButton>
      </div>
    </div>
  );

  if (loading && step === 1) {
    return <LoadingOverlay message="Načítání..." />;
  }

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-[url('https://images.unsplash.com/photo-1527515673516-9b552e6aeeb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative p-4 pt-16 overflow-hidden">
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-black/95 to-black" />

      {/* Animated blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/25 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/25 rounded-full blur-[120px] animate-pulse delay-700" />

      <Card className="w-full max-w-md lg:max-w-5xl relative z-10 border-0 bg-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <div className="lg:grid lg:grid-cols-2">
          {/* Desktop Only Side Panel (QR Code) */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-slate-950/50 border-r border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />

            <div className="relative z-10 text-center space-y-8 max-w-sm">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Používejte v mobilu
                </h2>
                <p className="text-white/60 text-lg">
                  Pro nejlepší zážitek používejte Klinr ve svém mobilním prohlížeči.
                </p>
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-xl inline-block transform hover:scale-105 transition-transform duration-500">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.href)}`}
                  alt="QR Kód"
                  className="w-48 h-48 mix-blend-multiply"
                />
              </div>

              <div className="flex items-center justify-center gap-3 text-white/40 text-sm font-medium">
                <Smartphone className="w-5 h-5" />
                <span>Naskenujte pro otevření v mobilu</span>
              </div>
            </div>
          </div>

          {/* Login/Signup Form Section */}
          <div>
            <CardHeader className="text-center space-y-8 pt-12 pb-10">
              <div className="mx-auto flex items-center justify-center transform hover:scale-105 transition-transform duration-500 group relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl opacity-30" />
                <div className="relative z-10 bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/40">
                  <img
                    src={klinrLogoCropped}
                    alt="Klinr"
                    className="h-[42px] w-auto"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-white/80 text-sm font-semibold tracking-widest uppercase">Klientský portál</p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-10">
              {!isSignIn && renderStepIndicator()}

              {isSignIn ? (
                // Sign In Form
                <>
                  <form onSubmit={handleSignIn} className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="signin-email" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                        <Input
                          id="signin-email"
                          type="email"
                          value={signInEmail}
                          onChange={(e) => setSignInEmail(e.target.value)}
                          required
                          placeholder="josef@klinr.cz"
                          className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="signin-password" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Heslo</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                        <Input
                          id="signin-password"
                          type="password"
                          value={signInPassword}
                          onChange={(e) => setSignInPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 bg-none bg-white text-slate-900 hover:bg-slate-50 font-bold rounded-[1.25rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={loading}
                    >
                      {loading ? "Přihlašování..." : "Přihlásit se"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                      <span className="bg-[#111827]/40 px-3 text-white/40 backdrop-blur-md rounded-full border border-white/10">
                        Nebo
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSignIn(false);
                      setStep(1);
                    }}
                    className="w-full h-12 bg-white border-white text-slate-950 hover:bg-white/90 rounded-xl transition-all font-bold"
                  >
                    Vytvořit nový účet
                  </Button>
                </>
              ) : (
                // Registration Multi-Step Form
                <>
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}
                  {step === 4 && renderStep4()}
                  {/* Step 5 not needed here as 4 handles finish */}

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                      <span className="bg-[#111827]/40 px-3 text-white/40 backdrop-blur-md rounded-full border border-white/10">
                        Již máte účet?
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSignIn(true);
                      setStep(1);
                    }}
                    className="w-full h-12 bg-white border-white text-slate-950 hover:bg-white/90 rounded-xl transition-all font-bold"
                  >
                    Přihlásit se
                  </Button>
                </>
              )}
            </CardContent>
          </div>
        </div>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] drop-shadow-sm">
          &copy; 2026 KLINR &bull; All Rights Reserved
        </p>
      </div>

      {loading && <LoadingOverlay message="Pracuji na tom..." />}
    </div>
  );
}
