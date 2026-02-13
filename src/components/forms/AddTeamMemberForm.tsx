import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, UserPlus, Phone, Mail, MapPin, Briefcase, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AddTeamMemberFormProps {
  onClose: () => void;
  onMemberAdded: () => void;
}

export function AddTeamMemberForm({ onClose, onMemberAdded }: AddTeamMemberFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    address: '',
    hourly_rate: '',
    hire_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const memberData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        position: formData.position || null,
        address: formData.address || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        hire_date: formData.hire_date || null,
        user_id: user.id,
        is_active: true,
        total_earnings: 0,
      };

      const { error } = await supabase
        .from('team_members')
        .insert(memberData);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Člen týmu byl úspěšně přidán',
      });

      onMemberAdded();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-2xl px-4 py-8 pointer-events-none">
        <Card className="pointer-events-auto border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Přidat člena týmu</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" /> Jméno *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jméno a příjmení"
                    required
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" /> Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@klinr.cz"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Telefon
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+420 777 000 000"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Pozice
                  </Label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    placeholder="Např. Specialista úklidu"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate" className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" /> Hodinová sazba (Kč)
                  </Label>
                  <Input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    step="0.01"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hire_date" className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Datum nástupu
                  </Label>
                  <Input
                    id="hire_date"
                    name="hire_date"
                    type="date"
                    value={formData.hire_date}
                    onChange={handleChange}
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Adresa
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Ulice, Město, PSČ"
                  className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-primary/20 px-8">
                  Zrušit
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl bg-primary px-12 h-11 font-bold">
                  {loading ? 'Přidávám...' : 'Přidat člena'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>
  );
}