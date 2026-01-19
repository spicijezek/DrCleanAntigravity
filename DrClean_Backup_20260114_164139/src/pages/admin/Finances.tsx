import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Filter, Eye, EyeOff, UserCheck, Percent, AlertCircle, Target, Search, Building2, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { useMobileResponsive } from '@/components/ui/mobile-responsive';
import { StatsCard } from '@/components/ui/stats-card';

interface FinancialData {
  periodRevenue: number;
  periodExpenses: number;
  periodProfit: number;
  periodSuppliesExpenses: number;
  periodTransportExpenses: number;
  periodCashRevenue: number;
  periodBankRevenue: number;
  margin: number;
  projectedRevenue: number;
  outstandingBalance: number;
  averageJobValue: number;
  earningsDistribution: any[];
  chartData: any[];
}

export default function Finances() {
  useMobileResponsive();
  const [financialData, setFinancialData] = useState<FinancialData>({
    periodRevenue: 0,
    periodExpenses: 0,
    periodProfit: 0,
    periodSuppliesExpenses: 0,
    periodTransportExpenses: 0,
    periodCashRevenue: 0,
    periodBankRevenue: 0,
    margin: 0,
    projectedRevenue: 0,
    outstandingBalance: 0,
    averageJobValue: 0,
    earningsDistribution: [],
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [numbersBlurred, setNumbersBlurred] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('30');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [chartFilter, setChartFilter] = useState('months');
  const [allJobsForChart, setAllJobsForChart] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [allClients, setAllClients] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchClients();
      fetchFinancialData();
      fetchAllJobsForChart();
    }
  }, [user, periodFilter, categoryFilter, customStartDate, customEndDate, clientSearchQuery, clientTypeFilter]);

  useEffect(() => {
    if (allJobsForChart.length > 0) {
      const chartData = generateChartData(allJobsForChart);
      setFinancialData(prev => ({ ...prev, chartData }));
    }
  }, [chartFilter, allJobsForChart]);

  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (periodFilter === 'custom') {
      return {
        start: customStartDate ? new Date(customStartDate) : today,
        end: customEndDate ? new Date(customEndDate + 'T23:59:59') : now
      };
    }

    if (periodFilter === 'total') {
      return { start: new Date(2020, 0, 1), end: now };
    }

    const days = parseInt(periodFilter);
    const start = new Date(today);
    start.setDate(start.getDate() - days);

    return { start, end: now };
  };

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, client_type')
        .order('name');

      if (error) throw error;
      setAllClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAllJobsForChart = async () => {
    try {
      // Fetch ALL PAID jobs for chart (independent of period filter)
      let query = supabase
        .from('jobs')
        .select(`
          id,
          revenue, 
          payment_received_date, 
          payment_type,
          title, 
          status,
          category,
          client_id,
          clients!inner(name, client_type)
        `)
        .eq('status', 'paid')
        .not('payment_received_date', 'is', null);

      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      // Apply client type filter
      if (clientTypeFilter !== 'all') {
        query = query.eq('clients.client_type', clientTypeFilter);
      }

      // Apply client search filter
      if (clientSearchQuery) {
        const matchingClients = allClients.filter(c =>
          c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
        ).map(c => c.id);
        if (matchingClients.length > 0) {
          query = query.in('client_id', matchingClients);
        } else {
          setAllJobsForChart([]);
          return;
        }
      }

      const { data: allJobs, error: jobsError } = await query.order('payment_received_date', { ascending: true });

      if (jobsError) throw jobsError;
      setAllJobsForChart(allJobs || []);
    } catch (error: any) {
      console.error('Error fetching chart data:', error);
    }
  };

  const fetchFinancialData = async () => {
    try {
      // Fetch ALL jobs with payment info
      let query = supabase
        .from('jobs')
        .select(`
          id,
          revenue, 
          expenses, 
          payment_received_date,
          completed_date,
          scheduled_date,
          scheduled_dates,
          supplies_expense_total,
          transport_expense_total,
          payment_type,
          title, 
          status,
          category,
          client_id,
          clients!inner(name, client_type)
        `);

      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }

      // Apply client type filter
      if (clientTypeFilter !== 'all') {
        query = query.eq('clients.client_type', clientTypeFilter);
      }

      // Apply client search filter
      if (clientSearchQuery) {
        const matchingClients = allClients.filter(c =>
          c.name.toLowerCase().includes(clientSearchQuery.toLowerCase())
        ).map(c => c.id);
        if (matchingClients.length > 0) {
          query = query.in('client_id', matchingClients);
        }
      }

      const { data: allJobs, error: jobsError } = await query;

      if (jobsError) throw jobsError;

      const { start: periodStart, end: periodEnd } = getDateRange();

      const periodJobs = allJobs?.filter(job =>
        job.payment_received_date &&
        new Date(job.payment_received_date) >= periodStart &&
        new Date(job.payment_received_date) <= periodEnd
      ) || [];

      const periodRevenue = periodJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);
      const periodExpenses = periodJobs.reduce((sum, job) => sum + (job.expenses || 0), 0);
      const periodSuppliesExpenses = periodJobs.reduce((sum, job) => sum + (job.supplies_expense_total || 0), 0);
      const periodTransportExpenses = periodJobs.reduce((sum, job) => sum + (job.transport_expense_total || 0), 0);

      // Calculate cash vs bank revenue
      const periodCashRevenue = periodJobs.filter(job => job.payment_type === 'cash').reduce((sum, job) => sum + (job.revenue || 0), 0);
      const periodBankRevenue = periodJobs.filter(job => job.payment_type === 'bank').reduce((sum, job) => sum + (job.revenue || 0), 0);

      // Get period job IDs for earnings calculation
      const periodJobIds = periodJobs.map(job => job.id);

      // Calculate earnings distribution
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('id, name');

      // For any period, compute earnings for PAID (by payment_received_date) OR FINISHED (by completed_date) jobs
      let periodCleanerExpenses = 0;
      let earningsDistribution: { name: string; earnings: number }[] = [];

      const periodJobsForEarnings = (allJobs || []).filter(job => {
        const paidInPeriod = job.status === 'paid' && job.payment_received_date &&
          new Date(job.payment_received_date) >= periodStart && new Date(job.payment_received_date) <= periodEnd;
        return paidInPeriod;
      });
      const periodJobIdsForEarnings = periodJobsForEarnings.map(job => job.id);

      if (periodJobIdsForEarnings.length > 0) {
        const { data: jobExpenses } = await supabase
          .from('job_expenses')
          .select('team_member_id, cleaner_expense, job_id')
          .in('job_id', periodJobIdsForEarnings);

        // Sum cleaner expenses for the period
        periodCleanerExpenses = (jobExpenses || []).reduce((sum, e) => sum + Number(e.cleaner_expense || 0), 0);

        // Map earnings per member
        earningsDistribution = (teamMembers || []).map(member => {
          const memberExpenses = (jobExpenses || []).filter(expense => expense.team_member_id === member.id);
          const totalEarnings = memberExpenses.reduce((sum, expense) => sum + Number(expense.cleaner_expense || 0), 0);
          return { name: member.name, earnings: totalEarnings };
        }).filter(member => member.earnings > 0)
          .sort((a, b) => b.earnings - a.earnings); // Sort from highest to lowest
      }

      // Override periodExpenses to be the sum of supplies + transport + cleaner expenses to keep math consistent
      const computedPeriodExpenses = periodSuppliesExpenses + periodTransportExpenses + periodCleanerExpenses;
      const periodProfit = periodRevenue - computedPeriodExpenses;

      // Calculate new KPIs
      const margin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;

      // Projected Revenue: sum of scheduled and pending jobs
      const projectedJobs = allJobs?.filter(job =>
        ['scheduled', 'pending'].includes(job.status)
      ) || [];
      const projectedRevenue = projectedJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);

      // Outstanding Balance: completed but not paid jobs
      const outstandingJobs = allJobs?.filter(job =>
        job.status === 'completed'
      ) || [];
      const outstandingBalance = outstandingJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);

      // Average Job Value: total revenue / number of paid jobs in period
      const averageJobValue = periodJobs.length > 0 ? periodRevenue / periodJobs.length : 0;

      // Generate chart data is now handled separately
      setFinancialData(prev => ({
        ...prev,
        periodRevenue,
        periodExpenses: computedPeriodExpenses,
        periodProfit,
        periodSuppliesExpenses,
        periodTransportExpenses,
        periodCashRevenue,
        periodBankRevenue,
        margin,
        projectedRevenue,
        outstandingBalance,
        averageJobValue,
        earningsDistribution
      }));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch financial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = (jobs: any[]) => {
    let filteredJobs = jobs;

    // Apply custom date filter if selected
    if (chartFilter === 'custom' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate + 'T23:59:59');
      filteredJobs = jobs.filter(job => {
        const paymentDate = new Date(job.payment_received_date);
        return paymentDate >= start && paymentDate <= end;
      });
    }

    if (chartFilter === 'days' || chartFilter === 'custom') {
      // Group by day
      const dayGroups: { [key: string]: any } = {};
      filteredJobs.forEach(job => {
        const day = new Date(job.payment_received_date).toLocaleDateString();
        if (!dayGroups[day]) {
          dayGroups[day] = { period: day, cash: 0, bank: 0, clients: [] };
        }
        const amount = job.revenue || 0;
        if (job.payment_type === 'cash') {
          dayGroups[day].cash += amount;
        } else {
          dayGroups[day].bank += amount;
        }
        dayGroups[day].clients.push({ name: job.clients?.name || 'Unknown', amount });
      });
      return Object.values(dayGroups);
    } else if (chartFilter === 'quarters') {
      // Group by quarter
      const quarterGroups: { [key: string]: any } = {};
      filteredJobs.forEach(job => {
        const date = new Date(job.payment_received_date);
        const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
        if (!quarterGroups[quarter]) {
          quarterGroups[quarter] = { period: quarter, cash: 0, bank: 0, clients: [] };
        }
        const amount = job.revenue || 0;
        if (job.payment_type === 'cash') {
          quarterGroups[quarter].cash += amount;
        } else {
          quarterGroups[quarter].bank += amount;
        }
        quarterGroups[quarter].clients.push({ name: job.clients?.name || 'Unknown', amount });
      });
      return Object.values(quarterGroups);
    } else {
      // Group by month (default)
      const monthGroups: { [key: string]: any } = {};
      filteredJobs.forEach(job => {
        const date = new Date(job.payment_received_date);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthGroups[month]) {
          monthGroups[month] = { period: month, cash: 0, bank: 0, clients: [] };
        }
        const amount = job.revenue || 0;
        if (job.payment_type === 'cash') {
          monthGroups[month].cash += amount;
        } else {
          monthGroups[month].bank += amount;
        }
        monthGroups[month].clients.push({ name: job.clients?.name || 'Unknown', amount });
      });
      return Object.values(monthGroups);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount)} CZK`;
  };

  const getPeriodLabel = (v: string) => {
    switch (v) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 3 months';
      case '180': return 'Last 6 months';
      case '365': return 'Past 365 days';
      case 'total': return 'Total';
      case 'custom': return 'Custom Range';
      default: return 'Select period...';
    }
  };

  const getChartLabel = (v: string) => {
    switch (v) {
      case 'days': return 'Days';
      case 'months': return 'Months';
      case 'quarters': return 'Quarters';
      case 'custom': return 'Custom Range';
      default: return 'Months';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground/90 leading-none">Finance</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary/60" />
              Sledujte své příjmy, výdaje a zisk
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNumbersBlurred(!numbersBlurred)}
              className="rounded-[1.25rem] h-12 w-12 p-0 shadow-sm transition-all hover:scale-105 active:scale-95 border-primary/20 text-primary hover:bg-primary/5"
            >
              {numbersBlurred ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Glassmorphic Filter Bar */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000 space-y-4">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Client Search */}
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Hledat klienta..."
                className="pl-12 h-14 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all w-full text-base font-medium"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
              />
            </div>

            {/* Time Period Filter */}
            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 pl-4 pr-2 h-14 rounded-2xl border border-white/40 shadow-sm min-w-[240px] transition-all hover:shadow-md">
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <Calendar className="h-4 w-4" />
              </div>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto font-black text-slate-700 dark:text-slate-200 text-sm">
                  <SelectValue placeholder="Vyberte období" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 max-h-[400px]">
                  <SelectItem value="7" className="rounded-xl font-bold px-4 py-2.5">Posledních 7 dní</SelectItem>
                  <SelectItem value="30" className="rounded-xl font-bold px-4 py-2.5">Posledních 30 dní</SelectItem>
                  <SelectItem value="90" className="rounded-xl font-bold px-4 py-2.5">Poslední 3 měsíce</SelectItem>
                  <SelectItem value="180" className="rounded-xl font-bold px-4 py-2.5">Posledních 6 měsíců</SelectItem>
                  <SelectItem value="365" className="rounded-xl font-bold px-4 py-2.5">Minulý rok</SelectItem>
                  <SelectItem value="total" className="rounded-xl font-bold px-4 py-2.5">Celkem</SelectItem>
                  <SelectItem value="custom" className="rounded-xl font-bold px-4 py-2.5">Vlastní rozsah</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Job Category Filter */}
            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 pl-4 pr-2 h-14 rounded-2xl border border-white/40 shadow-sm flex-1 transition-all hover:shadow-md">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                <Filter className="h-4 w-4" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto font-black text-slate-700 dark:text-slate-200 text-sm">
                  <SelectValue placeholder="Všechny kategorie" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 max-h-[400px]">
                  <SelectItem value="all" className="rounded-xl font-bold px-4 py-2.5">Všechny kategorie</SelectItem>
                  <SelectItem value="home_cleaning" className="rounded-xl font-bold px-4 py-2.5">Úklid domácnosti</SelectItem>
                  <SelectItem value="commercial_cleaning" className="rounded-xl font-bold px-4 py-2.5">Komerční úklid</SelectItem>
                  <SelectItem value="window_cleaning" className="rounded-xl font-bold px-4 py-2.5">Mytí oken</SelectItem>
                  <SelectItem value="post_construction_cleaning" className="rounded-xl font-bold px-4 py-2.5">Po stavební úklid</SelectItem>
                  <SelectItem value="upholstery_cleaning" className="rounded-xl font-bold px-4 py-2.5">Čištění čalounění</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Type Filter */}
            <div className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 pl-4 pr-2 h-14 rounded-2xl border border-white/40 shadow-sm flex-1 transition-all hover:shadow-md">
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-0 h-auto font-black text-slate-700 dark:text-slate-200 text-sm">
                  <SelectValue placeholder="Typ klienta" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <SelectItem value="all" className="rounded-xl font-bold px-4 py-2.5">Všichni klienti</SelectItem>
                  <SelectItem value="person" className="rounded-xl font-bold px-4 py-2.5">Osoba</SelectItem>
                  <SelectItem value="company" className="rounded-xl font-bold px-4 py-2.5">Firma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {periodFilter === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Od</Label>
                <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-12 bg-white/50 border-0 rounded-xl shadow-sm focus-visible:ring-primary/20 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-1">Do</Label>
                <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-12 bg-white/50 border-0 rounded-xl shadow-sm focus-visible:ring-primary/20 font-bold" />
              </div>
            </div>
          )}
        </div>

        {/* Financial Overview Cards - Premium KPIs */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Příjmy (Období)"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{formatCurrency(financialData.periodRevenue)}</span>}
            change={getPeriodLabel(periodFilter)}
            changeType="positive"
            icon={DollarSign}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500"
          />

          <StatsCard
            title="Výdaje (Období)"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{formatCurrency(financialData.periodExpenses)}</span>}
            change={getPeriodLabel(periodFilter)}
            changeType="negative"
            icon={TrendingDown}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75"
          />

          <StatsCard
            title="Čistý Zisk"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{formatCurrency(financialData.periodProfit)}</span>}
            change={getPeriodLabel(periodFilter)}
            changeType={financialData.periodProfit >= 0 ? "positive" : "negative"}
            icon={TrendingUp}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100"
          />

          <StatsCard
            title="Marže"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{Math.round(financialData.margin)}%</span>}
            change="Zisková marže"
            changeType="neutral"
            icon={Percent}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150"
          />

          <StatsCard
            title="Očekávané Příjmy"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{formatCurrency(financialData.projectedRevenue)}</span>}
            change="Naplánované zakázky"
            changeType="neutral"
            icon={Calendar}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200"
          />

          <StatsCard
            title="Nesplacený Zůstatek"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{formatCurrency(financialData.outstandingBalance)}</span>}
            change="Dokončené nezaplacené"
            changeType="neutral"
            icon={AlertCircle}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-250"
          />

          <StatsCard
            title="Průměrná Hodnota"
            value={<span className={numbersBlurred ? "filter blur-md" : ""}>{formatCurrency(financialData.averageJobValue)}</span>}
            change="Na zakázku"
            changeType="neutral"
            icon={Target}
            className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300"
          />
        </div>

        {/* Original Detailed Financial Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="rounded-[2.5rem] border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-emerald-500 z-20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Příjmy (Období)</CardTitle>
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-all">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black text-emerald-600 ${numbersBlurred ? "filter blur-md" : ""} leading-none`}>
                {formatCurrency(financialData.periodRevenue)}
              </div>
              <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-2">{getPeriodLabel(periodFilter)}</p>
              <div className="mt-6 pt-6 border-t border-slate-100/50 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">Hotovost:</span>
                  <span className={`text-slate-900 dark:text-slate-100 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodCashRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">Banka:</span>
                  <span className={`text-slate-900 dark:text-slate-100 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodBankRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-rose-500 z-20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Výdaje (Období)</CardTitle>
              <div className="h-10 w-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-all">
                <TrendingDown className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black text-rose-600 ${numbersBlurred ? "filter blur-md" : ""} leading-none`}>
                {formatCurrency(financialData.periodExpenses)}
              </div>
              <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-2">{getPeriodLabel(periodFilter)}</p>
              <div className="mt-6 pt-6 border-t border-slate-100/50 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">Materiál a Doprava:</span>
                  <span className={`text-slate-900 dark:text-slate-100 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodSuppliesExpenses + financialData.periodTransportExpenses)}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">Mzdy:</span>
                  <span className={`text-slate-900 dark:text-slate-100 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodExpenses - (financialData.periodSuppliesExpenses + financialData.periodTransportExpenses))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden relative group hover:shadow-2xl transition-all duration-500">
            <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-indigo-500 z-20" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Čistý Zisk (Období)</CardTitle>
              <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-all">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black ${financialData.periodProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'} ${numbersBlurred ? "filter blur-md" : ""} leading-none`}>
                {formatCurrency(financialData.periodProfit)}
              </div>
              <p className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-2">{getPeriodLabel(periodFilter)}</p>
              <div className="mt-6 pt-6 border-t border-slate-100/50">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-muted-foreground">Marže:</span>
                  <span className="text-slate-900 dark:text-slate-100">
                    {financialData.periodRevenue > 0 ? Math.round((financialData.periodProfit / financialData.periodRevenue) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart and Earnings */}
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-2 rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-2xl overflow-hidden relative animate-in fade-in slide-in-from-left-4 duration-1000 hover:shadow-3xl transition-all">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  Vývoj Příjmů
                </CardTitle>
                <div className="flex items-center gap-2 bg-white/50 p-1 rounded-2xl border border-white/20">
                  <Select value={chartFilter} onValueChange={setChartFilter}>
                    <SelectTrigger className="w-full sm:w-36 h-10 rounded-xl border-0 bg-transparent shadow-none font-black text-sm">
                      <SelectValue placeholder="Zobrazení..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="days" className="font-bold">Dny</SelectItem>
                      <SelectItem value="months" className="font-bold">Měsíce</SelectItem>
                      <SelectItem value="quarters" className="font-bold">Kvartály</SelectItem>
                      <SelectItem value="custom" className="font-bold">Vlastní</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.3} />
                    <XAxis
                      dataKey="period"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 10 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const total = (data.cash || 0) + (data.bank || 0);
                          return (
                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl animate-in zoom-in-95 duration-200 min-w-[220px]">
                              <p className="font-black text-slate-800 dark:text-slate-100 mb-4 text-sm uppercase tracking-widest">{label}</p>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Hotovost
                                  </span>
                                  <span className="text-sm font-black">{formatCurrency(data.cash)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-blue-600">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> Banka
                                  </span>
                                  <span className="text-sm font-black">{formatCurrency(data.bank)}</span>
                                </div>
                                <div className="pt-3 mt-3 border-t border-slate-200/50 flex items-center justify-between gap-4">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Celkem</span>
                                  <span className="text-base font-black text-indigo-600">{formatCurrency(total)}</span>
                                </div>
                              </div>
                              {data.clients && data.clients.length > 0 && (
                                <div className="mt-5 pt-4 border-t border-slate-200/50">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Největší zakázky</p>
                                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 scrollbar-hide">
                                    {data.clients.sort((a: any, b: any) => b.amount - a.amount).slice(0, 5).map((client: any, i: number) => (
                                      <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100/50">
                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{client.name}</span>
                                        <span className="text-[11px] font-black">{formatCurrency(client.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="cash" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="bank" stackId="a" fill="#3B82F6" radius={[12, 12, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-0 shadow-2xl bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-900/50 dark:to-slate-900/30 backdrop-blur-2xl overflow-hidden relative animate-in fade-in slide-in-from-right-4 duration-1000 hover:shadow-3xl transition-all">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                  <UserCheck className="h-6 w-6" />
                </div>
                Výplaty Týmu
              </CardTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">Zasloužené odměny v období</p>
            </CardHeader>
            <CardContent>
              {financialData.earningsDistribution.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-4">
                    <EyeOff className="h-8 w-8" />
                  </div>
                  <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Žádná data pro toto období</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {financialData.earningsDistribution.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                          {member.name[0]}
                        </div>
                        <div>
                          <span className="font-black text-sm text-slate-700 dark:text-slate-200 block leading-none">{member.name}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mt-1 block">Tým DrClean</span>
                        </div>
                      </div>
                      <span className={`font-black text-base text-indigo-600 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(member.earnings)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}