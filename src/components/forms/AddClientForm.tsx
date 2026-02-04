import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { clientFormSchema } from '@/lib/validationSchemas';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  date_of_birth: string;
  total_spent: number;
  notes: string;
  created_at: string;
  client_type?: string;
  company_id?: string;
  dic?: string;
  company_legal_name?: string;
  reliable_person?: string;
  client_source?: string;
}

interface AddClientFormProps {
  onClose: () => void;
  onClientAdded: () => void;
  editingClient?: Client;
}

export function AddClientForm({ onClose, onClientAdded, editingClient }: AddClientFormProps) {
  const [clientType, setClientType] = useState(editingClient?.client_type || 'person');
  const [formData, setFormData] = useState({
    name: editingClient?.name || '',
    email: editingClient?.email || '',
    phone: editingClient?.phone || '',
    address: editingClient?.address || '',
    city: editingClient?.city || '',
    postal_code: editingClient?.postal_code || '',
    date_of_birth: editingClient?.date_of_birth || '',
    date_added: editingClient?.created_at ? editingClient.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: editingClient?.notes || '',
    company_id: editingClient?.company_id || '',
    dic: editingClient?.dic || '',
    company_legal_name: editingClient?.company_legal_name || '',
    reliable_person: editingClient?.reliable_person || '',
    client_source: editingClient?.client_source || '',
  });
  const [loading, setLoading] = useState(false);
  const [fetchingAres, setFetchingAres] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const companyNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Validate form data
      const submitData = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        client_type: clientType,
      };

      const validationResult = clientFormSchema.safeParse(submitData);

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(submitData)
          .eq('id', editingClient.id);

        if (error) throw error;

        // Update related jobs with new address if it changed
        const oldAddress = [editingClient.address, editingClient.city, editingClient.postal_code]
          .filter(Boolean)
          .join(', ');
        const newAddress = [formData.address, formData.city, formData.postal_code]
          .filter(Boolean)
          .join(', ');

        if (oldAddress !== newAddress && newAddress) {
          const { error: jobsError } = await supabase
            .from('jobs')
            .update({
              title: newAddress
            })
            .eq('client_id', editingClient.id)
            .eq('title', oldAddress); // Only update jobs that match the old address

          if (jobsError) {
            console.error('Error updating related jobs:', jobsError);
          }
        }

        toast({
          title: 'Success',
          description: 'Client updated successfully',
        });
      } else {
        // Create new client
        const { error } = await supabase
          .from('clients')
          .insert([{
            ...submitData,
            user_id: user.id,
            total_spent: 0,
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Client added successfully',
        });
      }

      onClientAdded();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchAresData = async (searchValue: string, searchType: 'ico' | 'name') => {
    if (!searchValue || searchValue.trim().length < 3) return;

    setFetchingAres(true);
    try {
      const body = searchType === 'ico' ? { ico: searchValue } : { name: searchValue };
      const { data, error } = await supabase.functions.invoke('fetch-ares', {
        body
      });

      if (error) throw error;

      if (data && !data.error) {
        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          company_legal_name: data.company_legal_name || prev.company_legal_name,
          company_id: data.company_id || prev.company_id,
          dic: data.dic || prev.dic,
          address: data.address || prev.address,
          city: data.city || prev.city,
          postal_code: data.postal_code || prev.postal_code,
        }));

        toast({
          title: 'Success',
          description: 'Company data loaded from ARES',
        });
      } else {
        toast({
          title: 'Not Found',
          description: 'Company not found in ARES registry',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error fetching ARES data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch company data from ARES',
        variant: 'destructive',
      });
    } finally {
      setFetchingAres(false);
    }
  };

  const handleCompanyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      company_id: value,
    }));

    // Auto-fetch when IČO has 8 digits
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 8) {
      fetchAresData(cleanValue, 'ico');
    }
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: value,
    }));

    // Clear previous timeout
    if (companyNameTimeoutRef.current) {
      clearTimeout(companyNameTimeoutRef.current);
    }

    // Auto-fetch when company name has at least 3 characters (debounced)
    if (value.trim().length >= 3 && clientType === 'company') {
      companyNameTimeoutRef.current = setTimeout(() => {
        fetchAresData(value.trim(), 'name');
      }, 1000);
    }
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-2xl px-4 py-8 pointer-events-none">
        <Card className="pointer-events-auto border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          {/* Decorative side line */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {editingClient ? 'Upravit klienta' : 'Přidat nového klienta'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Type Selection */}
              <div className="space-y-3 p-4 bg-primary/5 rounded-3xl border border-primary/10">
                <Label className="text-sm font-bold uppercase tracking-wider text-primary/70">Typ klienta</Label>
                <RadioGroup value={clientType} onValueChange={setClientType} className="flex gap-8">
                  <div className="flex items-center space-x-2 cursor-pointer group">
                    <RadioGroupItem value="person" id="person" className="border-primary/50 text-primary" />
                    <Label htmlFor="person" className="cursor-pointer font-medium group-hover:text-primary transition-colors">Fyzická osoba</Label>
                  </div>
                  <div className="flex items-center space-x-2 cursor-pointer group">
                    <RadioGroupItem value="company" id="company" className="border-primary/50 text-primary" />
                    <Label htmlFor="company" className="cursor-pointer font-medium group-hover:text-primary transition-colors">Firma</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">{clientType === 'company' ? 'Název firmy *' : 'Jméno a příjmení *'}</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={clientType === 'company' ? handleCompanyNameChange : handleChange}
                    required
                    disabled={fetchingAres}
                    placeholder={clientType === 'company' ? 'Zadejte název k vyhledání...' : 'Jan Novák'}
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                  {fetchingAres && clientType === 'company' && (
                    <p className="text-[10px] text-primary animate-pulse font-medium">Vyhledávám v ARES...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@priklad.cz"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Telefon (+420)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+420 123 456 789"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                {clientType === 'person' ? (
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-semibold">Datum narození</Label>
                    <Input
                      id="date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_id" className="text-sm font-semibold">IČO</Label>
                        <Input
                          id="company_id"
                          name="company_id"
                          value={formData.company_id}
                          onChange={handleCompanyIdChange}
                          placeholder="IČO"
                          disabled={fetchingAres}
                          className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dic" className="text-sm font-semibold">DIČ</Label>
                        <Input
                          id="dic"
                          name="dic"
                          value={formData.dic}
                          onChange={handleChange}
                          placeholder="DIČ"
                          disabled={fetchingAres}
                          className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    {fetchingAres && (
                      <p className="text-[10px] text-primary animate-pulse font-medium">Načítám data z ARES...</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">Adresa</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Ulice a č.p."
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold">Město</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Praha"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code" className="text-sm font-semibold">PSČ</Label>
                  <Input
                    id="postal_code"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="110 00"
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                {clientType === 'company' && (
                  <div className="space-y-2">
                    <Label htmlFor="reliable_person" className="text-sm font-semibold">Kontaktní osoba</Label>
                    <Input
                      id="reliable_person"
                      name="reliable_person"
                      value={formData.reliable_person}
                      onChange={handleChange}
                      placeholder="Jméno jednatele / kontaktu"
                      className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="date_added" className="text-sm font-semibold">Datum přidání *</Label>
                  <Input
                    id="date_added"
                    name="date_added"
                    type="date"
                    value={formData.date_added}
                    onChange={handleChange}
                    required
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_source" className="text-sm font-semibold">Zdroj klienta</Label>
                  <Select
                    value={formData.client_source}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, client_source: value }))}
                  >
                    <SelectTrigger className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20">
                      <SelectValue placeholder="Vyberte zdroj..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="AI">AI</SelectItem>
                      <SelectItem value="Doporučení">Doporučení</SelectItem>
                      <SelectItem value="Sociální Sítě">Sociální Sítě</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold">Poznámky</Label>
                <div className="relative group">
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Interní poznámky ke klientovi..."
                    className="rounded-2xl border-primary/20 focus:border-primary focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-primary/20 hover:bg-primary/5 transition-all"
                >
                  Zrušit
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8"
                >
                  {loading ? (editingClient ? 'Ukládám...' : 'Přidávám...') : (editingClient ? 'Uložit změny' : 'Přidat klienta')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>

  );
}