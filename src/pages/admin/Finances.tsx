import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, Filter, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';

interface FinancialData {
  periodRevenue: number;
  periodExpenses: number;
  periodProfit: number;
  periodSuppliesExpenses: number;
  periodTransportExpenses: number;
  periodCashRevenue: number;
  periodBankRevenue: number;
  earningsDistribution: any[];
  chartData: any[];
}

export default function Finances() {
  const [financialData, setFinancialData] = useState<FinancialData>({
    periodRevenue: 0,
    periodExpenses: 0,
    periodProfit: 0,
    periodSuppliesExpenses: 0,
    periodTransportExpenses: 0,
    periodCashRevenue: 0,
    periodBankRevenue: 0,
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
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFinancialData();
      fetchAllJobsForChart();
    }
  }, [user, periodFilter, categoryFilter, customStartDate, customEndDate]);

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
          clients!inner(name)
        `)
        .eq('status', 'paid')
        .not('payment_received_date', 'is', null);

      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
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
          clients!inner(name)
        `);

      // Apply category filter if not 'all'
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
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

      // Generate chart data is now handled separately
      setFinancialData(prev => ({
        ...prev,
        periodRevenue,
        periodExpenses: computedPeriodExpenses,
        periodProfit: periodRevenue - computedPeriodExpenses,
        periodSuppliesExpenses,
        periodTransportExpenses,
        periodCashRevenue,
        periodBankRevenue,
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
    return <LoadingOverlay message="Načítám finanční data..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Finances"
          description="Track your revenue, expenses, and profit"
          action={
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl">
                    <span className="text-sm text-foreground">{getPeriodLabel(periodFilter)}</span>
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
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl">
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-sm text-foreground">
                      {categoryFilter === 'all' ? 'All Categories' : categoryFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="select-content">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="home_cleaning">Home Cleaning</SelectItem>
                    <SelectItem value="commercial_cleaning">Commercial Cleaning</SelectItem>
                    <SelectItem value="window_cleaning">Window Cleaning</SelectItem>
                    <SelectItem value="post_construction_cleaning">Post-Construction Cleaning</SelectItem>
                    <SelectItem value="upholstery_cleaning">Upholstery Cleaning</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNumbersBlurred(!numbersBlurred)}
                  className="w-full sm:w-auto h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm hover:bg-card/80 transition-all rounded-xl"
                >
                  {numbersBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>
              {periodFilter === 'custom' && (
                <div className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Input
                    id="customStartDate"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full sm:w-36 h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl"
                    placeholder="Start Date"
                  />
                  <Input
                    id="customEndDate"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full sm:w-36 h-10 bg-card/50 backdrop-blur-sm border-0 shadow-sm rounded-xl"
                    placeholder="End Date"
                  />
                </div>
              )}
            </div>
          }
        />

        <div className="grid gap-6 md:grid-cols-3 mt-4">
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue (Selected Period)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold text-blue-600 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodRevenue)}</div>
              <p className="text-xs text-muted-foreground">Selected period</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Cash:</span>
                  <span className={`font-medium ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodCashRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Bank:</span>
                  <span className={`font-medium ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodBankRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expenses (Selected Period)</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold text-rose-600 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodExpenses)}</div>
              <p className="text-xs text-muted-foreground">Selected period</p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Supplies:</span>
                  <span className={`font-medium ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodSuppliesExpenses)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Transport:</span>
                  <span className={`font-medium ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(financialData.periodTransportExpenses)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit (Selected Period)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${financialData.periodProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'} ${numbersBlurred ? "filter blur-md" : ""}`}>
                {formatCurrency(financialData.periodProfit)}
              </div>
              <p className="text-xs text-muted-foreground">Selected period</p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart and Earnings */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue Chart
                </CardTitle>
                <div className="flex flex-col gap-2 w-full">
                  <Select value={chartFilter} onValueChange={setChartFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-10">
                      <SelectValue placeholder="Chart view..." />
                    </SelectTrigger>
                    <SelectContent className="select-content">
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="quarters">Quarters</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                  {chartFilter === 'custom' && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full sm:w-36 h-10"
                        placeholder="Start Date"
                      />
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full sm:w-36 h-10"
                        placeholder="End Date"
                      />
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const total = (data.cash || 0) + (data.bank || 0);
                          return (
                            <div className="bg-background border border-border rounded p-3 shadow-lg">
                              <p className="font-medium mb-2">{label}</p>
                              <p className="text-green-600">Cash: {formatCurrency(data.cash)}</p>
                              <p className="text-blue-600">Bank: {formatCurrency(data.bank)}</p>
                              <p className="font-bold text-foreground mt-1 pt-1 border-t">Total: {formatCurrency(total)}</p>
                              {data.clients && data.clients.length > 0 && (
                                <div className="mt-2 text-sm">
                                  <p className="font-medium">Clients:</p>
                                  {data.clients.map((client: any, i: number) => (
                                    <p key={i}>{client.name}: {formatCurrency(client.amount)}</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="cash" stackId="a" fill="#2563eb" name="Cash" />
                    <Bar dataKey="bank" stackId="a" fill="#4f46e5" name="Bank" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden">
            <CardHeader>
              <CardTitle>Earnings Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {financialData.earningsDistribution.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No earnings data for selected period</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {financialData.earningsDistribution.map((member, index) => (
                    <div key={index} className={index > 0 ? "border-t pt-4" : ""}>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{member.name}</span>
                        <span className={`font-bold text-blue-600 ${numbersBlurred ? "filter blur-md" : ""}`}>{formatCurrency(member.earnings)}</span>
                      </div>
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