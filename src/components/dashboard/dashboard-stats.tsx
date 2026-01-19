import { StatsCard } from "@/components/ui/stats-card"
import { useState, useEffect } from "react"
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

      const totalExpenses = paidJobs.reduce((sum, job) =>
        sum + (job.expenses || 0) + (job.supplies_expense_total || 0) + (job.transport_expense_total || 0), 0) || 0;

      // Net Profit Margin
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

      // --- Projected Revenue (30 Days) ---
      // Sum revenue for EACH occurrence in the next 30 days
      const projectedRevenue = (allJobs || []).reduce((sum, job) => {
        if (job.status === 'scheduled') {
          const revenuePerJob = job.revenue || 0;
          let occurrencesInRange = 0;

          const checkDate = (d: string | Date) => {
            const dt = new Date(d);
            return dt >= now && dt <= thirtyDaysFromNow;
          };

          if (job.scheduled_date && checkDate(job.scheduled_date)) {
            occurrencesInRange += 1;
          }
          if (Array.isArray(job.scheduled_dates) && job.scheduled_dates.length > 0) {
            const hasScheduledDateInArray = job.scheduled_date && job.scheduled_dates.includes(job.scheduled_date);
            const additionalDatesInRange = job.scheduled_dates.filter((d: string) => {
              if (d === job.scheduled_date && hasScheduledDateInArray) return false;
              return checkDate(d);
            }).length;
            occurrencesInRange += additionalDatesInRange;
          }

          return sum + (revenuePerJob * occurrencesInRange);
        }
        return sum;
      }, 0);

      // Estimated Profit uses current margin
      const projectedProfit = (projectedRevenue * (netProfitMargin / 100));

      // --- Outstanding Balance ---
      // Completed but not paid
      const outstandingBalance = (allJobs || [])
        .filter(job => job.status === 'completed') // 'completed' implies done but not yet 'paid'
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
      <StatsCard
        title="TOTAL REVENUE"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{formatCurrency(stats.totalRevenue)}</span>}
        change={stats.revenueChange}
        changeType="positive"
        icon={DollarSign}
        className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
        iconClassName="text-emerald-500 bg-emerald-500/10"
        borderClass="border-l-emerald-500 border-l-4"
      />

      <div className="cursor-pointer h-full" onClick={() => navigate('/clients')}>
        <StatsCard
          title="ACTIVE CLIENTS"
          value={<span className={blurNumbers ? "filter blur-md" : ""}>{stats.totalClients.toString()}</span>}
          change={stats.clientsChange}
          changeType="positive"
          icon={Users}
          className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
          iconClassName="text-blue-500 bg-blue-500/10"
          borderClass="border-l-blue-500 border-l-4"
        />
      </div>

      <div className="cursor-pointer h-full" onClick={() => navigate('/jobs')}>
        <StatsCard
          title="COMPLETED JOBS"
          value={<span className={blurNumbers ? "filter blur-md" : ""}>{stats.completedJobs.toString()}</span>}
          change="Lifetime completions"
          changeType="neutral"
          icon={CheckCircle}
          className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
          iconClassName="text-indigo-500 bg-indigo-500/10"
          borderClass="border-l-indigo-500 border-l-4"
        />
      </div>

      <StatsCard
        title="SCHEDULED JOBS"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{stats.scheduledJobs.toString()}</span>}
        change="Upcoming occurrences"
        changeType="neutral"
        icon={Calendar}
        className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
        iconClassName="text-amber-500 bg-amber-500/10"
        borderClass="border-l-amber-500 border-l-4"
      />

      {/* Row 2 */}
      <StatsCard
        title="NET PROFIT MARGIN"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{formatPercent(stats.netProfitMargin)}</span>}
        change="After all expenses"
        changeType="neutral"
        icon={TrendingUp}
        className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
        iconClassName="text-blue-500 bg-blue-500/10"
        borderClass="border-l-blue-500 border-l-4"
      />

      <StatsCard
        title="PROJECTED REV (30D)"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{formatCurrency(stats.projectedRevenue)}</span>}
        change={`Est. Profit: ${formatCurrency(stats.projectedProfit)}`}
        changeType="positive"
        icon={ArrowUpRight}
        className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
        iconClassName="text-emerald-500 bg-emerald-500/10"
        borderClass="border-l-emerald-500 border-l-4"
      />

      <StatsCard
        title="OUTSTANDING BAL"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{formatCurrency(stats.outstandingBalance)}</span>}
        change="Wait for payment"
        changeType="negative"
        icon={Clock}
        className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
        iconClassName="text-amber-500 bg-amber-500/10"
        borderClass="border-l-amber-500 border-l-4"
      />

      <StatsCard
        title="AVERAGE JOB VALUE"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{formatCurrency(stats.averageJobValue)}</span>}
        change="Per completed job"
        changeType="positive"
        icon={Layers}
        className="bg-card/50 backdrop-blur-sm shadow-sm rounded-3xl overflow-hidden h-full border-0"
        iconClassName="text-purple-500 bg-purple-500/10"
        borderClass="border-l-purple-500 border-l-4"
      />
    </div>
  )
}