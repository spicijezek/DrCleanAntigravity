import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import {
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Layers
} from "lucide-react"

interface DashboardStatsProps {
  blurNumbers?: boolean;
}

export function DashboardStats({ blurNumbers = false }: DashboardStatsProps) {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueChange: '',
    totalClients: 0,
    newClientsThisMonth: 0,
    clientsChange: '',
    completedJobs: 0,
    scheduledJobs: 0,
    pendingQuotes: 0,
    jobsCompletedThisMonth: 0,
    netProfitMargin: 0,
    projectedRevenue: 0,
    projectedProfit: 0,
    outstandingBalance: 0,
    averageJobValue: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch all jobs
      const { data: allJobs, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          id, 
          revenue, 
          expenses,
          supplies_expense_total,
          transport_expense_total,
          status, 
          created_at, 
          payment_received_date,
          completed_date,
          scheduled_date, 
          scheduled_dates,
          client_id
        `)
        .not('status', 'is', null);

      if (jobsError) throw jobsError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Helper to count occurrences in a job
      const countOccurrences = (job: any) => {
        let count = 0;
        if (job.scheduled_date) count += 1;
        if (Array.isArray(job.scheduled_dates) && job.scheduled_dates.length > 0) {
          // If scheduled_date is in scheduled_dates, only count once
          const hasScheduledDateInArray = job.scheduled_date && job.scheduled_dates.includes(job.scheduled_date);
          count += job.scheduled_dates.length - (hasScheduledDateInArray ? 1 : 0);
        }
        return count || 1; // Fallback to 1 if no dates are present but job exists
      };

      // --- Revenue & Expenses ---
      const paidJobs = allJobs?.filter(job => job.status === 'paid' && job.payment_received_date) || [];
      const totalRevenue = paidJobs.reduce((sum, job) => sum + (job.revenue || 0), 0) || 0;

      // Fetch cleaner expenses for paid jobs to match Finance page calculation
      const paidJobIds = paidJobs.map(job => job.id);
      let totalCleanerExpenses = 0;
      if (paidJobIds.length > 0) {
        const { data: jobExpenses } = await supabase
          .from('job_expenses')
          .select('cleaner_expense')
          .in('job_id', paidJobIds);
        totalCleanerExpenses = jobExpenses?.reduce((sum, exp) => sum + (exp.cleaner_expense || 0), 0) || 0;
      }

      const totalSuppliesExpenses = paidJobs.reduce((sum, job) => sum + (job.supplies_expense_total || 0), 0) || 0;
      const totalTransportExpenses = paidJobs.reduce((sum, job) => sum + (job.transport_expense_total || 0), 0) || 0;
      const totalExpenses = totalSuppliesExpenses + totalTransportExpenses + totalCleanerExpenses;

      // Net Profit Margin - matching Finance page calculation
      const netProfitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

      // --- Clients ---
      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, date_added');

      if (clientsError) throw clientsError;

      const totalClients = allClients?.length || 0;

      // Retention Rate: Clients with > 1 job / Total Clients
      const clientJobCounts: Record<string, number> = {};
      allJobs?.forEach(job => {
        if (job.client_id) {
          clientJobCounts[job.client_id] = (clientJobCounts[job.client_id] || 0) + 1;
        }
      });
      const retainedClientsCount = Object.values(clientJobCounts).filter(count => count > 1).length;
      const retentionRate = totalClients > 0 ? (retainedClientsCount / totalClients) * 100 : 0;

      // New clients past 30 days
      const newClientsPast30Days = allClients?.filter(client =>
        client.date_added &&
        new Date(client.date_added) >= thirtyDaysAgo &&
        new Date(client.date_added) <= now
      ).length || 0;

      // --- Job Counts ---
      // Completed Jobs: Count all occurrences in jobs with status 'paid' or 'completed'.
      const completedJobsCount = (allJobs || []).reduce((count, job) => {
        if (job.status === 'paid' || job.status === 'completed') {
          return count + countOccurrences(job);
        }
        return count;
      }, 0);

      const scheduledJobs = allJobs?.filter(job => job.status === 'scheduled').length || 0;

      // Jobs completed in past 30 days
      const jobsCompletedPast30Days = (allJobs || []).reduce((count, job) => {
        if (job.status === 'paid' || job.status === 'completed') {
          let occurrences = 0;
          const withinRange = (d: string | Date) => {
            const dt = new Date(d);
            return dt >= thirtyDaysAgo && dt <= now;
          };

          if (job.scheduled_date && withinRange(job.scheduled_date)) {
            occurrences += 1;
          }
          if (Array.isArray(job.scheduled_dates) && job.scheduled_dates.length > 0) {
            const hasScheduledDateInArray = job.scheduled_date && job.scheduled_dates.includes(job.scheduled_date);
            const additionalDatesInRange = job.scheduled_dates.filter((d: string) => {
              if (d === job.scheduled_date && hasScheduledDateInArray) return false;
              return withinRange(d);
            }).length;
            occurrences += additionalDatesInRange;
          }
          return count + occurrences;
        }
        return count;
      }, 0);

      // --- Projected Revenue (30 Days) - Match Finance Page ---
      // Based on last 30 days average revenue
      const last30DaysPaidJobs = paidJobs?.filter(job =>
        job.payment_received_date &&
        new Date(job.payment_received_date) >= thirtyDaysAgo &&
        new Date(job.payment_received_date) <= now
      ) || [];
      const last30DaysRevenue = last30DaysPaidJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);
      const projectedRevenue = last30DaysRevenue; // Simple projection: same as last 30 days

      // Estimated Profit uses current margin
      const projectedProfit = (projectedRevenue * (netProfitMargin / 100));

      // --- Outstanding Balance - Match Finance Page ---
      // Scheduled or completed jobs not yet paid
      const outstandingBalance = (allJobs || [])
        .filter(job => (job.status === 'scheduled' || job.status === 'completed') && !job.payment_received_date)
        .reduce((sum, job) => sum + (job.revenue || 0), 0);

      // --- Average Job Value ---
      // Revenue / Count of paid occurrences
      const totalPaidOccurrences = paidJobs.reduce((count, job) => count + countOccurrences(job), 0);
      const averageJobValue = totalPaidOccurrences > 0 ? totalRevenue / totalPaidOccurrences : 0;

      // --- Past 30 Days Revenue (for generic change text) ---
      const past30DaysPaidJobs = paidJobs?.filter(job =>
        job.payment_received_date &&
        new Date(job.payment_received_date) >= thirtyDaysAgo &&
        new Date(job.payment_received_date) <= now
      ) || [];
      const past30DaysRevenue = past30DaysPaidJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);

      const { data: allQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, status');
      if (quotesError) throw quotesError;
      const pendingQuotes = allQuotes?.filter(quote => quote.status === 'pending').length || 0;

      setStats({
        totalRevenue,
        monthlyRevenue: past30DaysRevenue,
        revenueChange: `Last 30 days: ${formatCurrency(past30DaysRevenue)}`,
        totalClients,
        newClientsThisMonth: newClientsPast30Days,
        clientsChange: `${formatPercent(retentionRate)} Retention Rate`,
        completedJobs: completedJobsCount,
        scheduledJobs,
        pendingQuotes,
        jobsCompletedThisMonth: jobsCompletedPast30Days,
        netProfitMargin,
        projectedRevenue,
        projectedProfit,
        outstandingBalance,
        averageJobValue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${Math.round(amount).toLocaleString('cs-CZ')} CZK`;
  };

  const formatPercent = (val: number) => {
    return `${val.toFixed(1)}%`;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Row 1 */}
      <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">{stats.revenueChange}</p>
        </CardContent>
      </Card>

      <div className="cursor-pointer h-full" onClick={() => navigate('/clients')}>
        <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients.toString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.clientsChange}</p>
          </CardContent>
        </Card>
      </div>

      <div className="cursor-pointer h-full" onClick={() => navigate('/jobs')}>
        <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedJobs.toString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime completions</p>
          </CardContent>
        </Card>
      </div>

      <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Scheduled Jobs</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.scheduledJobs.toString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Upcoming occurrences</p>
        </CardContent>
      </Card>

      {/* Row 2 */}
      <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit Margin</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPercent(stats.netProfitMargin)}</div>
          <p className="text-xs text-muted-foreground mt-1">After all expenses</p>
        </CardContent>
      </Card>

      <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Revenue (30d)</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.projectedRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">Est. Profit: {formatCurrency(stats.projectedProfit)}</p>
        </CardContent>
      </Card>

      <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.outstandingBalance)}</div>
          <p className="text-xs text-muted-foreground mt-1">Wait for payment</p>
        </CardContent>
      </Card>

      <Card className={`border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden ${blurNumbers ? 'blur-sm select-none' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Job Value</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.averageJobValue)}</div>
          <p className="text-xs text-muted-foreground mt-1">Per completed job</p>
        </CardContent>
      </Card>
    </div>
  )
}