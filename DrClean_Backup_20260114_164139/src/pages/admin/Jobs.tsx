import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Calendar, User, MapPin, Clock, DollarSign, Edit, Trash2, ArrowUpDown, Check, X, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";
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
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground/90">Zakázky</h1>
            <p className="text-muted-foreground/60 font-medium whitespace-nowrap">Správa úklidových zakázek</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Přidat zakázku
          </Button>
        </div>

        {/* Pending Job Requests Section */}
        {pendingJobs.length > 0 && (
          <div className="relative overflow-hidden rounded-[2.5rem] bg-amber-500/10 border border-amber-500/20 p-6 animate-in zoom-in duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <AlertCircle className="h-32 w-32 rotate-12" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-amber-900 dark:text-amber-100">Nové Žádosti o Úklid ({pendingJobs.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingJobs.map((job) => (
                  <Card key={job.id} className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2rem] group transition-all duration-300 hover:shadow-2xl">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                    <CardContent className="p-5 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{job.title}</h3>
                          <div
                            className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 uppercase tracking-wider cursor-pointer hover:underline"
                            onClick={() => handleClientClick(job)}
                          >
                            <User className="h-3 w-3" />
                            {job.client_name}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-tighter", categoryColors[job.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-800')}>
                          {formatCategory(job.category)}
                        </Badge>
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
                          className="flex-1 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
                        >
                          <Check className="h-4 w-4 mr-1.5" />
                          Schválit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleRejectJob(job.id)}
                          className="flex-1 h-9 rounded-xl bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 font-bold text-xs"
                        >
                          <X className="h-4 w-4 mr-1.5" />
                          Zamítnout
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Glassmorphic Filter Bar */}
        <div className="flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="flex flex-col sm:flex-row gap-3 xl:w-auto w-full">
            <div className="relative group flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-blue-500" />
              <Input
                placeholder="Hledat zakázky..."
                className="pl-12 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all w-full text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-white/10 shadow-sm sm:w-auto w-full">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <ArrowUpDown className="h-4 w-4" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-2 h-auto text-sm font-medium min-w-[200px]">
                  <SelectValue placeholder="Seřadit dle" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <SelectItem value="status">Dle stavu</SelectItem>
                  <SelectItem value="newest">Nejnovější</SelectItem>
                  <SelectItem value="oldest">Nejstarší</SelectItem>
                  <SelectItem value="most_spent">Nejvyšší tržba</SelectItem>
                  <SelectItem value="alphabetical">Dle jména</SelectItem>
                  <SelectItem value="home_cleaning">Bytový úklid</SelectItem>
                  <SelectItem value="commercial_cleaning">Komerční úklid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedJobs.map((job) => (
            <Card key={job.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-slate-900">
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2 z-10 transition-all duration-500",
                statusColors[job.status as keyof typeof statusColors] || 'bg-slate-200'
              )} />

              <CardContent className="p-7 space-y-5">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight text-foreground/90 leading-tight">
                      {job.job_number}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("px-2.5 py-0.5 text-[10px] font-black rounded-full border shadow-sm uppercase tracking-widest", statusColors[job.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-800')}>
                        {job.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingJob(job)}
                      className="h-9 w-9 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all hover:scale-110"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteJob(job.id)}
                      className="h-9 w-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100/50 space-y-3 transition-colors group-hover:bg-slate-50">
                    <div
                      className="flex items-center gap-3 cursor-pointer group/client"
                      onClick={() => handleClientClick(job)}
                    >
                      <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-blue-500 shrink-0 border border-blue-50">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-blue-900/40 dark:text-blue-400/40 uppercase tracking-widest leading-none mb-1">Zákazník</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate group-hover/client:text-blue-600 transition-colors">
                          {job.client_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-emerald-500 shrink-0 border border-emerald-50">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-emerald-900/40 dark:text-emerald-400/40 uppercase tracking-widest leading-none mb-1">Termín</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {job.scheduled_dates && job.scheduled_dates.length > 1
                            ? `${job.scheduled_dates.length} termínů`
                            : new Date(job.scheduled_date).toLocaleDateString('cs-CZ')}
                        </p>
                      </div>
                    </div>

                    {job.client_address && (
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-rose-500 shrink-0 border border-rose-50">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-rose-900/40 dark:text-rose-400/40 uppercase tracking-widest leading-none mb-1">Lokalita</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {job.client_address}{job.client_city ? `, ${job.client_city}` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/30 flex flex-col items-center text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tržba</p>
                      <p className="text-sm font-black text-blue-600 leading-none">
                        {job.revenue?.toLocaleString('cs-CZ')} Kč
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/30 flex flex-col items-center text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Náklady</p>
                      <p className="text-sm font-black text-rose-600 leading-none">
                        {job.expenses?.toLocaleString('cs-CZ')} Kč
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge className={cn("px-2.5 py-1 text-[9px] font-black rounded-full uppercase tracking-widest border-0", categoryColors[job.category as keyof typeof categoryColors] || 'bg-slate-100 text-slate-800')}>
                    {formatCategory(job.category)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedJobs.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-xl animate-in fade-in zoom-in duration-700">
            <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-6">
              <Calendar className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Žádné zakázky nenalezeny</h3>
            <p className="text-muted-foreground font-medium mb-8 text-center max-w-sm">
              {searchTerm ? 'Zkuste upravit vyhledávací termíny.' : 'Začněte přidáním své první zakázky.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="rounded-2xl h-11 px-8 font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Přidat první zakázku
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
    </Layout>
  );
}