import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectDropdown } from '@/components/ui/multi-select';
import { X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ModalOverlay } from '@/components/ui/modal-overlay';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

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
            description: `Platba za zakázku: ${formData.title}`,
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
        title: 'Úspěch',
        description: 'Zakázka byla úspěšně aktualizována',
      });

      onJobUpdated();
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
      <div className="w-full max-w-4xl px-4 py-8 pointer-events-none">
        <Card className="pointer-events-auto border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-background/95 backdrop-blur-xl relative">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-primary to-primary/60" />

          <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
            <CardTitle className="text-2xl font-bold tracking-tight">Upravit zakázku</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50 transition-colors">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Adresa úklidu *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ulice a č.p., Město"
                    required
                    className="rounded-xl border-primary/20 focus:border-primary focus:ring-primary/20 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Kategorie *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                    <SelectTrigger className="rounded-xl border-primary/20 focus:border-primary h-11">
                      <SelectValue placeholder="Vyberte kategorii" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_cleaning">Úklid domácnosti</SelectItem>
                      <SelectItem value="commercial_cleaning">Úklid firem</SelectItem>
                      <SelectItem value="window_cleaning">Mytí oken</SelectItem>
                      <SelectItem value="post_construction_cleaning">Post-stavební úklid</SelectItem>
                      <SelectItem value="upholstery_cleaning">Čištění čalounění</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_id" className="text-sm font-semibold">Zákazník *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => handleSelectChange('client_id', value)}>
                    <SelectTrigger className="rounded-xl border-primary/20 focus:border-primary h-11">
                      <SelectValue placeholder="Vyberte klienta" />
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
                  <Label htmlFor="status" className="text-sm font-semibold">Stav zakázky *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger className="rounded-xl border-primary/20 focus:border-primary h-11">
                      <SelectValue placeholder="Vyberte stav" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Naplánováno</SelectItem>
                      <SelectItem value="completed">Dokončeno</SelectItem>
                      <SelectItem value="paid">Zaplaceno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <Label className="text-sm font-semibold flex items-center justify-between">
                    Termíny úklidu *
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
                          required={index === 0}
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

                {formData.status === 'paid' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payment_received_date" className="text-sm font-semibold">Datum přijetí platby</Label>
                      <Input
                        id="payment_received_date"
                        name="payment_received_date"
                        type="datetime-local"
                        value={formData.payment_received_date}
                        onChange={handleChange}
                        className="rounded-xl h-11 border-primary/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_type" className="text-sm font-semibold">Způsob platby</Label>
                      <Select value={formData.payment_type} onValueChange={(value) => handleSelectChange('payment_type', value)}>
                        <SelectTrigger className="rounded-xl h-11 border-primary/10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Hotovost</SelectItem>
                          <SelectItem value="bank">Převod na účet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-6 pt-6 border-t border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {loading ? 'Aktualizuji...' : 'Uložit změny'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ModalOverlay>
  );
}