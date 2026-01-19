import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectDropdown } from '@/components/ui/multi-select';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface AddJobFormProps {
  onClose: () => void;
  onJobAdded: () => void;
}

interface Client {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
}

interface TeamMember {
  id: string;
  name: string;
}

interface TeamMemberExpense {
  teamMemberId: string;
  cleanerExpense: string;
}

interface NewClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  client_type: 'person' | 'company';
  date_of_birth: string;
  company_id: string;
  company_legal_name: string;
  reliable_person: string;
  date_added: string;
  client_source: string;
  notes: string;
}

export function AddJobForm({ onClose, onJobAdded }: AddJobFormProps) {
  const [formData, setFormData] = useState({
    address: '',
    description: '',
    scheduled_date: '',
    duration_hours: '',
    revenue: '',

    supplies_expense_total: '',
    transport_expense_total: '',
    client_id: '',
    status: 'scheduled',
    payment_type: 'cash',
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [scheduledDates, setScheduledDates] = useState<string[]>([new Date().toISOString().split('T')[0]]);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [teamMemberExpenses, setTeamMemberExpenses] = useState<TeamMemberExpense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [fetchingAres, setFetchingAres] = useState(false);
  const [newClientData, setNewClientData] = useState<NewClientData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    client_type: 'person',
    date_of_birth: '',
    company_id: '',
    company_legal_name: '',
    reliable_person: '',
    date_added: new Date().toISOString().split('T')[0],
    client_source: '',
    notes: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchTeamMembers();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, address, city, postal_code')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error: any) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const fetchLastJobForClient = async (clientId: string) => {
    try {
      // Fetch the last completed (finished/paid) job for the selected client
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('client_id', clientId)
        .in('status', ['completed', 'paid'])
        .order('completed_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching last job:', error);
        return;
      }

      if (jobs && jobs.length > 0) {
        const lastJob = jobs[0] as any;
        console.log('Last job found:', lastJob);

        // Autofill form with last job data
        setFormData(prev => ({
          ...prev,
          duration_hours: lastJob.duration_hours?.toString() || '',
          revenue: lastJob.revenue?.toString() || '',
          supplies_expense_total: lastJob.supplies_expense_total?.toString() || '',
          transport_expense_total: lastJob.transport_expense_total?.toString() || '',
        }));

        // Set categories (use the stored single primary category)
        if (lastJob.category) {
          setSelectedCategories([lastJob.category]);
        }

        // Preselect team members from last job
        if (Array.isArray(lastJob.team_member_ids) && lastJob.team_member_ids.length > 0) {
          setSelectedTeamMembers(lastJob.team_member_ids);
        } else {
          setSelectedTeamMembers([]);
        }

        // Fetch team member earning distribution (cleaner_expense) separately
        const { data: expenses, error: expenseError } = await supabase
          .from('job_expenses')
          .select('team_member_id, cleaner_expense')
          .eq('job_id', lastJob.id);

        if (expenseError) {
          console.error('Error fetching job expenses:', expenseError);
        } else {
          const mapped = (expenses ?? []).map((exp: any) => ({
            teamMemberId: exp.team_member_id,
            cleanerExpense: (exp.cleaner_expense ?? 0).toString(),
          }));
          setTeamMemberExpenses(mapped);

          // If last job didn't store team_member_ids, derive from expenses
          if ((!lastJob.team_member_ids || lastJob.team_member_ids.length === 0) && mapped.length > 0) {
            const ids = Array.from(new Set(mapped.map((e: any) => e.teamMemberId)));
            setSelectedTeamMembers(ids);
          }
        }

        toast({
          title: 'Success',
          description: 'Autofilled from last completed job for this client',
        });
      } else {
        console.log('No previous completed job found for this client');
      }
    } catch (error: any) {
      console.error('Error fetching last job:', error);
    }
  };

  const fetchCompanyFromAres = async (ico: string) => {
    if (!ico || ico.length < 8) return;

    setFetchingAres(true);
    try {
      const response = await fetch(`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`);

      if (!response.ok) throw new Error('Company not found');

      const data = await response.json();

      // Extract company data from ARES response
      const companyName = data.obchodniJmeno || '';
      const legalName = data.pravniForma?.nazev || '';
      const dic = data.dic || '';

      // Extract address
      const sidlo = data.sidlo;
      let address = '';
      let city = '';
      let postalCode = '';

      if (sidlo) {
        const street = sidlo.nazevUlice || '';
        const houseNumber = sidlo.cisloDomovni || '';
        const orientationNumber = sidlo.cisloOrientacni || '';
        city = sidlo.nazevObce || '';
        postalCode = sidlo.psc?.toString() || '';

        address = [street, houseNumber, orientationNumber].filter(Boolean).join(' ');
      }

      setNewClientData(prev => ({
        ...prev,
        name: companyName,
        company_legal_name: legalName,
        address,
        city,
        postal_code: postalCode,
      }));

      // Auto-populate job address
      const fullAddress = [address, city, postalCode].filter(Boolean).join(', ');
      setFormData(prev => ({ ...prev, address: fullAddress }));

      toast({
        title: 'Success',
        description: 'Company data loaded from ARES',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Could not fetch company data from ARES',
        variant: 'destructive',
      });
    } finally {
      setFetchingAres(false);
    }
  };

  const toUTCFromLocal = (dt: string) => {
    if (!dt) return null as any;
    // Convert local datetime string to UTC ISO without double-applying timezone offset
    return new Date(dt).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (selectedCategories.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one category',
        variant: 'destructive',
      });
      return;
    }

    if (isCreatingNewClient && !newClientData.name) {
      toast({
        title: 'Error',
        description: 'Please enter client name',
        variant: 'destructive',
      });
      return;
    }

    if (!isCreatingNewClient && !formData.client_id) {
      toast({
        title: 'Error',
        description: 'Please select a client or create a new one',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Starting job creation...', formData);

      let clientId = formData.client_id;

      // Create new client if needed
      if (isCreatingNewClient) {
        const clientData = {
          ...newClientData,
          // Handle empty date fields by converting to null
          date_of_birth: newClientData.date_of_birth || null,
          date_added: newClientData.date_added || null,
          user_id: user.id,
          total_spent: 0,
        };

        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert(clientData)
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.id;

        // Auto-populate address from client data
        const clientAddress = [newClientData.address, newClientData.city, newClientData.postal_code]
          .filter(Boolean)
          .join(', ');

        setFormData(prev => ({ ...prev, address: clientAddress }));
      }

      // Generate job number
      const { data: jobNumberData, error: jobNumberError } = await supabase
        .rpc('generate_job_number');

      console.log('Job number generated:', jobNumberData, jobNumberError);

      if (jobNumberError) throw jobNumberError;

      // Use first category as primary category (required field)
      const primaryCategory = selectedCategories[0] as 'home_cleaning' | 'commercial_cleaning' | 'window_cleaning' | 'post_construction_cleaning' | 'upholstery_cleaning';

      const jobData = {
        title: formData.address || 'Job Address',
        description: formData.description,
        category: primaryCategory,
        client_id: clientId,
        team_member_ids: selectedTeamMembers,
        job_number: jobNumberData,
        user_id: user.id,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        revenue: parseFloat(formData.revenue) || 0,
        expenses: calculateTotalExpenses(),
        supplies_expense_total: parseFloat(formData.supplies_expense_total) || 0,
        transport_expense_total: parseFloat(formData.transport_expense_total) || 0,
        scheduled_date: scheduledDates.length > 0 && scheduledDates[0] ? toUTCFromLocal(scheduledDates[0]) : new Date().toISOString(),
        scheduled_dates: scheduledDates.filter(date => date).map(date => toUTCFromLocal(date)),
        status: 'scheduled',
        payment_type: formData.payment_type,
      };

      console.log('Job data to insert:', jobData);

      const { data: insertedJob, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select()
        .single();

      console.log('Insert result error:', error);

      if (error) throw error;

      // Insert expense distribution for each selected team member
      if (insertedJob && teamMemberExpenses.length > 0) {
        const expenseRecords = teamMemberExpenses.map(expense => ({
          job_id: insertedJob.id,
          team_member_id: expense.teamMemberId,
          cleaner_expense: parseFloat(expense.cleanerExpense) || 0,
          user_id: user.id,
        }));

        const { error: expenseError } = await supabase
          .from('job_expenses')
          .insert(expenseRecords);

        if (expenseError) throw expenseError;
      }

      toast({
        title: 'Success',
        description: isCreatingNewClient
          ? 'Job and client added successfully'
          : 'Job added successfully',
      });

      onJobAdded();
    } catch (error: any) {
      console.error('Job creation error:', error);
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Auto-populate address when client is selected
    if (name === 'client_id' && value) {
      const selectedClient = clients.find(c => c.id === value);
      if (selectedClient) {
        const fullAddress = [selectedClient.address, selectedClient.city, selectedClient.postal_code]
          .filter(Boolean)
          .join(', ');
        setFormData(prev => ({ ...prev, address: fullAddress }));
      }

      // Fetch last job data for the selected client
      fetchLastJobForClient(value);
    }
  };

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewClientData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNewClientSelectChange = (name: string, value: string) => {
    setNewClientData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTeamMemberToggle = (teamMemberId: string) => {
    setSelectedTeamMembers(prev => {
      const isSelected = prev.includes(teamMemberId);
      if (isSelected) {
        // Remove from expenses when unchecked
        setTeamMemberExpenses(expenses =>
          expenses.filter(expense => expense.teamMemberId !== teamMemberId)
        );
        return prev.filter(id => id !== teamMemberId);
      } else {
        // Add to expenses when checked
        setTeamMemberExpenses(expenses => [
          ...expenses,
          { teamMemberId, cleanerExpense: '0' }
        ]);
        return [...prev, teamMemberId];
      }
    });
  };

  const updateTeamMemberExpense = (teamMemberId: string, value: string) => {
    setTeamMemberExpenses(prev =>
      prev.map(expense =>
        expense.teamMemberId === teamMemberId
          ? { ...expense, cleanerExpense: value }
          : expense
      )
    );
  };

  // Calculate total expenses
  const calculateTotalExpenses = () => {
    const cleanerExpensesTotal = teamMemberExpenses.reduce((sum, expense) =>
      sum + (parseFloat(expense.cleanerExpense) || 0), 0
    );
    const suppliesTotal = parseFloat(formData.supplies_expense_total) || 0;
    const transportTotal = parseFloat(formData.transport_expense_total) || 0;
    return cleanerExpensesTotal + suppliesTotal + transportTotal;
  };

  return (
    <ModalOverlay>
      <div className="w-full max-w-4xl px-4 py-8 pointer-events-none">
        <Card className="pointer-events-auto border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Přidat novou zakázku</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">Adresa úklidu *</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Ulice a č.p., Město"
                    required
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Kategorie úklidu *</Label>
                  <MultiSelectDropdown
                    items={[
                      { value: 'home_cleaning', label: 'Úklid domácnosti' },
                      { value: 'commercial_cleaning', label: 'Úklid firem' },
                      { value: 'window_cleaning', label: 'Mytí oken' },
                      { value: 'post_construction_cleaning', label: 'Post-stavební úklid' },
                      { value: 'upholstery_cleaning', label: 'Čištění čalounění' },
                    ]}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="Vyberte kategorie..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Zákazník *</Label>
                  <div className="flex gap-3 mb-4">
                    <Button
                      type="button"
                      variant={!isCreatingNewClient ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsCreatingNewClient(false)}
                      className="rounded-full px-6 transition-all"
                    >
                      Vybrat existujícího
                    </Button>
                    <Button
                      type="button"
                      variant={isCreatingNewClient ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsCreatingNewClient(true)}
                      className="rounded-full px-6 transition-all"
                    >
                      Přidat nového klienta
                    </Button>
                  </div>

                  {!isCreatingNewClient ? (
                    <Select value={formData.client_id} onValueChange={(value) => {
                      handleSelectChange('client_id', value);
                      const client = clients.find(c => c.id === value);
                      if (client) {
                        const clientAddress = [client.address, client.city, client.postal_code]
                          .filter(Boolean)
                          .join(', ');
                        setFormData(prev => ({ ...prev, address: clientAddress || prev.address }));
                      }
                      fetchLastJobForClient(value);
                    }}>
                      <SelectTrigger className="rounded-xl border-primary/20 focus:border-primary h-11">
                        <SelectValue placeholder="Vyberte klienta ze seznamu" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-5 p-6 border rounded-3xl bg-primary/5 border-primary/10 animate-in fade-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold">Typ klienta</Label>
                          <Select value={newClientData.client_type} onValueChange={(value) => handleNewClientSelectChange('client_type', value)}>
                            <SelectTrigger className="rounded-xl bg-background border-primary/10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="person">Fyzická osoba</SelectItem>
                              <SelectItem value="company">Firma</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {newClientData.client_type === 'person' ? (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="newClientName" className="text-sm font-semibold">Jméno *</Label>
                              <Input
                                id="newClientName"
                                name="name"
                                value={newClientData.name}
                                onChange={handleNewClientChange}
                                placeholder="Jan Novák"
                                required
                                className="rounded-xl h-11 border-primary/10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newClientEmail" className="text-sm font-semibold">Email</Label>
                              <Input
                                id="newClientEmail"
                                name="email"
                                type="email"
                                value={newClientData.email}
                                onChange={handleNewClientChange}
                                placeholder="email@priklad.cz"
                                className="rounded-xl h-11 border-primary/10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newClientPhone" className="text-sm font-semibold">Telefon</Label>
                              <Input
                                id="newClientPhone"
                                name="phone"
                                value={newClientData.phone}
                                onChange={handleNewClientChange}
                                placeholder="+420..."
                                className="rounded-xl h-11 border-primary/10"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="newClientCompanyId" className="text-sm font-semibold">IČO *</Label>
                              <div className="relative">
                                <Input
                                  id="newClientCompanyId"
                                  name="company_id"
                                  value={newClientData.company_id}
                                  onChange={(e) => {
                                    handleNewClientChange(e);
                                    if (e.target.value.length === 8) {
                                      fetchCompanyFromAres(e.target.value);
                                    }
                                  }}
                                  placeholder="8místné IČO"
                                  maxLength={8}
                                  disabled={fetchingAres}
                                  className="rounded-xl h-11 border-primary/10"
                                />
                                {fetchingAres && <div className="absolute right-3 top-3 animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newClientName" className="text-sm font-semibold">Název firmy *</Label>
                              <Input
                                id="newClientName"
                                name="name"
                                value={newClientData.name}
                                onChange={handleNewClientChange}
                                placeholder="Autofill z ARES"
                                required
                                className="rounded-xl h-11 border-primary/10"
                              />
                            </div>
                          </>
                        )}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="newClientAddress" className="text-sm font-semibold">Adresa (pro vytvoření klienta)</Label>
                          <Input
                            id="newClientAddress"
                            name="address"
                            value={newClientData.address}
                            onChange={(e) => {
                              handleNewClientChange(e);
                              const fullAddress = [e.target.value, newClientData.city, newClientData.postal_code].filter(Boolean).join(', ');
                              setFormData(prev => ({ ...prev, address: fullAddress || e.target.value }));
                            }}
                            className="rounded-xl h-11 border-primary/10"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="revenue" className="text-sm font-bold text-primary flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" /> Celková cena (CZK) *
                    </Label>
                    <Input
                      id="revenue"
                      name="revenue"
                      type="number"
                      step="0.01"
                      value={formData.revenue}
                      onChange={handleChange}
                      required
                      className="rounded-xl h-12 text-lg font-bold border-primary/20 focus:border-primary focus:ring-primary/10 bg-primary/5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_hours" className="text-sm font-semibold">Doba trvání (hodiny)</Label>
                    <Input
                      id="duration_hours"
                      name="duration_hours"
                      type="number"
                      step="0.5"
                      value={formData.duration_hours}
                      onChange={handleChange}
                      className="rounded-xl h-12 border-primary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Typ platby</Label>
                    <Select value={formData.payment_type} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_type: v }))}>
                      <SelectTrigger className="rounded-xl h-12 border-primary/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Hotovost</SelectItem>
                        <SelectItem value="bank">Převod na účet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold flex items-center justify-between">
                    Termín úklidu
                  </Label>
                  <div className="grid gap-3">
                    {scheduledDates.map((date, index) => (
                      <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                        <Input
                          type="datetime-local"
                          value={date}
                          onChange={(e) => {
                            const newDates = [...scheduledDates];
                            newDates[index] = e.target.value;
                            setScheduledDates(newDates);
                          }}
                          className="rounded-xl h-11 flex-1 border-primary/10"
                        />
                        {scheduledDates.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setScheduledDates(scheduledDates.filter((_, i) => i !== index))}
                            className="rounded-xl text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduledDates([...scheduledDates, ''])}
                    className="w-full rounded-xl border-dashed border-primary/30 h-11 hover:border-primary transition-all"
                  >
                    + Přidat další termín
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-primary/10">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Přiřazení týmu a odměny
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map(member => (
                    <div key={member.id} className={cn(
                      "flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300",
                      selectedTeamMembers.includes(member.id)
                        ? "bg-primary/5 border-primary/30 shadow-sm"
                        : "bg-muted/10 border-transparent hover:border-primary/10"
                    )}>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={selectedTeamMembers.includes(member.id)}
                          onCheckedChange={() => handleTeamMemberToggle(member.id)}
                        />
                        <Label htmlFor={`member-${member.id}`} className="font-bold text-base cursor-pointer flex-1">
                          {member.name}
                        </Label>
                      </div>

                      {selectedTeamMembers.includes(member.id) && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                          <span className="text-xs font-semibold text-muted-foreground">Odměna:</span>
                          <Input
                            type="number"
                            step="0.01"
                            value={teamMemberExpenses.find(exp => exp.teamMemberId === member.id)?.cleanerExpense || '0'}
                            onChange={(e) => updateTeamMemberExpense(member.id, e.target.value)}
                            className="h-9 rounded-lg border-primary/20 text-right font-bold w-24"
                          />
                          <span className="text-xs font-bold">Kč</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 text-slate-50 p-6 rounded-[2rem] shadow-xl space-y-4">
                <div className="flex justify-between items-center group">
                  <Label className="text-lg font-bold text-slate-300">Celkové náklady</Label>
                  <div className="text-3xl font-black text-primary">
                    {calculateTotalExpenses().toFixed(0)} <span className="text-lg">Kč</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase font-bold text-slate-500">Uklízeči</Label>
                    <p className="font-bold text-lg">{teamMemberExpenses.reduce((sum, exp) => sum + (parseFloat(exp.cleanerExpense) || 0), 0).toFixed(0)} Kč</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs uppercase font-bold text-slate-500">Ostatní</Label>
                    <div className="flex gap-2 text-slate-900">
                      <Input
                        type="number"
                        placeholder="Materiál"
                        value={formData.supplies_expense_total}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplies_expense_total: e.target.value }))}
                        className="h-8 rounded-lg bg-slate-800 border-0 text-slate-100 placeholder:text-slate-600 text-xs w-20"
                      />
                      <Input
                        type="number"
                        placeholder="Doprava"
                        value={formData.transport_expense_total}
                        onChange={(e) => setFormData(prev => ({ ...prev, transport_expense_total: e.target.value }))}
                        className="h-8 rounded-lg bg-slate-800 border-0 text-slate-100 placeholder:text-slate-600 text-xs w-20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">Popis zakázky</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Speciální požadavky..."
                  className="rounded-2xl border-primary/10 focus:border-primary resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl border-primary/20">
                  Zrušit
                </Button>
                <Button type="submit" disabled={loading} className="rounded-xl bg-primary px-12 h-11 font-bold">
                  {loading ? 'Vytvářím...' : 'Vytvořit zakázku'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>

  );
}