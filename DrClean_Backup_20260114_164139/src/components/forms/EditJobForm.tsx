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

interface EditJobFormProps {
  job: any;
  onClose: () => void;
  onJobUpdated: () => void;
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

export function EditJobForm({ job, onClose, onJobUpdated }: EditJobFormProps) {
const toUTCFromLocal = (dt: string) => {
  if (!dt) return null as any;
  // Convert local datetime string to UTC ISO without double-applying timezone offset
  return new Date(dt).toISOString();
};
  const toLocalInput = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };
  const [formData, setFormData] = useState({
    title: job.title || '',
    description: job.description || '',
    category: job.category || '',
    scheduled_date: job.scheduled_date ? toLocalInput(job.scheduled_date) : '',
    duration_hours: job.duration_hours?.toString() || '',
    revenue: job.revenue?.toString() || '',
    
    client_id: job.client_id || '',
    status: job.status || 'scheduled',
    payment_received_date: job.payment_received_date ? toLocalInput(job.payment_received_date) : '',
    supplies_expense_total: job.supplies_expense_total?.toString() || '0',
    transport_expense_total: job.transport_expense_total?.toString() || '0',
    payment_type: job.payment_type || 'cash',
  });
  const [scheduledDates, setScheduledDates] = useState<string[]>(() => {
    // Initialize with scheduled_dates array if available, otherwise use single scheduled_date
    if (job.scheduled_dates && job.scheduled_dates.length > 0) {
      return job.scheduled_dates.map((date: string) => toLocalInput(date));
    } else if (job.scheduled_date) {
      return [toLocalInput(job.scheduled_date)];
    }
    return [''];
  });
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(job.team_member_ids || (job.team_member_id ? [job.team_member_id] : []));
  const [teamMemberExpenses, setTeamMemberExpenses] = useState<TeamMemberExpense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchTeamMembers();
      fetchJobExpenses();
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

  const fetchJobExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('job_expenses')
        .select('*')
        .eq('job_id', job.id);
      
      if (error) throw error;
      
      const expenses = (data || []).map(expense => ({
        teamMemberId: expense.team_member_id,
        cleanerExpense: expense.cleaner_expense?.toString() || '0',
      }));
      
      setTeamMemberExpenses(expenses);
    } catch (error: any) {
      console.error('Failed to fetch job expenses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const jobData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        client_id: formData.client_id,
        team_member_ids: selectedTeamMembers,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        revenue: parseFloat(formData.revenue) || 0,
        expenses: calculateTotalExpenses(),
        supplies_expense_total: parseFloat(formData.supplies_expense_total) || 0,
        transport_expense_total: parseFloat(formData.transport_expense_total) || 0,
        scheduled_date: scheduledDates.length > 0 && scheduledDates[0] ? toUTCFromLocal(scheduledDates[0]) : job.scheduled_date,
        scheduled_dates: scheduledDates.filter(date => date).map(date => toUTCFromLocal(date)),
        status: formData.status,
        payment_received_date: formData.status === 'paid' && formData.payment_received_date ? toUTCFromLocal(formData.payment_received_date) : null,
        payment_type: formData.payment_type,
      };
      
      const { error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', job.id);

      if (error) throw error;

      // Delete existing job expenses and insert new ones
      await supabase.from('job_expenses').delete().eq('job_id', job.id);
      
      if (teamMemberExpenses.length > 0) {
        const expenseRecords = teamMemberExpenses.map(expense => ({
          job_id: job.id,
          team_member_id: expense.teamMemberId,
          cleaner_expense: parseFloat(expense.cleanerExpense) || 0,
          user_id: user.id,
        }));

        const { error: expenseError } = await supabase
          .from('job_expenses')
          .insert(expenseRecords);

        if (expenseError) throw expenseError;
      }

      // If status is changed to "paid", create a transaction and update invoice status
      if (formData.status === 'paid' && job.status !== 'paid' && formData.payment_received_date) {
        const { error: transError } = await supabase
          .from('transactions')
          .insert([{
            user_id: user.id,
            type: 'revenue',
            category: 'job_payment',
            amount: parseFloat(formData.revenue) || 0,
            description: `Payment for job: ${formData.title}`,
            transaction_date: formData.payment_received_date,
            job_id: job.id,
          }]);

        if (transError) throw transError;

        // Update invoice status to "paid" for this client
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', formData.client_id)
          .single();

        if (clientData) {
          await supabase
            .from('invoices')
            .update({ status: 'paid' })
            .eq('client_name', clientData.name)
            .eq('status', 'issued');
        }
      }

      toast({
        title: 'Success',
        description: 'Job updated successfully',
      });
      
      onJobUpdated();
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

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Auto-populate title with address when client is selected
    if (name === 'client_id' && value) {
      const selectedClient = clients.find(c => c.id === value);
      if (selectedClient) {
        const fullAddress = [selectedClient.address, selectedClient.city, selectedClient.postal_code]
          .filter(Boolean)
          .join(', ');
        setFormData(prev => ({ ...prev, title: fullAddress }));
      }
    }
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
        // Add to expenses when checked (or use existing expense if available)
        const existingExpense = teamMemberExpenses.find(exp => exp.teamMemberId === teamMemberId);
        if (!existingExpense) {
          setTeamMemberExpenses(expenses => [
            ...expenses,
            { teamMemberId, cleanerExpense: '0' }
          ]);
        }
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
          <CardTitle className="pr-8">Edit Job</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home_cleaning">Home Cleaning</SelectItem>
                    <SelectItem value="commercial_cleaning">Commercial Cleaning</SelectItem>
                    <SelectItem value="window_cleaning">Window Cleaning</SelectItem>
                    <SelectItem value="post_construction_cleaning">Post Construction Cleaning</SelectItem>
                    <SelectItem value="upholstery_cleaning">Upholstery Cleaning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_id">Client *</Label>
                <Select value={formData.client_id} onValueChange={(value) => handleSelectChange('client_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    
                    // Add expenses for new selections (use existing if available)
                    const existingExpenses = teamMemberExpenses.filter(exp => selected.includes(exp.teamMemberId));
                    const newExpenses = newSelections.map(id => ({ teamMemberId: id, cleanerExpense: '0' }));
                    setTeamMemberExpenses([...existingExpenses, ...newExpenses]);
                    
                    setSelectedTeamMembers(selected);
                  }}
                  placeholder="Select team members..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
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
              {formData.status === 'paid' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="payment_received_date">Payment Received Date (DD/MM/YYYY)</Label>
                    <Input
                      id="payment_received_date"
                      name="payment_received_date"
                      type="datetime-local"
                      value={formData.payment_received_date}
                      onChange={handleChange}
                      placeholder="DD/MM/YYYY HH:MM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_type">Payment Type</Label>
                    <Select value={formData.payment_type} onValueChange={(value) => handleSelectChange('payment_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
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
                {loading ? 'Updating...' : 'Update Job'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </ModalOverlay>
  );
}