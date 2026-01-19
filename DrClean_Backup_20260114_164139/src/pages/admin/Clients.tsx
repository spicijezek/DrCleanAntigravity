import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, User, Phone, Mail, MapPin, Calendar, Edit, Trash2, TrendingUp, ArrowUpDown, Filter, Building2, User2, Wallet, History, SearchX } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddClientForm } from '@/components/forms/AddClientForm';
import { Layout } from '@/components/layout/Layout';
import { useMobileResponsive } from '@/components/ui/mobile-responsive';

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
  period_spent: number;
  notes: string;
  created_at: string;
  client_type?: string;
  company_id?: string;
  company_legal_name?: string;
  reliable_person?: string;
  client_source?: string;
}

export default function Clients() {
  useMobileResponsive();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user, selectedPeriod, customStartDate, customEndDate]);

  const fetchClients = async () => {
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Calculate date range for selected period
      const getDateRange = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (selectedPeriod === 'custom') {
          return {
            start: customStartDate ? new Date(customStartDate) : today,
            end: customEndDate ? new Date(customEndDate + 'T23:59:59') : now
          };
        }

        if (selectedPeriod === 'total') {
          return { start: new Date(2020, 0, 1), end: now };
        }

        const days = parseInt(selectedPeriod);
        const start = new Date(today);
        start.setDate(start.getDate() - days);

        return { start, end: now };
      };

      const { start: periodStart, end: periodEnd } = getDateRange();

      // Fetch all jobs with status 'paid' or 'finished' (for total spent)
      const { data: allJobsData, error: allJobsError } = await supabase
        .from('jobs')
        .select('client_id, revenue, payment_received_date, status')
        .eq('status', 'paid')
        .not('payment_received_date', 'is', null);

      if (allJobsError) throw allJobsError;

      // Calculate total spent and period spent for each client (PAID jobs by payment_received_date)
      const clientsWithSpending = clientsData?.map(client => {
        const clientJobs = (allJobsData || []).filter(job => job.client_id === client.id);

        // Total spent = sum of PAID jobs revenue
        const totalSpent = clientJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);

        // Period spent = PAID jobs with payment_received_date in selected period
        let periodJobs = clientJobs;
        if (selectedPeriod !== 'total') {
          periodJobs = clientJobs.filter(job =>
            job.payment_received_date &&
            new Date(job.payment_received_date) >= periodStart &&
            new Date(job.payment_received_date) <= periodEnd
          );
        }
        const periodSpent = periodJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);

        return {
          ...client,
          total_spent: totalSpent,
          period_spent: periodSpent
        };
      }) || [];

      setClients(clientsWithSpending);
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst klienty',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedClients = clients
    .filter(client =>
      (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (sourceFilter === 'all' || client.client_source === sourceFilter)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_spent':
          return (b.total_spent || 0) - (a.total_spent || 0);
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        case 'company':
          return (a.client_type === 'company' ? -1 : 1) - (b.client_type === 'company' ? -1 : 1);
        case 'person':
          return (a.client_type === 'person' ? -1 : 1) - (b.client_type === 'person' ? -1 : 1);
        default:
          return 0;
      }
    });

  const handleClientAdded = () => {
    setShowAddForm(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowAddForm(true);
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      console.log('=== Starting delete for client ===', clientId);

      // First check if client has any jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('client_id', clientId);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        throw jobsError;
      }

      console.log('Client has jobs:', jobs?.length || 0);

      const confirmMessage = jobs && jobs.length > 0
        ? `Tento klient má ${jobs.length} přidružených zakázek. Smazáním klienta smažete i všechna související data. Opravdu pokračovat?`
        : 'Opravdu chcete smazat tohoto klienta?';

      if (!confirm(confirmMessage)) {
        console.log('User cancelled deletion');
        return;
      }

      // Delete all related records in the correct order
      if (jobs && jobs.length > 0) {
        const jobIds = jobs.map(j => j.id);
        console.log('Deleting job-related records for jobs:', jobIds);

        // Delete job-related records first
        const { error: earningsError } = await supabase.from('job_earnings').delete().in('job_id', jobIds);
        if (earningsError) console.error('Error deleting earnings:', earningsError);

        const { error: expensesError } = await supabase.from('job_expenses').delete().in('job_id', jobIds);
        if (expensesError) console.error('Error deleting expenses:', expensesError);

        const { error: extrasError } = await supabase.from('job_extra_services').delete().in('job_id', jobIds);
        if (extrasError) console.error('Error deleting extras:', extrasError);

        const { error: loyaltyTxError } = await supabase.from('loyalty_transactions').delete().in('related_job_id', jobIds);
        if (loyaltyTxError) console.error('Error deleting loyalty transactions:', loyaltyTxError);

        const { error: notifError } = await supabase.from('client_notifications').delete().in('related_job_id', jobIds);
        if (notifError) console.error('Error deleting notifications:', notifError);

        const { error: feedbackError } = await supabase.from('client_feedback').delete().in('job_id', jobIds);
        if (feedbackError) console.error('Error deleting feedback:', feedbackError);

        // Delete jobs
        console.log('Deleting jobs...');
        const { error: jobsDeleteError } = await supabase.from('jobs').delete().eq('client_id', clientId);
        if (jobsDeleteError) {
          console.error('Error deleting jobs:', jobsDeleteError);
          throw jobsDeleteError;
        }
        console.log('Jobs deleted successfully');
      }

      // Delete other client-related records
      console.log('Deleting other client-related records...');
      await supabase.from('client_feedback').delete().eq('client_id', clientId);
      await supabase.from('loyalty_credits').delete().eq('client_id', clientId);
      await supabase.from('loyalty_transactions').delete().eq('client_id', clientId);
      await supabase.from('client_notifications').delete().eq('client_id', clientId);

      // Finally delete the client
      console.log('Attempting to delete client:', clientId);
      const { data: deletedRows, error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .select('id');

      console.log('Delete result - data:', deletedRows, 'error:', error);

      if (error) {
        console.error('Client delete error:', error);
        throw error;
      }

      if (!deletedRows || deletedRows.length === 0) {
        console.error('No rows deleted - RLS policy issue?');
        throw new Error('Klienta se nepodařilo smazat. RLS politika může blokovat smazání.');
      }

      console.log('Client deleted successfully!');

      toast({
        title: 'Úspěch',
        description: 'Klient byl úspěšně smazán',
      });

      setClients(prev => prev.filter(c => c.id !== clientId));
      fetchClients();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: error.message || 'Nepodařilo se smazat klienta',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground/90">Klienti</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <User2 className="h-4 w-4 text-primary/60" />
              Správa klientské databáze
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-[1.25rem] h-12 px-8 font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Přidat klienta
          </Button>
        </div>

        {/* Filter & Controls Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-end">
          <div className="xl:col-span-12 flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Search Box */}
            <div className="relative group xl:flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Hledat jméno, email nebo telefon..."
                className="pl-12 h-14 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all w-full text-base font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/10 shadow-sm min-w-[200px]">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div className="flex flex-col flex-1 pl-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Období útrat</span>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto text-sm font-bold">
                      <SelectValue placeholder="Výběr období" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                      <SelectItem value="7">Posledních 7 dní</SelectItem>
                      <SelectItem value="30">Posledních 30 dní</SelectItem>
                      <SelectItem value="90">Poslední 3 měsíce</SelectItem>
                      <SelectItem value="180">Posledních 6 měsíců</SelectItem>
                      <SelectItem value="365">Poslední rok</SelectItem>
                      <SelectItem value="total">Celkem</SelectItem>
                      <SelectItem value="custom">Vlastní rozsah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/10 shadow-sm min-w-[160px]">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div className="flex flex-col flex-1 pl-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Řazení</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto text-sm font-bold">
                      <SelectValue placeholder="Seřadit" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                      <SelectItem value="newest">Nejnovější</SelectItem>
                      <SelectItem value="oldest">Nejstarší</SelectItem>
                      <SelectItem value="most_spent">Dle útraty</SelectItem>
                      <SelectItem value="alphabetical">Abecedně</SelectItem>
                      <SelectItem value="company">Firmy</SelectItem>
                      <SelectItem value="person">Osoby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Date Range Panel */}
          {selectedPeriod === 'custom' && (
            <div className="xl:col-span-12 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customStartDate" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Od data</Label>
                  <Input
                    id="customStartDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-12 bg-white/50 rounded-xl border-0 shadow-sm font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customEndDate" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Do data</Label>
                  <Input
                    id="customEndDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-12 bg-white/50 rounded-xl border-0 shadow-sm font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[2rem] border-0 shadow-lg bg-emerald-500/5 border-l-4 border-l-emerald-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 leading-none">Útrata období</p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">
                  {filteredAndSortedClients.reduce((sum, client) => sum + (client.period_spent || 0), 0).toLocaleString('cs-CZ')} Kč
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-blue-500/5 border-l-4 border-l-blue-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <User2 className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-900/40 leading-none">Celkem osobitých</p>
                <p className="text-2xl font-black text-blue-600 tabular-nums">
                  {filteredAndSortedClients.filter(c => c.client_type !== 'company').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-indigo-500/5 border-l-4 border-l-indigo-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 leading-none">Celkem firemních</p>
                <p className="text-2xl font-black text-indigo-600 tabular-nums">
                  {filteredAndSortedClients.filter(c => c.client_type === 'company').length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-slate-500/5 border-l-4 border-l-slate-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-900/40 leading-none">Vyfiltrováno</p>
                <p className="text-2xl font-black text-slate-700 tabular-nums">
                  {filteredAndSortedClients.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedClients.map((client) => (
            <Card key={client.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-slate-900/80 backdrop-blur-sm">
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2.5 z-10 transition-all duration-500",
                client.client_type === 'company' ? "bg-indigo-500" : "bg-blue-500"
              )} />

              <CardContent className="p-7 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {client.client_type === 'company' ? (
                        <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                          <Building2 className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                          <User2 className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <Badge variant="outline" className={cn(
                        "rounded-full px-2 py-0 text-[10px] font-black uppercase tracking-tighter border-0",
                        client.client_type === 'company' ? "bg-indigo-50 text-indigo-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {client.client_type === 'company' ? "Firma" : "Osoba"}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-foreground/90 leading-tight truncate">
                      {client.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClient(client)}
                      className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-white hover:text-primary transition-all hover:scale-110 shadow-sm shrink-0"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                      className="h-10 w-10 rounded-2xl bg-red-50 hover:bg-red-100/50 text-red-500 transition-all hover:scale-110 shadow-sm shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                        {client.email || 'Email neuveden'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {client.phone || 'Telefon neuveden'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                        {client.address ? `${client.address}, ${client.city}` : 'Adresa neuvedena'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-900/40 mb-1 leading-none">Celkem spent</span>
                      <p className="text-sm font-black text-emerald-600 leading-none">
                        {client.total_spent?.toLocaleString('cs-CZ')} Kč
                      </p>
                    </div>
                    <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1 leading-none">V období</span>
                      <p className="text-sm font-black text-primary leading-none">
                        {client.period_spent?.toLocaleString('cs-CZ')} Kč
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Přidán: {new Date(client.created_at).toLocaleDateString('cs-CZ')}
                  </div>
                  {client.client_source && (
                    <Badge variant="outline" className="text-[9px] px-1.5 h-4 border-0 bg-slate-100 text-slate-400 uppercase tracking-tighter">
                      {client.client_source}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedClients.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-xl animate-in fade-in zoom-in duration-700">
            <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
              <SearchX className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Žádní klienti nenalezeni</h3>
            <p className="text-muted-foreground font-medium mb-8 text-center max-w-sm">
              {searchTerm ? 'Zkuste upravit vyhledávací termíny pro nalezení klienta.' : 'Začněte tím, že do databáze přidáte svého prvního klienta.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="rounded-2xl h-14 px-10 font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95">
                <Plus className="h-6 w-6 mr-2" />
                Vytvořit prvního klienta
              </Button>
            )}
          </div>
        )}

        {showAddForm && (
          <AddClientForm
            onClose={() => {
              setShowAddForm(false);
              setEditingClient(null);
            }}
            onClientAdded={handleClientAdded}
            editingClient={editingClient}
          />
        )}
      </div>
    </Layout>
  );
}