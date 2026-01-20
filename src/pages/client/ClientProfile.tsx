import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Save, Check, ChevronDown, FileText, User, Lock, MessageSquare, Info, Building2, MapPin, Mail, Phone, Calendar } from 'lucide-react';
import { ClientHeroHeader } from '@/components/client/ClientHeroHeader';
import { DatePicker } from '@/components/ui/date-time-picker';
import { LoadingOverlay } from "@/components/LoadingOverlay";

export default function ClientProfile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingAres, setFetchingAres] = useState(false);
  const [clientType, setClientType] = useState<string>('person');
  const companyNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    date_of_birth: '',
    company_id: '',
    dic: '',
    reliable_person: '',
    has_children: false,
    has_pets: false,
    children_notes: '',
    pets_notes: '',
    allergies_notes: '',
    special_instructions: ''
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (client) {
        setClientType(client.client_type || 'person');
        setProfileData({
          name: client.name || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          city: client.city || '',
          postal_code: client.postal_code || '',
          date_of_birth: client.date_of_birth || '',
          company_id: client.company_id || '',
          dic: client.dic || '',
          reliable_person: client.reliable_person || '',
          has_children: client.has_children || false,
          has_pets: client.has_pets || false,
          children_notes: client.notes?.includes('Children:') ? client.notes.split('Children:')[1].split('\n')[0].trim() : '',
          pets_notes: client.notes?.includes('Pets:') ? client.notes.split('Pets:')[1].split('\n')[0].trim() : '',
          allergies_notes: client.allergies_notes || '',
          special_instructions: client.special_instructions || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const fetchAresData = async (ico: string) => {
    if (!ico || ico.length < 8) return;

    setFetchingAres(true);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);

      if (!response.ok) throw new Error('Company not found');

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

      setProfileData(prev => ({
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


  const handleCompanyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProfileData(prev => ({
      ...prev,
      company_id: value,
    }));

    // Auto-fetch when IČO has 8 digits
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 8) {
      fetchAresData(cleanValue);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validation
    if (!clientType || !profileData.name || !profileData.email || !profileData.phone || !profileData.address || !profileData.city || !profileData.postal_code) {
      toast({
        variant: 'destructive',
        title: 'Chybí povinná pole',
        description: 'Prosím vyberte typ klienta a vyplňte všechna povinná pole.',
      });
      return;
    }

    if (clientType === 'company' && !profileData.company_id) {
      toast({
        variant: 'destructive',
        title: 'Chybí IČO',
        description: 'Pro firmu je IČO povinné.',
      });
      return;
    }

    if (clientType === 'company' && !profileData.reliable_person) {
      toast({
        variant: 'destructive',
        title: 'Chybí kontaktní osoba',
        description: 'Pro firmu je kontaktní osoba povinná.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          client_type: clientType,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postal_code,
          date_of_birth: clientType === 'person' ? profileData.date_of_birth : null,
          company_id: clientType === 'company' ? profileData.company_id : null,
          dic: clientType === 'company' ? profileData.dic : null,
          reliable_person: clientType === 'company' ? profileData.reliable_person : null,
          has_children: profileData.has_children,
          has_pets: profileData.has_pets,
          allergies_notes: profileData.allergies_notes,
          special_instructions: profileData.special_instructions
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profil aktualizován',
        description: 'Vaše změny byly uloženy.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba uložení',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Chybí údaje',
        description: 'Prosím vyplňte všechna pole.',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Hesla se neshodují',
        description: 'Nové heslo a potvrzení hesla musí být stejné.',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Slabé heslo',
        description: 'Heslo musí mít alespoň 6 znaků.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: 'Heslo změněno',
        description: 'Vaše heslo bylo úspěšně aktualizováno.',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba změny hesla',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profileData.email) {
    return <LoadingOverlay message="Načítám Váš profil..." />;
  }

  return (
    <div className="container mx-auto p-4 pb-20 space-y-6 max-w-5xl">
      {/* Hero Header */}
      <ClientHeroHeader
        icon={User}
        title={profileData.name || "Můj Profil"}
        subtitle="Spravujte své osobní údaje a preference"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Collapsible open={isBasicInfoOpen} onOpenChange={setIsBasicInfoOpen} className="w-full">
            <Card className="border-0 shadow-sm overflow-hidden transition-all duration-300">
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-6 cursor-pointer hover:bg-primary/5 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                        <User className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-xl font-bold">Základní Údaje</CardTitle>
                        <CardDescription>Osobní a kontaktní informace</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isBasicInfoOpen && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6 space-y-6">
                  {/* Client Type */}
                  <div className="space-y-3">

                    <div className="grid grid-cols-2 gap-3 p-1 bg-muted/50 rounded-xl">
                      <Button
                        type="button"
                        variant={clientType === 'person' ? 'default' : 'ghost'}
                        className={`h-10 rounded-lg transition-all duration-300 ${clientType === 'person' ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setClientType('person')}
                      >
                        Osoba
                      </Button>
                      <Button
                        type="button"
                        variant={clientType === 'company' ? 'default' : 'ghost'}
                        className={`h-10 rounded-lg transition-all duration-300 ${clientType === 'company' ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => setClientType('company')}
                      >
                        Firma
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {clientType === 'company' && (
                      <>
                        <div className="space-y-2 relative">
                          <Label className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            IČO *
                          </Label>
                          <Input
                            required
                            value={profileData.company_id}
                            onChange={handleCompanyIdChange}
                            placeholder="12345678"
                            disabled={fetchingAres}
                            className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                          />
                          {fetchingAres && (
                            <span className="absolute right-3 top-9">
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            DIČ
                          </Label>
                          <Input
                            value={profileData.dic}
                            onChange={(e) => setProfileData({ ...profileData, dic: e.target.value })}
                            placeholder="CZ12345678"
                            className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                          />
                        </div>
                      </>
                    )}

                    <div className={`space-y-2 ${clientType === 'company' ? 'md:col-span-2' : ''}`}>
                      <Label className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        {clientType === 'company' ? 'Název firmy *' : 'Celé jméno *'}
                      </Label>
                      <Input
                        required
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={fetchingAres}
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                        placeholder={clientType === 'company' ? 'Název firmy' : 'Jan Novák'}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        Email *
                      </Label>
                      <Input
                        required
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        Telefon *
                      </Label>
                      <Input
                        required
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+420 123 456 789"
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    {clientType === 'person' && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Datum narození
                        </Label>
                        <DatePicker
                          value={profileData.date_of_birth ? new Date(profileData.date_of_birth) : undefined}
                          onChange={(date) => setProfileData({
                            ...profileData,
                            date_of_birth: date ? date.toISOString().split('T')[0] : ''
                          })}
                          placeholder=""
                          disabledDates={(date) => date > new Date()}
                        />
                      </div>
                    )}

                    <div className="space-y-2 md:col-span-2">
                      <Label className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Adresa *
                      </Label>
                      <Input
                        required
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Město *</Label>
                      <Input
                        required
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>PSČ *</Label>
                      <Input
                        required
                        value={profileData.postal_code}
                        onChange={(e) => setProfileData({ ...profileData, postal_code: e.target.value })}
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                      />
                    </div>

                    {clientType === 'company' && (
                      <div className="space-y-2 md:col-span-2">
                        <Label>Kontaktní osoba *</Label>
                        <Input
                          required
                          value={profileData.reliable_person}
                          onChange={(e) => setProfileData({ ...profileData, reliable_person: e.target.value })}
                          className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button className="w-full h-12 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all" onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Ukládám..." : "Uložit Změny"}
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {/* Right Column: Preferences & Security */}
        <div className="space-y-6">
          {/* Dodatečné informace (only for persons) */}
          {clientType === 'person' && (
            <Collapsible open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen} className="w-full">
              <Card className="border-0 shadow-sm overflow-hidden transition-all duration-300">
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-6 cursor-pointer hover:bg-primary/5 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                          <Info className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-left">
                          <CardTitle className="text-xl font-bold">Vaše Preference</CardTitle>
                          <CardDescription>Detaily úklidu</CardDescription>
                        </div>
                      </div>
                      <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isPreferencesOpen && "rotate-180")} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/50">
                        <div className="space-y-0.5">
                          <Label className="text-base">Děti v domácnosti</Label>
                          <p className="text-xs text-muted-foreground">Máte doma děti?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-1 bg-muted/50 rounded-xl">
                          <Button
                            type="button"
                            variant={profileData.has_children ? 'default' : 'ghost'}
                            className={`h-10 rounded-lg transition-all duration-300 ${profileData.has_children ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setProfileData({ ...profileData, has_children: true })}
                          >
                            Ano
                          </Button>
                          <Button
                            type="button"
                            variant={!profileData.has_children ? 'default' : 'ghost'}
                            className={`h-10 rounded-lg transition-all duration-300 ${!profileData.has_children ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setProfileData({ ...profileData, has_children: false })}
                          >
                            Ne
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted/50">
                        <div className="space-y-0.5">
                          <Label className="text-base">Domácí mazlíčci</Label>
                          <p className="text-xs text-muted-foreground">Máte doma zvířata?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 p-1 bg-muted/50 rounded-xl">
                          <Button
                            type="button"
                            variant={profileData.has_pets ? 'default' : 'ghost'}
                            className={`h-10 rounded-lg transition-all duration-300 ${profileData.has_pets ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setProfileData({ ...profileData, has_pets: true })}
                          >
                            Ano
                          </Button>
                          <Button
                            type="button"
                            variant={!profileData.has_pets ? 'default' : 'ghost'}
                            className={`h-10 rounded-lg transition-all duration-300 ${!profileData.has_pets ? 'shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setProfileData({ ...profileData, has_pets: false })}
                          >
                            Ne
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Alergie</Label>
                        <Textarea
                          value={profileData.allergies_notes}
                          onChange={(e) => setProfileData({ ...profileData, allergies_notes: e.target.value })}
                          placeholder="Máte nějaké alergie na čistící prostředky?"
                          rows={2}
                          className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 resize-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Specifické pokyny</Label>
                        <Textarea
                          value={profileData.special_instructions}
                          onChange={(e) => setProfileData({ ...profileData, special_instructions: e.target.value })}
                          placeholder="Klíče jsou u sousedů, prosím nepoužívat páru v ložnici..."
                          rows={3}
                          className="bg-muted/30 border-muted-foreground/20 focus:border-primary/50 resize-none"
                        />
                      </div>

                      <Button
                        variant="outline"
                        className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary font-bold"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Uložit preference a pokyny
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Change Password */}
          <Collapsible open={isSecurityOpen} onOpenChange={setIsSecurityOpen} className="w-full">
            <Card className="border-0 shadow-sm overflow-hidden transition-all duration-300">
              <CollapsibleTrigger asChild>
                <CardHeader className="bg-gradient-to-r from-slate-500/10 to-transparent pb-6 cursor-pointer hover:bg-slate-500/5 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-800 shadow-lg shadow-slate-800/20 group-hover:scale-110 transition-transform">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-xl font-bold">Zabezpečení</CardTitle>
                        <CardDescription>Změna hesla</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-300", isSecurityOpen && "rotate-180")} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Současné heslo"
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Nové heslo (min. 6 znaků)"
                      className="bg-muted/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Potvrdit nové heslo"
                      className="bg-muted/30"
                    />
                  </div>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={handlePasswordChange}
                    disabled={loading}
                  >
                    Změnit Heslo
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Button
            variant="outline"
            className="w-full py-4 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásit se
          </Button>
        </div>
      </div>
    </div>
  );
}
