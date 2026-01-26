import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import drcleanIcon from '@/assets/drclean-icon.png';
import { Mail, Lock, User, Building2, MapPin, Phone, Calendar, FileText, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-time-picker';

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
  const [step, setStep] = useState(1);
  const [clientType, setClientType] = useState<ClientType>('person');
  const [verificationCode, setVerificationCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [fetchingAres, setFetchingAres] = useState(false);
  const companyIdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState({
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
    date_of_birth: '',
    dic: '',
    reliable_person: '',

    // Step 4 (Osoba)
    has_children: false,
    has_pets: false,
    allergies_notes: '',
    special_instructions: '',
    referral_code: ''
  });

  useEffect(() => {
    if (user && profile?.roles?.includes('client')) {
      navigate('/klient', { replace: true });
    }
  }, [user, profile, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

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

  const fetchAresData = async (ico: string) => {
    if (!ico || ico.length < 8) return;

    setFetchingAres(true);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);

      if (!response.ok) throw new Error('Firma nenalezena');

      const data = await response.json();

      const companyName = data.obchodniJmeno || '';
      const dic = data.dic || '';

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
        dic: dic || prev.dic,
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
        referredById = referee.id;
      }

      // Send OTP to email using Supabase
      const { data, error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          shouldCreateUser: false, // We'll create the user after verification
          data: {
            referred_by_id: referredById, // Temporarily store in metadata if needed, but we'll use local state
          }
        }
      });

      if (error) throw error;

      setResendTimer(60);
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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (verificationCode.length !== 6) {
        throw new Error('Zadejte 6-místný kód');
      }

      // Verify OTP with Supabase
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: verificationCode,
        type: 'email'
      });

      if (error) throw error;

      setStep(3);
      toast({
        title: "Email ověřen!",
        description: "Pokračujte v registraci",
        duration: 1500,
      });
    } catch (error: any) {
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

      setResendTimer(60);
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

  const handleStep3Submit = (e: React.FormEvent) => {
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

    setStep(4);
  };

  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(5); // Go to summary
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/klient`,
          data: {
            full_name: formData.name,
            is_client: true,
          }
        }
      });

      // Look up referred_by_id again for the final step
      let finalReferredById = null;
      if (formData.referral_code) {
        const { data: referee } = await supabase
          .from('clients')
          .select('id')
          .eq('referral_code', formData.referral_code.toUpperCase())
          .maybeSingle();
        finalReferredById = referee?.id;
      }

      if (authError) throw authError;
      if (!authData.user) throw new Error('Nepodařilo se vytvořit uživatele');

      // Create client record
      const { error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: authData.user.id,
          client_type: clientType,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          date_of_birth: clientType === 'person' ? formData.date_of_birth || null : null,
          company_id: clientType === 'company' ? formData.company_id : null,
          dic: clientType === 'company' ? formData.dic || null : null,
          reliable_person: clientType === 'company' ? formData.reliable_person : null,
          has_children: clientType === 'person' ? formData.has_children : false,
          has_pets: clientType === 'person' ? formData.has_pets : false,
          allergies_notes: clientType === 'person' ? formData.allergies_notes || null : null,
          special_instructions: clientType === 'person' ? formData.special_instructions || null : null,
          referred_by_id: finalReferredById,
          client_source: 'App'
        });

      if (clientError) throw clientError;

      // Assign client role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'client'
        });

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      toast({
        title: "Registrace dokončena!",
        description: "Vítejte v DrClean",
        duration: 1500,
      });

      // Navigate to client dashboard
      navigate('/klient');
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
    const totalSteps = 5;
    const stepLabels = ['Typ', 'Ověření', 'Údaje', clientType === 'person' ? 'Prefer.' : 'Detail', 'Shrnutí'];

    return (
      <div className="mb-10 w-full px-1">
        <div
          className="grid grid-cols-5 w-full gap-0 mb-5"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            width: '100%'
          }}
        >
          {stepLabels.map((label, index) => (
            <div key={index} className="flex flex-col items-center min-w-0">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-lg sm:text-2xl font-black transition-all ${step > index + 1 ? 'bg-white text-slate-950' :
                step === index + 1 ? 'bg-primary text-white ring-2 sm:ring-4 ring-primary/20 shadow-lg shadow-primary/20' :
                  'bg-white/10 text-white/40'
                }`}>
                {step > index + 1 ? <Check className="w-7 h-7 sm:w-9 sm:h-9" /> : index + 1}
              </div>
              <span className={`text-[13px] sm:text-xl mt-2.5 font-black text-center leading-none truncate w-full px-0.5 tracking-tight ${step === index + 1 ? 'text-white' : 'text-white/40'
                }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
            style={{ width: `${(step / totalSteps) * 100}%` }}
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
            variant={clientType === 'person' ? 'default' : 'ghost'}
            className={`h-12 rounded-lg transition-all duration-300 ${clientType === 'person'
              ? 'bg-white text-slate-950 shadow-lg hover:bg-primary/10'
              : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            onClick={() => setClientType('person')}
          >
            <User className="w-4 h-4 mr-2" />
            Osoba
          </Button>
          <Button
            type="button"
            variant={clientType === 'company' ? 'default' : 'ghost'}
            className={`h-12 rounded-lg transition-all duration-300 ${clientType === 'company'
              ? 'bg-white text-slate-950 shadow-lg hover:bg-primary/10'
              : 'text-white/70 hover:text-white hover:bg-white/5'
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

      <Button
        type="submit"
        className="w-full h-14 bg-white text-slate-950 hover:bg-primary/10 font-bold rounded-[1.25rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        disabled={loading}
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

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 bg-white text-slate-950 hover:bg-primary/10 font-bold rounded-xl shadow-lg"
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? "Ověřuji..." : "Ověřit kód"}
        </Button>
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
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
            placeholder="+420 777 123 456"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2.5">
        <Label htmlFor="address" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">Adresa *</Label>
        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
            disabled={fetchingAres && clientType === 'company'}
            placeholder="Ulice a číslo popisné"
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-11 rounded-2xl focus-visible:ring-white/20 focus-visible:border-white/20 transition-all"
          />
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

      {/* Date of Birth - Only for persons */}
      {clientType === 'person' && (
        <div className="space-y-2.5">
          <Label htmlFor="dob" className="text-white/80 text-xs font-bold uppercase tracking-wider ml-1">
            Datum narození
          </Label>
          <div className="relative">
            <DatePicker
              value={formData.date_of_birth ? new Date(formData.date_of_birth) : undefined}
              onChange={(date) => setFormData({
                ...formData,
                date_of_birth: date ? date.toISOString().split('T')[0] : ''
              })}
              placeholder="Vyberte datum"
              disabledDates={(date) => date > new Date()}
            />
          </div>
        </div>
      )}

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

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(2)}
          className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 bg-white text-slate-950 hover:bg-primary/10 font-bold rounded-xl shadow-lg"
        >
          Pokračovat
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zpět
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 bg-white text-slate-950 hover:bg-primary/10 font-bold rounded-xl shadow-lg"
            >
              Pokračovat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
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
              variant={formData.has_children ? 'default' : 'ghost'}
              className={`h-10 rounded-lg transition-all ${formData.has_children
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              onClick={() => setFormData({ ...formData, has_children: true })}
            >
              Ano
            </Button>
            <Button
              type="button"
              variant={!formData.has_children ? 'default' : 'ghost'}
              className={`h-10 rounded-lg transition-all ${!formData.has_children
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
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
              variant={formData.has_pets ? 'default' : 'ghost'}
              className={`h-10 rounded-lg transition-all ${formData.has_pets
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              onClick={() => setFormData({ ...formData, has_pets: true })}
            >
              Ano
            </Button>
            <Button
              type="button"
              variant={!formData.has_pets ? 'default' : 'ghost'}
              className={`h-10 rounded-lg transition-all ${!formData.has_pets
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-white/70 hover:text-white hover:bg-white/5'
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

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(3)}
            className="flex-1 h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-white text-slate-950 hover:bg-primary/10 font-bold rounded-xl shadow-lg"
          >
            Pokračovat
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
                {formData.dic && (
                  <div>
                    <p className="text-white/60 text-xs">DIČ</p>
                    <p className="text-white font-medium">{formData.dic}</p>
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
        <Button
          onClick={handleFinalSubmit}
          className="flex-1 h-14 bg-gradient-to-r from-green-500 to-primary text-white hover:from-green-600 hover:to-primary-hover font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
          disabled={loading}
        >
          {loading ? "Dokončuji..." : "Dokončit registraci"}
          <Check className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );

  if (loading && step === 1) {
    return <LoadingOverlay message="Načítání..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1527515673516-9b552e6aeeb4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center relative p-4 overflow-hidden">
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-black/95 to-black" />

      {/* Animated blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/25 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/25 rounded-full blur-[120px] animate-pulse delay-700" />

      <Card className="w-full max-w-md relative z-10 border-0 bg-white/10 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-700">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        <CardHeader className="text-center space-y-6 pt-10 pb-8">
          <div className="mx-auto h-24 w-24 flex items-center justify-center transform hover:scale-105 transition-transform duration-500 group">
            <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all opacity-70" />
            <img
              src={drcleanIcon}
              alt="DrClean"
              className="h-20 w-20 relative z-10 drop-shadow-2xl animate-spin-pulse"
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              DrClean
            </CardTitle>
            <p className="text-white/80 text-sm font-semibold">Klientský portál</p>
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
                      placeholder="vas@email.cz"
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
                  className="w-full h-14 bg-white text-slate-950 hover:bg-primary/10 font-bold rounded-[1.25rem] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all"
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
              {step === 5 && renderStep5Summary()}

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
                className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl transition-all"
              >
                Přihlásit se
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] drop-shadow-sm">
          &copy; 2026 DRCLEAN &bull; All Rights Reserved
        </p>
      </div>

      {loading && <LoadingOverlay message="Pracuji na tom..." />}
    </div>
  );
}
