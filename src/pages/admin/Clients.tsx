import React, { useState, useEffect } from 'react';
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="p-6 transition-all duration-300">
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Clients</h1>
                <p className="text-muted-foreground">Manage your client relationships</p>
              </div>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Client
              </Button>
            </div>

            {/* Period Selector and Sort Filter */}
            <div className="filter-container flex flex-col lg:flex-row gap-4 items-start lg:items-center">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Spending Period:</span>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-full sm:w-48 mobile-button">
                    <SelectValue placeholder="Select spending period..." />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Past 365 days</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-sm font-medium">Source:</span>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-full sm:w-32 mobile-button">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="App">App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <ArrowUpDown className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 mobile-button">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="most_spent">Most Spent</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="person">Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range - Only show when custom is selected */}
            {selectedPeriod === 'custom' && (
              <div className="period-spent-container bg-muted/30 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Custom Date Range</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customStartDate" className="text-sm font-medium">From:</Label>
                    <Input
                      id="customStartDate"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="mobile-button"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customEndDate" className="text-sm font-medium">To:</Label>
                    <Input
                      id="customEndDate"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="mobile-button"
                    />
                  </div>
                </div>
              </div>
            )}


            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search clients..." 
                className="pl-10 mobile-button w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Period Spending Summary */}
            <div className="period-spent-container bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Period Spending Summary</h3>
              <p className="text-xs text-muted-foreground">
                Total spent by all clients in selected period: 
                <span className="font-semibold ml-1">
                  {filteredAndSortedClients.reduce((sum, client) => sum + client.period_spent, 0).toLocaleString('cs-CZ')} CZK
                </span>
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedClients.map((client) => (
          <Card key={client.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {client.name}
                </div>
                <Badge variant={client.client_type === 'company' ? 'default' : 'secondary'}>
                  {client.client_type === 'company' ? 'C' : 'P'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 min-h-[120px]">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {client.email || 'No email provided'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone || 'No phone provided'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {client.address ? `${client.address}${client.city ? `, ${client.city}` : ''}${client.postal_code ? ` ${client.postal_code}` : ''}` : 'No address provided'}
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                    Total: {client.total_spent?.toLocaleString('cs-CZ') || 0} CZK
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {selectedPeriod === 'total' ? 'Total' : selectedPeriod === 'custom' ? 'Custom' : `${selectedPeriod}d`}: {client.period_spent?.toLocaleString('cs-CZ') || 0} CZK
                  </Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClient(client)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedClients.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No clients found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first client.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
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