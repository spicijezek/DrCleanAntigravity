import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, MapPin, User, Clock, Banknote, Sparkles,
  Settings, FileText, Users, DollarSign, Info, Shield,
  ChevronRight, CheckCircle2, AlertCircle, Plus,
  Baby, Dog, HeartPulse, StickyNote, Building2, AppWindow, Sofa,
  Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  kalkulujUklidDomacnosti400,
  kalkulujUklidFirmy,
  kalkulujMytiOken,
  kalkulujCalouneni,
  DirtinessLevel,
  FrequencyType,
  OfficeDirtinessLevel,
  OfficeFrequencyType,
  OfficeSpaceType,
  WindowDirtinessLevel,
  WindowObjectType,
  UpholsteryDirtinessLevel,
  CarpetType,
  SofaSize,
  MattressSize,
  MattressSides
} from '@/lib/cleaningCalculator';

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  teamMembers: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; name: string; user_id: string }>;
}

export function CreateBookingDialog({ open, onOpenChange, onSuccess, teamMembers, clients }: CreateBookingDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checklists, setChecklists] = useState<Array<{ id: string; street: string; city: string | null; postal_code: string | null }>>([]);

  const [formData, setFormData] = useState({
    client_id: '',
    user_id: '',
    service_type: 'cleaning' as 'cleaning' | 'window_cleaning' | 'upholstery_cleaning',
    cleaning_category: 'osobni' as 'osobni' | 'firemni',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '08:00',
    address: '',
    status: 'approved',
    team_member_ids: [] as string[],
    admin_notes: '',
    checklist_id: '' as string | null,
    price: 0,
    manual_loyalty_points: 0,
    manual_team_reward: 0,
    client_preferences: {
      has_allergies: false,
      allergies_notes: '',
      has_children: false,
      has_pets: false,
      special_instructions: ''
    },
    booking_details: {
      service_title: 'Úklid',
      plocha_m2: 50,
      pocet_koupelen: 1,
      pocet_kuchyni: 1,
      pocet_wc: 1,
      pocet_kuchynek: 1,
      typ_domacnosti: 'byt',
      typ_prostoru: 'kancelar' as OfficeSpaceType,
      znecisteni: 'stredni',
      frekvence: 'jednorazove',
      equipment_option: 'with',
      notes: '',
      plocha_oken_m2: 10,
      znecisteni_okna: 'stredni' as WindowDirtinessLevel,
      typ_objektu_okna: 'byt' as WindowObjectType,
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
    } as any
  });

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });

  const handleClientChange = async (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);

    const { data: fullClient } = await supabase
      .from('clients')
      .select('address, city, postal_code, has_allergies, allergies_notes, has_children, has_pets, special_instructions')
      .eq('id', clientId)
      .single();

    const clientAddress = fullClient
      ? [fullClient.address, fullClient.city, fullClient.postal_code].filter(Boolean).join(', ')
      : '';

    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      user_id: selectedClient?.user_id || '',
      address: clientAddress || prev.address,
      checklist_id: null,
      client_preferences: {
        has_allergies: fullClient?.has_allergies || false,
        allergies_notes: fullClient?.allergies_notes || '',
        has_children: fullClient?.has_children || false,
        has_pets: fullClient?.has_pets || false,
        special_instructions: fullClient?.special_instructions || ''
      }
    }));

    if (clientId) {
      const { data, error } = await supabase
        .from('client_checklists')
        .select('id, street, city, postal_code')
        .eq('client_id', clientId);

      if (!error && data) {
        setChecklists(data);
      }
    } else {
      setChecklists([]);
    }
  };

  const handleServiceChange = (type: any) => {
    const titles: Record<string, string> = {
      'cleaning': 'Úklid',
      'window_cleaning': 'Mytí Oken',
      'upholstery_cleaning': 'Čištění Čalounění'
    };

    setFormData(prev => ({
      ...prev,
      service_type: type,
      booking_details: {
        ...prev.booking_details,
        service_title: titles[type] || 'Úklid'
      }
    }));
  };

  useEffect(() => {
    let result = { min: 0, max: 0 };
    const details = formData.booking_details;

    if (formData.service_type === 'cleaning') {
      if (formData.cleaning_category === 'osobni') {
        const homeRes = kalkulujUklidDomacnosti400({
          plocha_m2: details.plocha_m2,
          pocet_koupelen: details.pocet_koupelen,
          pocet_kuchyni: details.pocet_kuchyni,
          znecisteni: details.znecisteni as DirtinessLevel,
          frekvence: details.frekvence as FrequencyType
        });

        const equipmentFee = details.equipment_option === 'without' ? 290 : 0;
        result = {
          min: homeRes.priceMin + equipmentFee,
          max: homeRes.priceMax + equipmentFee
        };
      } else {
        const officeRes = kalkulujUklidFirmy({
          plocha_m2: details.plocha_m2,
          pocet_wc: details.pocet_wc,
          pocet_kuchynek: details.pocet_kuchynek,
          typ_prostoru: details.typ_prostoru as OfficeSpaceType,
          znecisteni: details.znecisteni as OfficeDirtinessLevel,
          frekvence: details.frekvence as OfficeFrequencyType,
          doba: 'denni',
          doplnky: []
        });

        const equipmentFee = details.equipment_option === 'without' ? 290 : 0;
        result = {
          min: officeRes.priceMin + equipmentFee,
          max: officeRes.priceMax + equipmentFee
        };
      }
    } else if (formData.service_type === 'window_cleaning') {
      const windowRes = kalkulujMytiOken({
        plocha_m2: details.plocha_oken_m2,
        pocet_oken: details.plocha_oken_m2, // Using plocha as pocet as per user request to remove pocet_oken field
        znecisteni: details.znecisteni_okna as WindowDirtinessLevel,
        typ_objektu: details.typ_objektu_okna as WindowObjectType
      });
      result = { min: windowRes.priceMin, max: windowRes.priceMax };
    } else if (formData.service_type === 'upholstery_cleaning') {
      const upholsteryRes = kalkulujCalouneni({
        koberce: details.koberce,
        typ_koberec: details.typ_koberec,
        plocha_koberec: details.plocha_koberec,
        znecisteni_koberec: details.znecisteni_koberec,
        sedacka: details.sedacka,
        velikost_sedacka: details.velikost_sedacka,
        znecisteni_sedacka: details.znecisteni_sedacka,
        matrace: details.matrace,
        velikost_matrace: details.velikost_matrace,
        strany_matrace: details.strany_matrace,
        znecisteni_matrace: details.znecisteni_matrace,
        kresla: details.kresla,
        pocet_kresla: details.pocet_kresla,
        znecisteni_kresla: details.znecisteni_kresla,
        zidle: details.zidle,
        pocet_zidle: details.pocet_zidle,
        znecisteni_zidle: details.znecisteni_zidle
      });
      result = { min: upholsteryRes.priceMin, max: upholsteryRes.priceMax };
    }

    setPriceRange(result);
    // Auto-update price only if it's currently 0 or near the range
    if (formData.price === 0) {
      setFormData(prev => ({ ...prev, price: result.min }));
    }
  }, [formData.service_type, formData.cleaning_category, formData.booking_details]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.client_id || !formData.service_type || !formData.scheduled_date || !formData.address) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: 'Prosím vyplňte všechna povinná pole (Klient, Typ, Datum, Adresa)'
      });
      return;
    }

    setLoading(true);

    try {
      const [y, m, d] = formData.scheduled_date.split('-').map(Number);
      const [hh, mm] = formData.scheduled_time.split(':').map(Number);
      const scheduledDateTime = new Date(y, m - 1, d, hh, mm).toISOString();

      const finalBookingDetails = {
        ...formData.booking_details,
        cleaning_type: formData.service_type === 'cleaning' ? formData.cleaning_category : undefined,
        priceEstimate: {
          price: formData.price,
          priceMin: priceRange.min,
          priceMax: priceRange.max
        },
        manual_loyalty_points: formData.manual_loyalty_points,
        manual_team_reward: formData.manual_team_reward
      };

      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: formData.client_id,
          user_id: formData.user_id,
          service_type: formData.service_type,
          scheduled_date: scheduledDateTime,
          address: formData.address,
          status: formData.status,
          team_member_ids: formData.team_member_ids,
          admin_notes: formData.admin_notes,
          booking_details: finalBookingDetails,
          checklist_id: (formData.checklist_id && formData.checklist_id !== 'none') ? formData.checklist_id : null
        });

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Rezervace byla úspěšně vytvořena'
      });
      onSuccess();
      onOpenChange(false);

      setFormData({
        client_id: '',
        user_id: '',
        service_type: 'cleaning',
        cleaning_category: 'osobni',
        scheduled_date: new Date().toISOString().split('T')[0],
        scheduled_time: '08:00',
        address: '',
        status: 'approved',
        team_member_ids: [],
        admin_notes: '',
        checklist_id: null,
        price: 0,
        manual_loyalty_points: 0,
        manual_team_reward: 0,
        client_preferences: {
          has_allergies: false,
          allergies_notes: '',
          has_children: false,
          has_pets: false,
          special_instructions: ''
        },
        booking_details: {
          service_title: 'Úklid',
          plocha_m2: 50,
          pocet_koupelen: 1,
          pocet_kuchyni: 1,
          znecisteni: 'stredni',
          frekvence: 'jednorazove',
          equipment_option: 'with',
          notes: '',
          // Upholstery defaults
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
          znecisteni_zidle: 'Nízké',
          // Window defaults
          plocha_oken_m2: 0,
          znecisteni_okna: 'nizke',
          typ_objektu_okna: 'byt'
        } as any
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingDetail = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      booking_details: {
        ...prev.booking_details,
        [key]: value
      }
    }));
  };

  const toggleTeamMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      team_member_ids: prev.team_member_ids.includes(memberId)
        ? prev.team_member_ids.filter(id => id !== memberId)
        : [...prev.team_member_ids, memberId]
    }));
  };

  const prevPriceRef = useRef(0);

  useEffect(() => {
    const autoPoints = Math.round(formData.price * 0.27);
    if (formData.manual_loyalty_points === 0 || formData.manual_loyalty_points === Math.round((prevPriceRef.current || 0) * 0.27)) {
      setFormData(prev => ({ ...prev, manual_loyalty_points: autoPoints }));
    }
    prevPriceRef.current = formData.price;
  }, [formData.price]);

  const renderServiceFields = () => {
    const details = formData.booking_details;

    if (formData.service_type === 'cleaning') {
      const isOsobni = formData.cleaning_category === 'osobni';
      return (
        <div className="space-y-6 p-6 bg-muted/20 rounded-xl border border-border/50">
          <div className="flex gap-4 p-1 bg-background rounded-lg border border-border w-fit">
            <Button
              type="button"
              variant={isOsobni ? 'default' : 'ghost'}
              size="sm"
              className="rounded-md font-bold uppercase tracking-tight"
              onClick={() => setFormData(p => ({ ...p, cleaning_category: 'osobni' }))}
            >
              <User className="h-4 w-4 mr-2" /> Domácnost
            </Button>
            <Button
              type="button"
              variant={!isOsobni ? 'default' : 'ghost'}
              size="sm"
              className="rounded-md font-bold uppercase tracking-tight"
              onClick={() => setFormData(p => ({ ...p, cleaning_category: 'firemni' }))}
            >
              <Building2 className="h-4 w-4 mr-2" /> Firma
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Plocha (m²)</Label>
              <Input
                type="number"
                value={details.plocha_m2}
                onChange={(e) => updateBookingDetail('plocha_m2', Number(e.target.value))}
                className="h-11 rounded-lg border-border font-medium"
              />
            </div>
            {isOsobni ? (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet koupelen</Label>
                  <Input
                    type="number"
                    value={details.pocet_koupelen}
                    onChange={(e) => updateBookingDetail('pocet_koupelen', Number(e.target.value))}
                    className="h-11 rounded-lg border-border font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet kuchyní</Label>
                  <Input
                    type="number"
                    value={details.pocet_kuchyni}
                    onChange={(e) => updateBookingDetail('pocet_kuchyni', Number(e.target.value))}
                    className="h-11 rounded-lg border-border font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Typ domácnosti</Label>
                  <Select value={details.typ_domacnosti} onValueChange={(v) => updateBookingDetail('typ_domacnosti', v)}>
                    <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="byt">Byt</SelectItem>
                      <SelectItem value="rodinny_dum">Rodinný dům</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet WC</Label>
                  <Input
                    type="number"
                    value={details.pocet_wc}
                    onChange={(e) => updateBookingDetail('pocet_wc', Number(e.target.value))}
                    className="h-11 rounded-lg border-border font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet kuchyněk</Label>
                  <Input
                    type="number"
                    value={details.pocet_kuchynek}
                    onChange={(e) => updateBookingDetail('pocet_kuchynek', Number(e.target.value))}
                    className="h-11 rounded-lg border-border font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Typ objektu</Label>
                  <Select value={details.typ_prostoru} onValueChange={(v) => updateBookingDetail('typ_prostoru', v)}>
                    <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kancelar">Kancelář</SelectItem>
                      <SelectItem value="obchod">Obchod</SelectItem>
                      <SelectItem value="sklad">Sklad</SelectItem>
                      <SelectItem value="vyroba">Výroba</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
              <Select value={details.znecisteni} onValueChange={(v) => updateBookingDetail('znecisteni', v)}>
                <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nizka">Nízké</SelectItem>
                  <SelectItem value="stredni">Střední</SelectItem>
                  <SelectItem value="vysoka">Vysoké</SelectItem>
                  {!isOsobni && <SelectItem value="extremni">Extrémní</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Frekvence</Label>
              <Select value={details.frekvence} onValueChange={(v) => updateBookingDetail('frekvence', v)}>
                <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jednorazove">Jednorázový</SelectItem>
                  <SelectItem value="mesicne">Měsíčně</SelectItem>
                  <SelectItem value="tydne">Každý týden</SelectItem>
                  {!isOsobni && <SelectItem value="denne">Denně</SelectItem>}
                  {isOsobni && <SelectItem value="ctyrtydne">Každé 2 týdny</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Vybavení</Label>
              <Select value={details.equipment_option} onValueChange={(v) => updateBookingDetail('equipment_option', v)}>
                <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="with">Mám vlastní</SelectItem>
                  <SelectItem value="without">Přivezte vlastní (+290 Kč)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    switch (formData.service_type) {
      case 'window_cleaning':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-muted/20 rounded-xl border border-border/50">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Plocha oken (m²)</Label>
              <Input
                type="number"
                value={details.plocha_oken_m2}
                onChange={(e) => updateBookingDetail('plocha_oken_m2', Number(e.target.value))}
                className="h-11 rounded-lg border-border font-medium"
                placeholder="Např. 8 m²"
              />
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">*přibližná plocha jedné strany oken (m²)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
              <Select value={details.znecisteni_okna} onValueChange={(v) => updateBookingDetail('znecisteni_okna', v)}>
                <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nizke">Nízké</SelectItem>
                  <SelectItem value="stredni">Střední</SelectItem>
                  <SelectItem value="vysoke">Vysoké</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Typ objektu</Label>
              <Select value={details.typ_objektu_okna} onValueChange={(v) => updateBookingDetail('typ_objektu_okna', v)}>
                <SelectTrigger className="h-11 rounded-lg border-border font-medium"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="byt">Byt / Dům</SelectItem>
                  <SelectItem value="kancelar">Kancelář / Obchod</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'upholstery_cleaning':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-muted/20 rounded-2xl border border-border/50">
            <div className="space-y-6">
              {/* Koberec */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-background rounded-xl border border-border shadow-sm">
                  <Checkbox
                    checked={details.koberce}
                    onCheckedChange={(checked) => updateBookingDetail('koberce', checked)}
                    id="koberce"
                  />
                  <Label htmlFor="koberce" className="font-black text-xs uppercase tracking-wider cursor-pointer">Koberec</Label>
                </div>
                {details.koberce && (
                  <div className="grid grid-cols-1 gap-4 ml-8 animate-in fade-in slide-in-from-left-4 pb-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Typ koberce</Label>
                      <Select value={details.typ_koberec} onValueChange={(v) => updateBookingDetail('typ_koberec', v)}>
                        <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kusový">Kusový</SelectItem>
                          <SelectItem value="Pokládkový – krátký vlas">Pokládkový – krátký vlas</SelectItem>
                          <SelectItem value="Pokládkový – dlouhý vlas">Pokládkový – dlouhý vlas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Plocha (m²)</Label>
                        <Input
                          type="number"
                          value={details.plocha_koberec || 0}
                          onChange={(e) => updateBookingDetail('plocha_koberec', Number(e.target.value))}
                          className="h-10 rounded-lg border-border font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
                        <Select value={details.znecisteni_koberec} onValueChange={(v) => updateBookingDetail('znecisteni_koberec', v)}>
                          <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
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
              </div>

              {/* Sedačka */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-background rounded-xl border border-border shadow-sm">
                  <Checkbox
                    checked={details.sedacka}
                    onCheckedChange={(checked) => updateBookingDetail('sedacka', checked)}
                    id="sedacka"
                  />
                  <Label htmlFor="sedacka" className="font-black text-xs uppercase tracking-wider cursor-pointer">Sedačka</Label>
                </div>
                {details.sedacka && (
                  <div className="grid grid-cols-1 gap-4 ml-8 animate-in fade-in slide-in-from-left-4 pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet míst</Label>
                        <Select value={details.velikost_sedacka} onValueChange={(v) => updateBookingDetail('velikost_sedacka', v)}>
                          <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2-místná">2-místná</SelectItem>
                            <SelectItem value="3-místná">3-místná</SelectItem>
                            <SelectItem value="4-místná">4-místná</SelectItem>
                            <SelectItem value="5-místná">5-místná</SelectItem>
                            <SelectItem value="6-místná">6-místná</SelectItem>
                            <SelectItem value="Rohová">Rohová</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
                        <Select value={details.znecisteni_sedacka} onValueChange={(v) => updateBookingDetail('znecisteni_sedacka', v)}>
                          <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
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
              </div>

              {/* Matrace */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-background rounded-xl border border-border shadow-sm">
                  <Checkbox
                    checked={details.matrace}
                    onCheckedChange={(checked) => updateBookingDetail('matrace', checked)}
                    id="matrace"
                  />
                  <Label htmlFor="matrace" className="font-black text-xs uppercase tracking-wider cursor-pointer">Matrace</Label>
                </div>
                {details.matrace && (
                  <div className="grid grid-cols-1 gap-4 ml-8 animate-in fade-in slide-in-from-left-4 pb-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Šířka (cm)</Label>
                        <Select value={details.velikost_matrace} onValueChange={(v) => updateBookingDetail('velikost_matrace', v)}>
                          <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="90">90 cm</SelectItem>
                            <SelectItem value="140">140 cm</SelectItem>
                            <SelectItem value="160">160 cm</SelectItem>
                            <SelectItem value="180">180 cm</SelectItem>
                            <SelectItem value="200">200 cm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Strany</Label>
                        <Select value={details.strany_matrace} onValueChange={(v) => updateBookingDetail('strany_matrace', v)}>
                          <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1 strana">1 strana</SelectItem>
                            <SelectItem value="obě strany">Obě strany</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
                        <Select value={details.znecisteni_matrace} onValueChange={(v) => updateBookingDetail('znecisteni_matrace', v)}>
                          <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
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
              </div>
            </div>

            <div className="space-y-6">
              {/* Křesla */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-background rounded-xl border border-border shadow-sm">
                  <Checkbox
                    checked={details.kresla}
                    onCheckedChange={(checked) => updateBookingDetail('kresla', checked)}
                    id="kresla"
                  />
                  <Label htmlFor="kresla" className="font-black text-xs uppercase tracking-wider cursor-pointer">Křeslo</Label>
                </div>
                {details.kresla && (
                  <div className="grid grid-cols-2 gap-4 ml-8 animate-in fade-in slide-in-from-left-4 pb-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet</Label>
                      <Input
                        type="number"
                        value={details.pocet_kresla || 0}
                        onChange={(e) => updateBookingDetail('pocet_kresla', Number(e.target.value))}
                        className="h-10 rounded-lg border-border font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
                      <Select value={details.znecisteni_kresla} onValueChange={(v) => updateBookingDetail('znecisteni_kresla', v)}>
                        <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nízké">Nízké</SelectItem>
                          <SelectItem value="Střední">Střední</SelectItem>
                          <SelectItem value="Vysoké">Vysoké</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Židle */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-background rounded-xl border border-border shadow-sm">
                  <Checkbox
                    checked={details.zidle}
                    onCheckedChange={(checked) => updateBookingDetail('zidle', checked)}
                    id="zidle"
                  />
                  <Label htmlFor="zidle" className="font-black text-xs uppercase tracking-wider cursor-pointer">Židle</Label>
                </div>
                {details.zidle && (
                  <div className="grid grid-cols-2 gap-4 ml-8 animate-in fade-in slide-in-from-left-4 pb-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Počet</Label>
                      <Input
                        type="number"
                        value={details.pocet_zidle || 0}
                        onChange={(e) => updateBookingDetail('pocet_zidle', Number(e.target.value))}
                        className="h-10 rounded-lg border-border font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Znečištění</Label>
                      <Select value={details.znecisteni_zidle} onValueChange={(v) => updateBookingDetail('znecisteni_zidle', v)}>
                        <SelectTrigger className="grow h-10 rounded-lg border-border font-medium text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nízké">Nízké</SelectItem>
                          <SelectItem value="Střední">Střední</SelectItem>
                          <SelectItem value="Vysoké">Vysoké</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] max-h-[92vh] overflow-hidden flex flex-col p-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl rounded-2xl">
        <DialogHeader className="px-8 py-6 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Plus className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground uppercase">Nová rezervace</DialogTitle>
              <p className="text-sm text-muted-foreground font-medium">Vytvořte novou zakázku pro klienta</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto minimal-scrollbar p-8 space-y-8">
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Klient a typ úklidu</h3>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Vyberte klienta *</Label>
                  <Select value={formData.client_id} onValueChange={handleClientChange}>
                    <SelectTrigger className="h-11 rounded-lg border-border font-bold">
                      <SelectValue placeholder="Hledat klienta..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id} className="font-medium">{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Typ služby *</Label>
                  <Select value={formData.service_type} onValueChange={handleServiceChange}>
                    <SelectTrigger className="h-11 rounded-lg border-border font-bold">
                      <SelectValue placeholder="Vyberte službu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Úklid</SelectItem>
                      <SelectItem value="window_cleaning">Mytí Oken</SelectItem>
                      <SelectItem value="upholstery_cleaning">Čištění Čalounění</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.client_id && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-xl border border-border/50 animate-in fade-in zoom-in-95 duration-300">
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", formData.client_preferences.has_children ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-border text-muted-foreground opacity-50")}>
                    <Baby className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Děti</span>
                  </div>
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", formData.client_preferences.has_pets ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-border text-muted-foreground opacity-50")}>
                    <Dog className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Mazlíčci</span>
                  </div>
                  <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", formData.client_preferences.has_allergies ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-white border-border text-muted-foreground opacity-50")}>
                    <HeartPulse className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase">Alergie</span>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border bg-white border-border">
                    <StickyNote className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase truncate">{formData.client_preferences.special_instructions || "Žádné instrukce"}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Adresa úklidu *</Label>
                <div className="relative">
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Přesná adresa kde bude probíhat úklid..."
                    className="h-11 rounded-lg border-border pl-10 font-medium"
                  />
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Timing & Status */}
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 delay-100 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Termín a stav</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Datum *</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                    className="h-11 rounded-lg border-border pl-10 font-bold"
                  />
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Čas *</Label>
                <div className="relative">
                  <Input
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    className="h-11 rounded-lg border-border pl-10 font-bold"
                  />
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-11 rounded-lg border-border font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Čeká na schválení</SelectItem>
                    <SelectItem value="approved">Schváleno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Financials */}
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 delay-150 duration-500">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Finance a věrnost</h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <Calculator className="h-3 w-3 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Vypočteno: {priceRange.min} - {priceRange.max} Kč</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Cena (Kč)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    className="h-11 rounded-lg border-border pr-12 font-black text-emerald-600 text-lg"
                  />
                  <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Věrnostní body</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.manual_loyalty_points}
                    onChange={(e) => setFormData(prev => ({ ...prev, manual_loyalty_points: Number(e.target.value) }))}
                    className="h-11 rounded-lg border-border pr-12 font-bold text-primary"
                  />
                  <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Odměna týmu (Kč)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.manual_team_reward}
                    onChange={(e) => setFormData(prev => ({ ...prev, manual_team_reward: Number(e.target.value) }))}
                    className="h-11 rounded-lg border-border pr-12 font-bold"
                  />
                  <Banknote className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Service Details */}
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 delay-200 duration-500">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Specifikace úklidu</h3>
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {renderServiceFields()}
              <div className="p-6 border-t border-border/50 bg-muted/5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-2 block">Poznámky klienta</Label>
                <Textarea
                  value={formData.booking_details.notes || ''}
                  onChange={(e) => updateBookingDetail('notes', e.target.value)}
                  placeholder="Zadejte doplňující informace o prostoru..."
                  className="rounded-xl border-border min-h-[100px] font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section: Assignments */}
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 delay-250 duration-500 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Přiřazení a checklist</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Vyberte úklidovce</Label>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map(member => (
                    <div
                      key={member.id}
                      onClick={() => toggleTeamMember(member.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg border cursor-pointer transition-all text-xs font-bold uppercase tracking-tight flex items-center gap-2",
                        formData.team_member_ids.includes(member.id)
                          ? "bg-primary/5 border-primary text-primary shadow-sm"
                          : "bg-muted/10 border-transparent text-muted-foreground hover:bg-muted/20"
                      )}
                    >
                      <User className="h-3.5 w-3.5" />
                      {member.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Šablona checklistu</Label>
                  <Select
                    value={formData.checklist_id || 'none'}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, checklist_id: v === 'none' ? null : v }))}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-border font-bold">
                      <SelectValue placeholder="Vyberte checklist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Bez specifického checklistu</SelectItem>
                      {checklists.map(checklist => (
                        <SelectItem key={checklist.id} value={checklist.id} className="font-medium">
                          {[checklist.street, checklist.city].filter(Boolean).join(', ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Interní poznámky (správce)</Label>
                  <Textarea
                    value={formData.admin_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                    placeholder="Tyto poznámky uvidí pouze úklidový tým..."
                    className="rounded-xl border-border font-medium"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="px-8 py-6 border-t border-border/50 bg-muted/20 gap-3 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="font-bold uppercase tracking-tight text-muted-foreground hover:bg-muted"
          >
            Zrušit
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="h-12 px-10 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold uppercase tracking-wide transition-all active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vytvářím...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Vytvořit rezervaci
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
