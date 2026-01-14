import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-0 shadow-none rounded-lg m-0 bg-background">
        <CardHeader className="flex flex-row items-center justify-between relative">
          <CardTitle className="pr-8">{editingClient ? 'Edit Client' : 'Add New Client'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client Type Selection */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <Label className="text-sm font-semibold">Client Type</Label>
              <RadioGroup value={clientType} onValueChange={setClientType} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="person" id="person" />
                  <Label htmlFor="person" className="cursor-pointer">Person</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company" />
                  <Label htmlFor="company" className="cursor-pointer">Company</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{clientType === 'company' ? 'Company Name *' : 'Name *'}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={clientType === 'company' ? handleCompanyNameChange : handleChange}
                  required
                  disabled={fetchingAres}
                  placeholder={clientType === 'company' ? 'Enter company name to search ARES' : ''}
                />
                {fetchingAres && clientType === 'company' && (
                  <p className="text-xs text-muted-foreground">Searching ARES...</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (+420)</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+420 123 456 789"
                />
              </div>
              {clientType === 'person' ? (
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth (DD/MM/YYYY)</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="company_id">Company ID (IČO)</Label>
                  <Input
                    id="company_id"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleCompanyIdChange}
                    placeholder="Enter 8-digit IČO"
                    disabled={fetchingAres}
                  />
                  {fetchingAres && (
                    <p className="text-xs text-muted-foreground">Fetching data from ARES...</p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>
              
              {clientType === 'company' && (
                <div className="space-y-2">
                  <Label htmlFor="reliable_person">Reliable Person</Label>
                  <Input
                    id="reliable_person"
                    name="reliable_person"
                    value={formData.reliable_person}
                    onChange={handleChange}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="date_added">Date Added (DD/MM/YYYY)</Label>
                <Input
                  id="date_added"
                  name="date_added"
                  type="date"
                  value={formData.date_added}
                  onChange={handleChange}
                  placeholder="DD/MM/YYYY"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_source">Client Source</Label>
                <Input
                  id="client_source"
                  name="client_source"
                  placeholder="e.g., Google, Recommendation, Website"
                  value={formData.client_source}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (editingClient ? 'Updating...' : 'Adding...') : (editingClient ? 'Update Client' : 'Add Client')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ModalOverlay>
  );
}