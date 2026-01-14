import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
      return "bg-success text-success-foreground"
    case "pending":
      return "bg-warning text-warning-foreground"
    case "paid":
      return "bg-primary text-primary-foreground"
    case "new":
      return "bg-accent text-accent-foreground"
    case "scheduled":
      return "bg-info text-info-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
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
        .limit(10); // Fetch more to show in "View All"

      // Fetch recent clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name, created_at')
        .gte('created_at', threeDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5); // Fetch more to show in "View All"

      const recentActivities: Activity[] = [];

      // Add job activities
      jobs?.forEach(job => {
        const clientName = job.clients?.name || 'Unknown client';
        
        // Job created activity
        const jobAge = Math.floor((now.getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60));
        recentActivities.push({
          id: `job-created-${job.id}`,
          type: 'job_created',
          title: 'New cleaning scheduled',
          description: `${job.title} - ${clientName}`,
          time: jobAge < 1 ? 'moments ago' : jobAge < 24 ? `${jobAge}h ago` : `${Math.floor(jobAge/24)} days ago`,
          status: job.status,
          amount: job.revenue ? `${job.revenue.toLocaleString()} CZK` : undefined,
          entityId: job.id,
          entityType: 'job'
        });

        // If job was completed/paid, add separate activity
        if (job.status === 'completed' || job.status === 'paid') {
          const updateAge = Math.floor((now.getTime() - new Date(job.updated_at).getTime()) / (1000 * 60 * 60));
          recentActivities.push({
            id: `job-completed-${job.id}`,
            type: job.status === 'paid' ? 'payment' : 'job_completed',
            title: job.status === 'paid' ? 'Payment received' : 'Cleaning completed',
            description: `${job.title} - ${clientName}`,
            time: updateAge < 1 ? 'moments ago' : updateAge < 24 ? `${updateAge}h ago` : `${Math.floor(updateAge/24)} days ago`,
            status: job.status,
            amount: job.revenue ? `${job.revenue.toLocaleString()} CZK` : undefined,
            entityId: job.id,
            entityType: 'job'
          });
        }
      });

      // Add client activities
      clients?.forEach(client => {
        const clientAge = Math.floor((now.getTime() - new Date(client.created_at).getTime()) / (1000 * 60 * 60));
        recentActivities.push({
          id: `client-${client.id}`,
          type: 'new_client',
          title: 'New client',
          description: `${client.name} - new client added`,
          time: clientAge < 1 ? 'moments ago' : clientAge < 24 ? `${clientAge}h ago` : `${Math.floor(clientAge/24)} days ago`,
          status: 'new',
          entityId: client.id,
          entityType: 'client'
        });
      });

      // Sort by most recent
      recentActivities.sort((a, b) => {
        const timeA = a.time.includes('moments') ? 0 : parseInt(a.time.match(/\d+/)?.[0] || '999');
        const timeB = b.time.includes('moments') ? 0 : parseInt(b.time.match(/\d+/)?.[0] || '999');
        return timeA - timeB;
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

  const displayedActivities = showAll ? activities : activities.slice(0, 3);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg border animate-pulse">
                <div className="rounded-full bg-muted h-8 w-8"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        {activities.length > 3 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'View Less' : 'View All'}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedActivities.map((activity) => {
              const Icon = getActivityIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="rounded-full bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {activity.amount && (
                          <span className="text-sm font-semibold text-primary">
                            {activity.amount}
                          </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}