import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/contexts/AuthContext"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
  DollarSign,
  Users,
  Calendar,
  ChevronRight
} from "lucide-react"

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  status: string;
  amount?: string;
  entityId?: string; // job or client ID for navigation
  entityType?: 'job' | 'client';
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case "job_completed":
      return CheckCircle
    case "job_created":
      return Calendar
    case "payment":
      return DollarSign
    case "new_client":
      return Users
    case "review":
      return Star
    default:
      return AlertCircle
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-emerald-500 text-white"
    case "pending":
      return "bg-amber-500 text-white"
    case "paid":
      return "bg-indigo-600 text-white"
    case "new":
      return "bg-blue-500 text-white"
    case "scheduled":
      return "bg-slate-600 text-white"
    default:
      return "bg-slate-400 text-white"
  }
}

const getCzechStatus = (status: string) => {
  switch (status) {
    case "completed": return "Dokončeno";
    case "pending": return "Čekající";
    case "paid": return "Zaplaceno";
    case "new": return "Nový";
    case "scheduled": return "Plánováno";
    default: return status;
  }
}

const getCzechTypeTitle = (type: string, title: string) => {
  switch (type) {
    case "job_completed": return "Úklid dokončen";
    case "job_created": return "Nová rezervace";
    case "payment": return "Platba přijata";
    case "new_client": return "Nový klient";
    case "review": return "Nová recenze";
    default: return title;
  }
}

const getCzechTime = (time: string) => {
  if (time.includes('moments ago')) return 'před chvílí';
  if (time.includes('h ago')) return `před ${time.split('h')[0]} hod.`;
  if (time.includes('days ago')) return `před ${time.split(' ')[0]} dny`;
  return time;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
    }
  }, [user]);

  const fetchRecentActivity = async () => {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

      // Fetch recent jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id, title, status, created_at, revenue, updated_at,
          clients (name)
        `)
        .gte('created_at', threeDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .gte('created_at', threeDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentActivities: Activity[] = [];

      // Add job activities
      jobs?.forEach(job => {
        const clientName = job.clients?.name || 'Neznámý klient';

        // Job created activity
        const jobDate = new Date(job.created_at);
        const jobAge = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60));
        recentActivities.push({
          id: `job-created-${job.id}`,
          type: 'job_created',
          title: 'Nová rezervace',
          description: `${job.title} - ${clientName}`,
          time: jobAge < 1 ? 'moments ago' : jobAge < 24 ? `${jobAge}h ago` : `${Math.floor(jobAge / 24)} days ago`,
          status: job.status,
          amount: job.revenue ? `${job.revenue.toLocaleString()} CZK` : undefined,
          entityId: job.id,
          entityType: 'job'
        });

        // If job was completed/paid, add separate activity
        if (job.status === 'completed' || job.status === 'paid') {
          const updateDate = new Date(job.updated_at);
          const updateAge = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));
          recentActivities.push({
            id: `job-completed-${job.id}`,
            type: job.status === 'paid' ? 'payment' : 'job_completed',
            title: job.status === 'paid' ? 'Platba přijata' : 'Úklid dokončen',
            description: `${job.title} - ${clientName}`,
            time: updateAge < 1 ? 'moments ago' : updateAge < 24 ? `${updateAge}h ago` : `${Math.floor(updateAge / 24)} days ago`,
            status: job.status,
            amount: job.revenue ? `${job.revenue.toLocaleString()} CZK` : undefined,
            entityId: job.id,
            entityType: 'job'
          });
        }
      });

      // Add client activities
      clients?.forEach(client => {
        const clientDate = new Date(client.created_at);
        const clientAge = Math.floor((now.getTime() - clientDate.getTime()) / (1000 * 60 * 60));
        recentActivities.push({
          id: `client-${client.id}`,
          type: 'new_client',
          title: 'Nový klient',
          description: `${client.name} - byl přidán do systému`,
          time: clientAge < 1 ? 'moments ago' : clientAge < 24 ? `${clientAge}h ago` : `${Math.floor(clientAge / 24)} days ago`,
          status: 'new',
          entityId: client.id,
          entityType: 'client'
        });
      });

      setActivities(recentActivities);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.entityType === 'job') {
      navigate(`/jobs?highlight=${activity.entityId}`);
    } else if (activity.entityType === 'client') {
      navigate(`/clients?highlight=${activity.entityId}`);
    }
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (loading) {
    return (
      <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl animate-pulse">
        <CardHeader>
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[2.5rem] border-0 shadow-xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
            <Clock className="h-5 w-5" />
          </div>
          Nedávná Aktivita
        </CardTitle>
        {activities.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/5 text-primary"
          >
            {showAll ? 'Zobrazit méně' : 'Zobrazit vše'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px]">Žádná aktivita za poslední 3 dny</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getStatusColor(activity.status);

              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-white/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black shadow-lg group-hover:scale-110 transition-transform shrink-0", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                        {getCzechTypeTitle(activity.type, activity.title)}
                      </h4>
                      {activity.amount && (
                        <span className="text-xs font-black text-primary shrink-0">
                          {activity.amount}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground font-medium truncate mb-2">
                      {activity.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                        {getCzechTime(activity.time)}
                      </span>
                      <Badge className={cn("rounded-lg px-2 py-0 h-5 text-[9px] font-black uppercase tracking-tighter border-0", colorClass)}>
                        {getCzechStatus(activity.status)}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}