import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calendar, User, MapPin, Clock, DollarSign, Edit, Trash2, ArrowUpDown, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddJobForm } from '@/components/forms/AddJobForm';
import { EditJobForm } from '@/components/forms/EditJobForm';
import { ClientDetailsPopup } from '@/components/forms/ClientDetailsPopup';
import { Layout } from '@/components/layout/Layout';
import { useMobileResponsive } from '@/components/ui/mobile-responsive';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Job {
  id: string;
  job_number: string;
  title: string;
  description: string;
  category: string;
  status: string;
  scheduled_date: string;
  scheduled_dates?: string[];
  completed_date: string;
  duration_hours: number;
  revenue: number;
  expenses: number;
  supplies_needed: string[];
  notes: string;
  client_id: string;
  team_member_id: string;
  payment_received_date: string;
  created_at: string;
  client_name?: string;
  client_type?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  client_city?: string;
  client_postal_code?: string;
  client_company_id?: string;
  client_company_legal_name?: string;
  client_reliable_person?: string;
  client_notes?: string;
  client_date_added?: string;
  client_source?: string;
}

const categoryColors = {
  'home_cleaning': 'bg-blue-100 text-blue-800',
  'commercial_cleaning': 'bg-green-100 text-green-800',
  'window_cleaning': 'bg-purple-100 text-purple-800',
  'post_construction_cleaning': 'bg-orange-100 text-orange-800',
  'upholstery_cleaning': 'bg-pink-100 text-pink-800',
};

const statusColors = {
  'pending': 'bg-yellow-100 text-yellow-800',
  'scheduled': 'bg-blue-100 text-blue-800',
  'in_progress': 'bg-green-100 text-green-800',
  'completed': 'bg-purple-100 text-purple-800', 
  'paid': 'bg-emerald-100 text-emerald-800',
  'cancelled': 'bg-red-100 text-red-800',
};

export default function Jobs() {
  useMobileResponsive();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('status');
  const [approvingJob, setApprovingJob] = useState<Job | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          clients!inner(id, name, client_type, address, email, phone, city, postal_code, company_id, company_legal_name, reliable_person, notes, date_added, client_source)
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      
      const jobsWithClientInfo = data?.map(job => ({
        ...job,
        client_name: job.clients?.name,
        client_type: job.clients?.client_type,
        client_address: job.clients?.address,
        client_email: job.clients?.email,
        client_phone: job.clients?.phone,
        client_city: job.clients?.city,
        client_postal_code: job.clients?.postal_code,
        client_company_id: job.clients?.company_id,
        client_company_legal_name: job.clients?.company_legal_name,
        client_reliable_person: job.clients?.reliable_person,
        client_notes: job.clients?.notes,
        client_date_added: job.clients?.date_added,
        client_source: job.clients?.client_source
      })) || [];
      
      setJobs(jobsWithClientInfo);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingJobs = jobs.filter(job => job.status === 'pending');
  const otherJobs = jobs.filter(job => job.status !== 'pending');

  const filteredAndSortedJobs = otherJobs
    .filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by category if a category is selected
      const categoryFilters = ['home_cleaning', 'commercial_cleaning', 'window_cleaning', 'post_construction_cleaning', 'upholstery_cleaning'];
      if (categoryFilters.includes(sortBy)) {
        return matchesSearch && job.category === sortBy;
      }

      // Filter by client type
      if (sortBy === 'person') {
        return matchesSearch && job.client_type === 'person';
      }
      if (sortBy === 'company') {
        return matchesSearch && job.client_type === 'company';
      }
      
      return matchesSearch;
    })
    .sort((a, b) => {
      // Apply selected sort
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        
        case 'most_spent':
          return (b.revenue || 0) - (a.revenue || 0);
        
        case 'alphabetical':
          return (a.client_name || '').localeCompare(b.client_name || '');
        
        default:
          // Default sort: Priority by status, then by date
          const statusPriority = { 'scheduled': 1, 'completed': 2, 'paid': 3 };
          const aPriority = statusPriority[a.status as keyof typeof statusPriority] || 4;
          const bPriority = statusPriority[b.status as keyof typeof statusPriority] || 4;
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          const getEarliestScheduled = (job: Job) => {
            const list = (job.scheduled_dates && job.scheduled_dates.length ? job.scheduled_dates : [job.scheduled_date]).filter(Boolean as any) as string[];
            const times = list.map(d => new Date(d).getTime()).filter(t => !isNaN(t));
            return times.length ? Math.min(...times) : 0;
          };

          const getLatestRelevant = (job: Job) => {
            if (job.payment_received_date) return new Date(job.payment_received_date).getTime();
            if (job.completed_date) return new Date(job.completed_date).getTime();
            const list = (job.scheduled_dates && job.scheduled_dates.length ? job.scheduled_dates : [job.scheduled_date]).filter(Boolean as any) as string[];
            const times = list.map(d => new Date(d).getTime()).filter(t => !isNaN(t));
            return times.length ? Math.max(...times) : 0;
          };

          if (a.status === 'scheduled' && b.status === 'scheduled') {
            return getEarliestScheduled(a) - getEarliestScheduled(b);
          }

          return getLatestRelevant(b) - getLatestRelevant(a);
      }
    });

  const handleJobAdded = () => {
    setShowAddForm(false);
    fetchJobs();
  };

  const handleJobUpdated = () => {
    setEditingJob(null);
    fetchJobs();
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Job deleted successfully',
      });
      
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const handleClientClick = (job: Job) => {
    const clientData = {
      id: job.client_id,
      name: job.client_name || '',
      email: job.client_email,
      phone: job.client_phone,
      address: job.client_address,
      city: job.client_city,
      postal_code: job.client_postal_code,
      client_type: job.client_type || 'person',
      company_id: job.client_company_id,
      company_legal_name: job.client_company_legal_name,
      reliable_person: job.client_reliable_person,
      notes: job.client_notes,
      date_added: job.client_date_added,
      client_source: job.client_source
    };
    setSelectedClient(clientData);
  };

  const handleClientUpdated = (updatedClient: any) => {
    // Update the jobs list with new client info
    setJobs(jobs.map(job => 
      job.client_id === updatedClient.id 
        ? {
            ...job,
            client_name: updatedClient.name,
            client_type: updatedClient.client_type,
            client_address: updatedClient.address,
            client_email: updatedClient.email,
            client_phone: updatedClient.phone,
            client_city: updatedClient.city,
            client_postal_code: updatedClient.postal_code,
            client_company_id: updatedClient.company_id,
            client_company_legal_name: updatedClient.company_legal_name,
            client_reliable_person: updatedClient.reliable_person,
            client_notes: updatedClient.notes,
            client_source: updatedClient.client_source
          }
        : job
    ));
  };

  const handleApproveJob = async () => {
    if (!approvingJob || !scheduledDate || !scheduledTime) {
      toast({
        title: 'Chyba',
        description: 'Prosím vyplňte datum a čas',
        variant: 'destructive',
      });
      return;
    }

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'scheduled',
          scheduled_date: scheduledDateTime,
          scheduled_dates: [scheduledDateTime]
        })
        .eq('id', approvingJob.id);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Úklid byl schválen a naplánován',
      });

      setApprovingJob(null);
      setScheduledDate('');
      setScheduledTime('');
      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se schválit úklid',
        variant: 'destructive',
      });
    }
  };

  const handleRejectJob = async (jobId: string) => {
    if (!confirm('Opravdu chcete zamítnout tento úklid?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Úklid byl zamítnut',
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se zamítnout úklid',
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground">Manage your cleaning jobs</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Job
        </Button>
      </div>

      {/* Pending Job Requests Section */}
      {pendingJobs.length > 0 && (
        <Card className="border-2 border-yellow-500 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              Nové Žádosti o Úklid ({pendingJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingJobs.map((job) => (
              <Card key={job.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Čeká na Schválení
                        </Badge>
                      </div>
                      <div 
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer"
                        onClick={() => handleClientClick(job)}
                      >
                        <User className="h-4 w-4" />
                        {job.client_name}
                      </div>
                      <Badge className={categoryColors[job.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
                        {formatCategory(job.category)}
                      </Badge>
                      {job.notes && (
                        <div className="pt-2 border-t text-sm text-muted-foreground">
                          <pre className="whitespace-pre-wrap font-sans">{job.notes}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        setApprovingJob(job);
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        setScheduledDate(tomorrow.toISOString().split('T')[0]);
                        setScheduledTime('09:00');
                      }}
                      className="flex-1"
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Schválit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectJob(job.id)}
                      size="sm"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Zamítnout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sort Filter and Search */}
      <div className="filter-container flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 mobile-button">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent className="select-content">
              <SelectItem value="status">Status (Scheduled → Completed → Paid)</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most_spent">Highest Revenue</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
              <SelectItem value="person">Person Clients</SelectItem>
              <SelectItem value="company">Company Clients</SelectItem>
              <SelectItem value="home_cleaning">Home Cleaning</SelectItem>
              <SelectItem value="commercial_cleaning">Commercial Cleaning</SelectItem>
              <SelectItem value="window_cleaning">Window Cleaning</SelectItem>
              <SelectItem value="post_construction_cleaning">Post-Construction Cleaning</SelectItem>
              <SelectItem value="upholstery_cleaning">Upholstery Cleaning</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search jobs..." 
            className="pl-10 mobile-button w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedJobs.map((job) => (
          <Card key={job.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{job.job_number}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[job.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                    {job.status.replace(/_/g, ' ')}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setEditingJob(job)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDeleteJob(job.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge className={categoryColors[job.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800'}>
                {formatCategory(job.category)}
              </Badge>
              
              <div 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                onClick={() => handleClientClick(job)}
              >
                <User className="h-4 w-4" />
                {job.client_name} ({job.client_type})
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {job.scheduled_dates && job.scheduled_dates.length > 1 
                      ? `${job.scheduled_dates.length} scheduled dates` 
                      : new Date(job.scheduled_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {job.client_address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {job.client_address}{job.client_city ? `, ${job.client_city}` : ''}
                </div>
              )}
              
              {job.duration_hours && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {job.duration_hours} hours
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Revenue: {job.revenue?.toLocaleString('cs-CZ')} CZK
              </div>
              
              {job.expenses > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Expenses: {job.expenses?.toLocaleString('cs-CZ')} CZK
                </div>
              )}

              {job.payment_received_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Payment received: {new Date(job.payment_received_date).toLocaleDateString('cs-CZ')}
                </div>
              )}
              
              {job.description && (
                <p className="text-sm text-muted-foreground">
                  {job.description}
                </p>
              )}
              
              {job.supplies_needed && job.supplies_needed.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {job.supplies_needed.map((supply, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {supply}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedJobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first job.'}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Job
            </Button>
          )}
        </div>
      )}

      {showAddForm && (
        <AddJobForm
          onClose={() => setShowAddForm(false)}
          onJobAdded={handleJobAdded}
        />
      )}

      {editingJob && (
        <EditJobForm
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onJobUpdated={handleJobUpdated}
        />
      )}

      {selectedClient && (
        <ClientDetailsPopup
          client={selectedClient}
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          onClientUpdated={handleClientUpdated}
        />
      )}

      {/* Approval Dialog */}
      <Dialog open={!!approvingJob} onOpenChange={(open) => !open && setApprovingJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schválit Úklid</DialogTitle>
            <DialogDescription>
              Nastavte datum a čas úklidu pro klienta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {approvingJob && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="font-semibold">{approvingJob.title}</p>
                <p className="text-sm text-muted-foreground">Klient: {approvingJob.client_name}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="scheduled-date">Datum</Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Čas</Label>
              <Input
                id="scheduled-time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleApproveJob} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Potvrdit
              </Button>
              <Button variant="outline" onClick={() => setApprovingJob(null)} className="flex-1">
                Zrušit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
      </div>
    </Layout>
  );
}