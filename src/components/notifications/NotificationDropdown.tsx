import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Calendar, User, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notification {
  id: string;
  type: 'scheduled_job' | 'overdue_job' | 'payment_due';
  title: string;
  description: string;
  date: string;
  urgent?: boolean;
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      
      // Fetch scheduled jobs for today and tomorrow
      const { data: scheduledJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, scheduled_date, status, client_id, clients(name)')
        .eq('user_id', user?.id)
        .in('status', ['scheduled', 'in_progress'])
        .lte('scheduled_date', tomorrow.toISOString())
        .order('scheduled_date', { ascending: true });

      if (jobsError) throw jobsError;

      // Fetch overdue jobs (past scheduled date but not completed)
      const { data: overdueJobs, error: overdueError } = await supabase
        .from('jobs')
        .select('id, title, scheduled_date, status, client_id, clients(name)')
        .eq('user_id', user?.id)
        .eq('status', 'scheduled')
        .lt('scheduled_date', now.toISOString());

      if (overdueError) throw overdueError;

      // Fetch jobs with payment due (completed but not paid)
      const { data: paymentDue, error: paymentError } = await supabase
        .from('jobs')
        .select('id, title, completed_date, status, revenue, client_id, clients(name)')
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (paymentError) throw paymentError;

      const newNotifications: Notification[] = [];

      // Add scheduled job notifications
      scheduledJobs?.forEach(job => {
        const isToday = new Date(job.scheduled_date).toDateString() === now.toDateString();
        newNotifications.push({
          id: `scheduled_${job.id}`,
          type: 'scheduled_job',
          title: isToday ? 'Job Today' : 'Upcoming Job',
          description: `${job.title} - ${job.clients?.name}`,
          date: job.scheduled_date,
          urgent: isToday
        });
      });

      // Add overdue job notifications
      overdueJobs?.forEach(job => {
        newNotifications.push({
          id: `overdue_${job.id}`,
          type: 'overdue_job',
          title: 'Overdue Job',
          description: `${job.title} - ${job.clients?.name}`,
          date: job.scheduled_date,
          urgent: true
        });
      });

      // Add payment due notifications
      paymentDue?.forEach(job => {
        const daysSinceCompleted = Math.floor(
          (now.getTime() - new Date(job.completed_date!).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCompleted >= 7) { // Show if payment is overdue by a week
          newNotifications.push({
            id: `payment_${job.id}`,
            type: 'payment_due',
            title: 'Payment Overdue',
            description: `${job.title} - $${job.revenue} from ${job.clients?.name}`,
            date: job.completed_date!,
            urgent: daysSinceCompleted >= 14
          });
        }
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'scheduled_job':
        return <Calendar className="h-4 w-4" />;
      case 'overdue_job':
        return <AlertCircle className="h-4 w-4" />;
      case 'payment_due':
        return <User className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatNotificationDate = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const isToday = notificationDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return notificationDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return notificationDate.toLocaleDateString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No new notifications
          </div>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <DropdownMenuItem 
              key={notification.id} 
              className={`flex items-start gap-3 p-3 ${notification.urgent ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
            >
              <div className={`mt-1 ${notification.urgent ? 'text-red-500' : 'text-muted-foreground'}`}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{notification.title}</p>
                  {notification.urgent && (
                    <Badge variant="destructive" className="text-xs">Urgent</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatNotificationDate(notification.date)}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 10 && (
          <DropdownMenuItem className="text-center text-muted-foreground">
            +{notifications.length - 10} more notifications
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}