import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
    service_type: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    address: '',
    status: 'approved',
    team_member_ids: [] as string[],
    admin_notes: '',
    checklist_id: '' as string | null,
    booking_details: {
      plocha_m2: 50,
      pocet_koupelen: 1,
      pocet_kuchyni: 1,
      znecisteni: 'Střední',
      frekvence: 'Jednorázový úklid',
      notes: '',
      // Office cleaning
      pocet_wc: 1,
      pocet_kuchynek: 1,
      typ_prostoru: '',
      // Window cleaning
      pocet_oken: 8,
      plocha_oken_m2: 10,
      znecisteni_okna: '',
      typ_objektu_okna: '',
      // Upholstery cleaning
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
      znecisteni_matrace: 'Nízké'
    } as any
  });

  const handleClientChange = async (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      user_id: selectedClient?.user_id || '',
      checklist_id: null
    }));
    
    // Load checklists for this client
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.service_type || !formData.scheduled_date || !formData.address) {
      toast({
        variant: 'destructive',
        title: 'Chyba',
        description: 'Prosím vyplňte všechna povinná pole'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: formData.client_id,
          user_id: formData.user_id,
          service_type: formData.service_type,
          scheduled_date: formData.scheduled_date,
          address: formData.address,
          status: formData.status,
          team_member_ids: formData.team_member_ids,
          admin_notes: formData.admin_notes,
          booking_details: formData.booking_details,
          checklist_id: formData.checklist_id || null
        });

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Rezervace byla úspěšně vytvořena'
      });
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        client_id: '',
        user_id: '',
        service_type: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        address: '',
        status: 'approved',
        team_member_ids: [],
        admin_notes: '',
        checklist_id: null,
        booking_details: {
          plocha_m2: 50,
          pocet_koupelen: 1,
          pocet_kuchyni: 1,
          znecisteni: 'Střední',
          frekvence: 'Jednorázový úklid',
          notes: '',
          pocet_wc: 1,
          pocet_kuchynek: 1,
          pocet_oken: 8,
          plocha_oken_m2: 10,
          koberce: false,
          typ_koberec: 'Kusový',
          plocha_koberec: 0,
          sedacka: false,
          matrace: false
        }
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

  const renderServiceFields = () => {
    const details = formData.booking_details;

    switch (formData.service_type) {
      case 'home_cleaning':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plocha (m²)</Label>
              <Input
                type="number"
                value={details.plocha_m2 || 50}
                onChange={(e) => updateBookingDetail('plocha_m2', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Počet koupelen</Label>
              <Input
                type="number"
                value={details.pocet_koupelen || 1}
                onChange={(e) => updateBookingDetail('pocet_koupelen', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Počet kuchyní</Label>
              <Input
                type="number"
                value={details.pocet_kuchyni || 1}
                onChange={(e) => updateBookingDetail('pocet_kuchyni', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Znečištění</Label>
              <Select value={details.znecisteni || ''} onValueChange={(v) => updateBookingDetail('znecisteni', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nízké">Nízké</SelectItem>
                  <SelectItem value="Střední">Střední</SelectItem>
                  <SelectItem value="Vysoké">Vysoké</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Frekvence</Label>
              <Select value={details.frekvence || ''} onValueChange={(v) => updateBookingDetail('frekvence', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jednorázový úklid">Jednorázový</SelectItem>
                  <SelectItem value="Týdně">Týdně</SelectItem>
                  <SelectItem value="Každé 2 týdny">Každé 2 týdny</SelectItem>
                  <SelectItem value="Měsíčně">Měsíčně</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'office_cleaning':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Plocha (m²)</Label>
              <Input
                type="number"
                value={details.plocha_m2 || 50}
                onChange={(e) => updateBookingDetail('plocha_m2', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Počet WC</Label>
              <Input
                type="number"
                value={details.pocet_wc || 1}
                onChange={(e) => updateBookingDetail('pocet_wc', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Počet kuchyněk</Label>
              <Input
                type="number"
                value={details.pocet_kuchynek || 1}
                onChange={(e) => updateBookingDetail('pocet_kuchynek', Number(e.target.value))}
              />
            </div>
          </div>
        );

      case 'window_cleaning':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Počet oken</Label>
              <Input
                type="number"
                value={details.pocet_oken || 8}
                onChange={(e) => updateBookingDetail('pocet_oken', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Plocha oken (m²)</Label>
              <Input
                type="number"
                value={details.plocha_oken_m2 || 10}
                onChange={(e) => updateBookingDetail('plocha_oken_m2', Number(e.target.value))}
              />
            </div>
          </div>
        );

      case 'upholstery_cleaning':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={details.koberce}
                onCheckedChange={(checked) => updateBookingDetail('koberce', checked)}
              />
              <Label>Koberec</Label>
            </div>
            {details.koberce && (
              <div className="grid grid-cols-2 gap-4 ml-6">
                <div>
                  <Label>Plocha (m²)</Label>
                  <Input
                    type="number"
                    value={details.plocha_koberec || 0}
                    onChange={(e) => updateBookingDetail('plocha_koberec', Number(e.target.value))}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={details.sedacka}
                onCheckedChange={(checked) => updateBookingDetail('sedacka', checked)}
              />
              <Label>Sedačka</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={details.matrace}
                onCheckedChange={(checked) => updateBookingDetail('matrace', checked)}
              />
              <Label>Matrace</Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vytvořit novou rezervaci</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Klient *</Label>
              <Select value={formData.client_id} onValueChange={handleClientChange}>
                <SelectTrigger><SelectValue placeholder="Vyberte klienta" /></SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Typ služby *</Label>
              <Select value={formData.service_type} onValueChange={(v) => setFormData(prev => ({ ...prev, service_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Vyberte službu" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="home_cleaning">Úklid Domácnosti</SelectItem>
                  <SelectItem value="office_cleaning">Úklid Firmy</SelectItem>
                  <SelectItem value="window_cleaning">Mytí Oken</SelectItem>
                  <SelectItem value="upholstery_cleaning">Čištění Čalounění</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Datum *</Label>
              <Input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Čeká na schválení</SelectItem>
                  <SelectItem value="approved">Schváleno</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Adresa *</Label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Např. Pražská 123, Praha, 110 00"
            />
          </div>

          {renderServiceFields()}

          <div>
            <Label>Poznámky klienta</Label>
            <Textarea
              value={formData.booking_details.notes || ''}
              onChange={(e) => updateBookingDetail('notes', e.target.value)}
              placeholder="Poznámky od klienta..."
              rows={2}
            />
          </div>

          <div>
            <Label>Přiřazení úklidovci</Label>
            <div className="space-y-2 mt-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.team_member_ids.includes(member.id)}
                    onCheckedChange={() => toggleTeamMember(member.id)}
                  />
                  <Label className="font-normal cursor-pointer">{member.name}</Label>
                </div>
              ))}
            </div>
          </div>

          {checklists.length > 0 && (
            <div>
              <Label>Checklist (volitelné)</Label>
              <Select 
                value={formData.checklist_id || 'none'} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, checklist_id: v === 'none' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte checklist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Žádný checklist</SelectItem>
                  {checklists.map(checklist => (
                    <SelectItem key={checklist.id} value={checklist.id}>
                      {[checklist.street, checklist.city, checklist.postal_code].filter(Boolean).join(', ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Poznámky správce</Label>
            <Textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
              placeholder="Poznámky viditelné pro úklidovce..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Zrušit
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Vytvářím...' : 'Vytvořit rezervaci'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
