import { StatsCard } from "@/components/ui/stats-card"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  Target
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
    jobsCompletedThisMonth: 0
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
      // Fetch all paid jobs with payment received dates
      const { data: allJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, revenue, status, created_at, payment_received_date')
        .eq('status', 'paid')
        .not('payment_received_date', 'is', null);

      if (jobsError) throw jobsError;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Calculate total revenue from all paid jobs with payment received dates
      const totalRevenue = allJobs?.reduce((sum, job) => sum + (job.revenue || 0), 0) || 0;

      // Calculate past 30 days revenue (jobs with payment_received_date in past 30 days)
      const past30DaysPaidJobs = allJobs?.filter(job => 
        job.payment_received_date && 
        new Date(job.payment_received_date) >= thirtyDaysAgo && 
        new Date(job.payment_received_date) <= now
      ) || [];
      const past30DaysRevenue = past30DaysPaidJobs.reduce((sum, job) => sum + (job.revenue || 0), 0);

      // Fetch clients
      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, date_added');

      if (clientsError) throw clientsError;

      const totalClients = allClients?.length || 0;
      // New clients in past 30 days (based on date_added only)
      const newClientsPast30Days = allClients?.filter(client => 
        client.date_added && 
        new Date(client.date_added) >= thirtyDaysAgo && 
        new Date(client.date_added) <= now
      ).length || 0;

      // Job statistics (fetch all jobs for this)
      const { data: allJobsForStats, error: statsJobsError } = await supabase
        .from('jobs')
        .select('id, status, payment_received_date, completed_date, created_at, scheduled_date, scheduled_dates');

      if (statsJobsError) throw statsJobsError;

      const completedJobs = allJobsForStats?.filter(job => job.status === 'completed' || job.status === 'paid').length || 0;
      const scheduledJobs = allJobsForStats?.filter(job => job.status === 'scheduled').length || 0;

      // Jobs completed in past 30 days: count each scheduled occurrence within the past 30 days for jobs with status 'paid' or 'finished'
      const jobsCompletedPast30Days = (allJobsForStats || []).reduce((count, job) => {
        if (job.status === 'paid' || job.status === 'completed') {
          let occurrences = 0;
          const withinRange = (d: string | Date) => {
            const dt = new Date(d);
            return dt >= thirtyDaysAgo && dt <= now;
          };
          if (job.scheduled_date && withinRange(job.scheduled_date)) {
            occurrences += 1;
          }
          if (Array.isArray(job.scheduled_dates) && job.scheduled_dates.length) {
            occurrences += job.scheduled_dates.filter((d: string) => withinRange(d)).length;
          }
          return count + occurrences;
        }
        return count;
      }, 0);

      // Fetch quotes
      const { data: allQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, status');

      if (quotesError) throw quotesError;

      const pendingQuotes = allQuotes?.filter(quote => quote.status === 'pending').length || 0;

      setStats({
        totalRevenue,
        monthlyRevenue: past30DaysRevenue,
        revenueChange: `${formatCurrency(past30DaysRevenue)} past 30 days`,
        totalClients,
        newClientsThisMonth: newClientsPast30Days,
        clientsChange: `${newClientsPast30Days} new past 30 days`,
        completedJobs,
        scheduledJobs,
        pendingQuotes,
        jobsCompletedThisMonth: jobsCompletedPast30Days
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('cs-CZ')} CZK`;
  };

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Revenue"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{formatCurrency(stats.totalRevenue)}</span>}
        change={`${formatCurrency(stats.monthlyRevenue)} past 30 days`}
        changeType="positive"
        icon={DollarSign}
      />
      
      <div className="cursor-pointer" onClick={() => navigate('/clients')}>
        <StatsCard
          title="Active Clients"
          value={<span className={blurNumbers ? "filter blur-md" : ""}>{stats.totalClients.toString()}</span>}
          change={`${stats.newClientsThisMonth} new past 30 days`}
          changeType="positive"
          icon={Users}
        />
      </div>
      
      <div className="cursor-pointer" onClick={() => navigate('/jobs')}>
        <StatsCard
          title="Completed Jobs"
          value={<span className={blurNumbers ? "filter blur-md" : ""}>{stats.completedJobs.toString()}</span>}
          change={`${stats.jobsCompletedThisMonth} past 30 days`}
          changeType="positive"
          icon={CheckCircle}
        />
      </div>
      
      <StatsCard
        title="Scheduled Jobs"
        value={<span className={blurNumbers ? "filter blur-md" : ""}>{stats.scheduledJobs.toString()}</span>}
        change="Waiting for completion"
        changeType="neutral"
        icon={Calendar}
      />
    </div>
  )
}