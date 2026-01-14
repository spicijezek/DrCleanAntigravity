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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto border-0 shadow-none rounded-lg m-0 bg-background">
        <CardHeader className="flex flex-row items-center justify-between relative">
          <CardTitle className="pr-8">Add New Job</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Job address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categories *</Label>
                <MultiSelectDropdown
                  items={[
                    { value: 'home_cleaning', label: 'Home Cleaning' },
                    { value: 'commercial_cleaning', label: 'Commercial Cleaning' },
                    { value: 'window_cleaning', label: 'Window Cleaning' },
                    { value: 'post_construction_cleaning', label: 'Post Construction Cleaning' },
                    { value: 'upholstery_cleaning', label: 'Upholstery Cleaning' },
                  ]}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Select categories..."
                />
              </div>
              
              {/* Client Selection */}
              <div className="space-y-2 md:col-span-2">
                <Label>Client *</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={!isCreatingNewClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCreatingNewClient(false)}
                  >
                    Select Existing
                  </Button>
                  <Button
                    type="button"
                    variant={isCreatingNewClient ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsCreatingNewClient(true)}
                  >
                    Add New Client
                  </Button>
                </div>
                
                {!isCreatingNewClient ? (
                  <Select value={formData.client_id} onValueChange={(value) => {
                    handleSelectChange('client_id', value);
                    // Auto-populate address from selected client
                    const client = clients.find(c => c.id === value);
                    if (client) {
                      const clientAddress = [client.address, client.city, client.postal_code]
                        .filter(Boolean)
                        .join(', ');
                      setFormData(prev => ({ ...prev, address: clientAddress || prev.address }));
                    }
                    // Fetch last job data for this client
                    fetchLastJobForClient(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing client" />
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
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Client Type</Label>
                        <Select value={newClientData.client_type} onValueChange={(value) => handleNewClientSelectChange('client_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="person">Person</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {newClientData.client_type === 'person' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="newClientName">Name *</Label>
                            <Input
                              id="newClientName"
                              name="name"
                              value={newClientData.name}
                              onChange={handleNewClientChange}
                              placeholder="Full Name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientDateOfBirth">Date of Birth</Label>
                            <Input
                              id="newClientDateOfBirth"
                              name="date_of_birth"
                              type="date"
                              value={newClientData.date_of_birth}
                              onChange={handleNewClientChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientAddress">Address</Label>
                            <Input
                              id="newClientAddress"
                              name="address"
                              value={newClientData.address}
                              onChange={(e) => {
                                handleNewClientChange(e);
                                const fullAddress = [e.target.value, newClientData.city, newClientData.postal_code]
                                  .filter(Boolean)
                                  .join(', ');
                                setFormData(prev => ({ ...prev, address: fullAddress || e.target.value }));
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientCity">City</Label>
                            <Input
                              id="newClientCity"
                              name="city"
                              value={newClientData.city}
                              onChange={(e) => {
                                handleNewClientChange(e);
                                const fullAddress = [newClientData.address, e.target.value, newClientData.postal_code]
                                  .filter(Boolean)
                                  .join(', ');
                                setFormData(prev => ({ ...prev, address: fullAddress }));
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientPostalCode">Postal Code</Label>
                            <Input
                              id="newClientPostalCode"
                              name="postal_code"
                              value={newClientData.postal_code}
                              onChange={(e) => {
                                handleNewClientChange(e);
                                const fullAddress = [newClientData.address, newClientData.city, e.target.value]
                                  .filter(Boolean)
                                  .join(', ');
                                setFormData(prev => ({ ...prev, address: fullAddress }));
                              }}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientEmail">Email</Label>
                            <Input
                              id="newClientEmail"
                              name="email"
                              type="email"
                              value={newClientData.email}
                              onChange={handleNewClientChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientPhone">Phone (+420)</Label>
                            <Input
                              id="newClientPhone"
                              name="phone"
                              value={newClientData.phone}
                              onChange={handleNewClientChange}
                              placeholder="+420 123 456 789"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientSource">Client Source</Label>
                            <Input
                              id="newClientSource"
                              name="client_source"
                              value={newClientData.client_source}
                              onChange={handleNewClientChange}
                              placeholder="e.g., Google, Recommendation, etc."
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* IČO field first */}
                          <div className="space-y-2">
                            <Label htmlFor="newClientCompanyId">IČO (Company ID) *</Label>
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
                              placeholder="Enter 8-digit IČO"
                              maxLength={8}
                              disabled={fetchingAres}
                            />
                          </div>
                          {/* Autofilled fields */}
                          <div className="space-y-2">
                            <Label htmlFor="newClientName">Company Name *</Label>
                            <Input
                              id="newClientName"
                              name="name"
                              value={newClientData.name}
                              onChange={handleNewClientChange}
                              placeholder="Autofilled from ARES"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientAddress">Address</Label>
                            <Input
                              id="newClientAddress"
                              name="address"
                              value={newClientData.address}
                              onChange={(e) => {
                                handleNewClientChange(e);
                                const fullAddress = [e.target.value, newClientData.city, newClientData.postal_code]
                                  .filter(Boolean)
                                  .join(', ');
                                setFormData(prev => ({ ...prev, address: fullAddress || e.target.value }));
                              }}
                              placeholder="Autofilled from ARES"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientCity">City</Label>
                            <Input
                              id="newClientCity"
                              name="city"
                              value={newClientData.city}
                              onChange={(e) => {
                                handleNewClientChange(e);
                                const fullAddress = [newClientData.address, e.target.value, newClientData.postal_code]
                                  .filter(Boolean)
                                  .join(', ');
                                setFormData(prev => ({ ...prev, address: fullAddress }));
                              }}
                              placeholder="Autofilled from ARES"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientPostalCode">Postal Code</Label>
                            <Input
                              id="newClientPostalCode"
                              name="postal_code"
                              value={newClientData.postal_code}
                              onChange={(e) => {
                                handleNewClientChange(e);
                                const fullAddress = [newClientData.address, newClientData.city, e.target.value]
                                  .filter(Boolean)
                                  .join(', ');
                                setFormData(prev => ({ ...prev, address: fullAddress }));
                              }}
                              placeholder="Autofilled from ARES"
                            />
                          </div>
                          {/* Non-autofilled fields below */}
                          <div className="space-y-2">
                            <Label htmlFor="newClientEmail">Email</Label>
                            <Input
                              id="newClientEmail"
                              name="email"
                              type="email"
                              value={newClientData.email}
                              onChange={handleNewClientChange}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientPhone">Phone (+420)</Label>
                            <Input
                              id="newClientPhone"
                              name="phone"
                              value={newClientData.phone}
                              onChange={handleNewClientChange}
                              placeholder="+420 123 456 789"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientSource">Client Source</Label>
                            <Input
                              id="newClientSource"
                              name="client_source"
                              value={newClientData.client_source}
                              onChange={handleNewClientChange}
                              placeholder="e.g., Google, Recommendation, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newClientReliablePerson">Contact Person</Label>
                            <Input
                              id="newClientReliablePerson"
                              name="reliable_person"
                              value={newClientData.reliable_person}
                              onChange={handleNewClientChange}
                              placeholder="Responsible person name"
                            />
                          </div>
                        </>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="newClientDateAdded">Date Added</Label>
                        <Input
                          id="newClientDateAdded"
                          name="date_added"
                          type="date"
                          value={newClientData.date_added}
                          onChange={handleNewClientChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newClientNotes">Notes</Label>
                      <Textarea
                        id="newClientNotes"
                        name="notes"
                        value={newClientData.notes}
                        onChange={handleNewClientChange}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Team Members</Label>
                <MultiSelectDropdown
                  items={teamMembers.map(member => ({ value: member.id, label: member.name }))}
                  selected={selectedTeamMembers}
                  onChange={(selected) => {
                    const newSelections = selected.filter(id => !selectedTeamMembers.includes(id));
                    const removedSelections = selectedTeamMembers.filter(id => !selected.includes(id));
                    
                    // Remove expenses for deselected members
                    setTeamMemberExpenses(prev => prev.filter(exp => !removedSelections.includes(exp.teamMemberId)));
                    
                    // Add expenses for new selections
                    const newExpenses = newSelections.map(id => ({ teamMemberId: id, cleanerExpense: '0' }));
                    setTeamMemberExpenses(prev => [...prev, ...newExpenses]);
                    
                    setSelectedTeamMembers(selected);
                  }}
                  placeholder="Select team members..."
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Scheduled Dates *</Label>
                <div className="space-y-3">
                  {scheduledDates.map((date, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="datetime-local"
                        value={date}
                        onChange={(e) => {
                          const newDates = [...scheduledDates];
                          newDates[index] = e.target.value;
                          setScheduledDates(newDates);
                        }}
                        placeholder="DD/MM/YYYY HH:MM"
                        required={index === 0}
                        className="flex-1"
                      />
                      {scheduledDates.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const newDates = scheduledDates.filter((_, i) => i !== index);
                            setScheduledDates(newDates);
                          }}
                          className="h-10 w-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScheduledDates([...scheduledDates, ''])}
                    className="w-full"
                  >
                    + Add Another Date
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_hours">Duration (hours)</Label>
                <Input
                  id="duration_hours"
                  name="duration_hours"
                  type="number"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revenue">Revenue (CZK) *</Label>
                <Input
                  id="revenue"
                  name="revenue"
                  type="number"
                  step="0.01"
                  value={formData.revenue}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplies_expense_total">Supplies Total (CZK)</Label>
                <Input
                  id="supplies_expense_total"
                  name="supplies_expense_total"
                  type="number"
                  step="0.01"
                  value={formData.supplies_expense_total}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transport_expense_total">Transport Total (CZK)</Label>
                <Input
                  id="transport_expense_total"
                  name="transport_expense_total"
                  type="number"
                  step="0.01"
                  value={formData.transport_expense_total}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* Cleaner Expenses */}
            {selectedTeamMembers.length > 0 && (
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Cleaner Expenses</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTeamMembers.map((teamMemberId) => {
                    const teamMember = teamMembers.find(tm => tm.id === teamMemberId);
                    const expense = teamMemberExpenses.find(exp => exp.teamMemberId === teamMemberId);
                    
                    return (
                      <div key={teamMemberId} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{teamMember?.name}</span>
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            value={expense?.cleanerExpense || '0'}
                            onChange={(e) => updateTeamMemberExpense(teamMemberId, e.target.value)}
                            placeholder="0"
                            className="text-right"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">CZK</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total Expenses Summary */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Total Expenses</Label>
                <div className="text-xl font-bold">
                  {calculateTotalExpenses().toFixed(2)} CZK
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Cleaner expenses:</span>
                  <span>{teamMemberExpenses.reduce((sum, exp) => sum + (parseFloat(exp.cleanerExpense) || 0), 0).toFixed(2)} CZK</span>
                </div>
                <div className="flex justify-between">
                  <span>Supplies:</span>
                  <span>{(parseFloat(formData.supplies_expense_total) || 0).toFixed(2)} CZK</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport:</span>
                  <span>{(parseFloat(formData.transport_expense_total) || 0).toFixed(2)} CZK</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Job'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ModalOverlay>
  );
}