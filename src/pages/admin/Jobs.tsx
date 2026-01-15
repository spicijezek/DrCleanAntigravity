import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calendar, User, MapPin, Clock, DollarSign, Edit, Trash2, ArrowUpDown, Check, X, AlertCircle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddJobForm } from '@/components/forms/AddJobForm';
import { EditJobForm } from '@/components/forms/EditJobForm';
import { ClientDetailsPopup } from '@/components/forms/ClientDetailsPopup';
import { Layout } from '@/components/layout/Layout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';

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
    return <LoadingOverlay message="Načítám úkoly..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Jobs"
          description="Manage your cleaning jobs and schedules"
          action={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search jobs..."
                  className="pl-10 h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl focus-visible:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Sort & Filter" />
                </SelectTrigger>
                <SelectContent className="select-content">
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most_spent">Highest Revenue</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="person">Person Clients</SelectItem>
                  <SelectItem value="company">Company Clients</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowAddForm(true)}
                className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all rounded-xl gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Job
              </Button>
            </div>
          }
        />

        {/* Pending Job Requests Section */}
        {pendingJobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 px-1">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Nové Žádosti o Úklid ({pendingJobs.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingJobs.map((job) => (
                <Card key={job.id} className="bg-amber-50/30 backdrop-blur-sm border-amber-200/50 shadow-md rounded-3xl overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-amber-500">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                        <div
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={() => handleClientClick(job)}
                        >
                          <User className="h-3.5 w-3.5" />
                          {job.client_name}
                        </div>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border-0">
                        Čeká
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className={cn("border-0", categoryColors[job.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800')}>
                        {formatCategory(job.category)}
                      </Badge>
                    </div>

                    {job.notes && (
                      <div className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl text-xs text-muted-foreground border border-amber-100/50">
                        <p className="line-clamp-3 italic">"{job.notes}"</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => {
                          setApprovingJob(job);
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setScheduledDate(tomorrow.toISOString().split('T')[0]);
                          setScheduledTime('09:00');
                        }}
                        className="flex-1 rounded-xl h-9 bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Schválit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleRejectJob(job.id)}
                        size="sm"
                        className="flex-1 rounded-xl h-9 hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-colors"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Zamítnout
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1">Seznam úkolů</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedJobs.map((job) => (
              <Card key={job.id} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold">{job.job_number}</CardTitle>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className={cn("border-0", statusColors[job.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800')}>
                          {job.status.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant="outline" className={cn("border-0 bg-secondary/50", categoryColors[job.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800')}>
                          {formatCategory(job.category)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingJob(job)}
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteJob(job.id)}
                        className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div
                    className="flex items-center gap-2 text-sm text-foreground font-medium hover:text-primary cursor-pointer transition-colors"
                    onClick={() => handleClientClick(job)}
                  >
                    <User className="h-4 w-4 text-primary" />
                    {job.client_name}
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 bg-muted rounded-md font-normal">
                      {job.client_type}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary/70 shrink-0" />
                      <span className="truncate">
                        {job.scheduled_dates && job.scheduled_dates.length > 1
                          ? `${job.scheduled_dates.length} scheduled dates`
                          : new Date(job.scheduled_date).toLocaleDateString('cs-CZ')}
                      </span>
                    </div>

                    {job.client_address && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="truncate">{job.client_address}{job.client_city ? `, ${job.client_city}` : ''}</span>
                      </div>
                    )}

                    {job.duration_hours && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 text-primary/70 shrink-0" />
                        <span>{job.duration_hours} hours</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
                      <DollarSign className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{job.revenue?.toLocaleString('cs-CZ')} CZK</span>
                    </div>
                  </div>

                  {job.description && (
                    <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-2xl line-clamp-2 italic">
                      {job.description}
                    </p>
                  )}

                  {job.supplies_needed && job.supplies_needed.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.supplies_needed.map((supply, index) => (
                        <Badge key={index} variant="outline" className="text-[10px] py-0 h-5 px-2 bg-background/50 border-primary/10">
                          {supply}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredAndSortedJobs.length === 0 && !loading && (
          <div className="text-center py-20 bg-card/30 backdrop-blur-sm rounded-3xl border border-dashed border-muted-foreground/20">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No jobs found</h3>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto text-sm">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'Start by adding your first cleaning job to the system.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="rounded-xl shadow-md border-0 bg-primary hover:bg-primary/90 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            )}
          </div>
        )}

        {/* Forms & Dialogs */}
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
          <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-[2rem] max-w-md p-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Schválit Úklid</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Nastavte datum a čas úklidu pro klienta
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {approvingJob && (
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-1">
                  <p className="font-bold text-lg leading-tight">{approvingJob.title}</p>
                  <p className="text-sm text-primary flex items-center gap-1.5 font-medium">
                    <User className="h-3.5 w-3.5" />
                    {approvingJob.client_name}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date" className="text-sm font-semibold ml-1">Datum</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduled-time" className="text-sm font-semibold ml-1">Čas</Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="h-11 bg-background/50 border-0 shadow-sm rounded-xl focus:ring-2 ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleApproveJob} className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg border-0">
                  <Check className="h-5 w-5 mr-2" />
                  Potvrdit
                </Button>
                <Button variant="ghost" onClick={() => setApprovingJob(null)} className="flex-1 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Zrušit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}