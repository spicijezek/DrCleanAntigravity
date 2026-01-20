import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, User, Phone, Mail, MapPin, Calendar, Edit, Trash2, TrendingUp, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddClientForm } from '@/components/forms/AddClientForm';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';

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
        title: 'Error',
        description: 'Failed to fetch clients',
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
        ? `This client has ${jobs.length} associated job(s). Deleting the client will also delete all related data. Are you sure?`
        : 'Are you sure you want to delete this client?';

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
        throw new Error('Client could not be deleted. RLS policy may be blocking the deletion.');
      }

      console.log('Client deleted successfully!');

      toast({
        title: 'Success',
        description: 'Client deleted successfully',
      });

      setClients(prev => prev.filter(c => c.id !== clientId));
      fetchClients();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete client',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading clients..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Klienti"
          description="Správa klientské základny a vztahů"
          action={
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Přidat klienta
            </Button>
          }
        />

        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-soft space-y-6">
            {/* Period Selector and Sort Filter */}
            <div className="filter-container flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold whitespace-nowrap">Období útrat:</span>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Vyberte období..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Posledních 7 dní</SelectItem>
                    <SelectItem value="30">Posledních 30 dní</SelectItem>
                    <SelectItem value="90">Poslední 3 měsíce</SelectItem>
                    <SelectItem value="180">Posledních 6 měsíců</SelectItem>
                    <SelectItem value="365">Poslední rok</SelectItem>
                    <SelectItem value="total">Celkově</SelectItem>
                    <SelectItem value="custom">Vlastní rozmezí</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <span className="text-sm font-bold whitespace-nowrap">Zdroj:</span>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Vše" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Vše</SelectItem>
                    <SelectItem value="App">Aplikace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ArrowUpDown className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-bold whitespace-nowrap">Řadit dle:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Řadit dle..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nejnovější</SelectItem>
                    <SelectItem value="oldest">Nejstarší</SelectItem>
                    <SelectItem value="most_spent">Nejvíce utraceno</SelectItem>
                    <SelectItem value="alphabetical">Abecedně</SelectItem>
                    <SelectItem value="company">Firmy</SelectItem>
                    <SelectItem value="person">Fyzické osoby</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range - Only show when custom is selected */}
            {selectedPeriod === 'custom' && (
              <div className="bg-primary-light p-6 rounded-xl border border-border animate-in fade-in zoom-in-95 duration-300">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Vlastní rozmezí datumů
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="customStartDate" className="text-xs font-bold ml-1 uppercase text-muted-foreground">Od:</Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customEndDate" className="text-xs font-bold ml-1 uppercase text-muted-foreground">Do:</Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            )}


            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Hledat klienty dle jména, e-mailu nebo telefonu..."
                className="pl-12 h-12 bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/10 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Period Spending Summary */}
            <div className="bg-primary-light p-5 rounded-xl border border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary mb-1 uppercase tracking-wider">Souhrn útrat za období</h3>
                <p className="text-xs text-muted-foreground font-medium">
                  Celkem utraceno všemi klienty ve vybraném období
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary">
                  {filteredAndSortedClients.reduce((sum, client) => sum + (client.period_spent || 0), 0).toLocaleString('cs-CZ')} CZK
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {filteredAndSortedClients.map((client) => (
              <Card key={client.id} className="border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden group">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">{client.name}</CardTitle>
                    </div>
                    <Badge className={cn(
                      "rounded-lg px-2 py-0.5 text-[10px] uppercase font-bold border-0",
                      client.client_type === 'company' ? "bg-info-light text-info border border-info-border" : "bg-secondary text-secondary-foreground border border-border"
                    )}>
                      {client.client_type === 'company' ? 'Firma' : 'Osoba'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border min-h-[140px]">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                      <Mail className="h-4 w-4 text-primary/70" />
                      <span className="truncate">{client.email || 'E-mail neuveden'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                      <Phone className="h-4 w-4 text-primary/70" />
                      <span>{client.phone || 'Telefon neuveden'}</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors">
                      <MapPin className="h-4 w-4 text-primary/70 mt-0.5" />
                      <span className="leading-snug">{client.address ? `${client.address}${client.city ? `, ${client.city}` : ''}${client.postal_code ? ` ${client.postal_code}` : ''}` : 'Adresa neuvedena'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-success-light border border-success-border p-3 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Celkem útrata</p>
                      <p className="text-sm font-black text-emerald-700">{client.total_spent?.toLocaleString('cs-CZ') || 0} CZK</p>
                    </div>
                    <div className="bg-info-light border border-info-border p-3 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-blue-600 mb-1">Za období</p>
                      <p className="text-sm font-black text-blue-700">{client.period_spent?.toLocaleString('cs-CZ') || 0} CZK</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClient(client)}
                      className="flex-1 rounded-lg border border-border hover:bg-secondary hover:border-gray-300 transition-all font-semibold"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Upravit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClient(client.id)}
                      className="flex-1 rounded-lg hover:bg-destructive-light hover:text-destructive text-muted-foreground transition-all font-medium"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Smazat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndSortedClients.length === 0 && !loading && (
            <div className="text-center py-24 bg-card/30 backdrop-blur-xl rounded-xl border-2 border-dashed border-border max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <User className="h-10 w-10 text-primary opacity-40" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Žádní klienti</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                {searchTerm ? 'Zkuste upravit hledaný výraz.' : 'Začněte přidáním prvního klienta.'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddForm(true)} className="rounded-xl h-12 px-8 font-semibold transition-all hover:shadow-medium">
                  <Plus className="h-5 w-5 mr-2" />
                  Přidat klienta
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
      </div>
    </Layout>
  );
}