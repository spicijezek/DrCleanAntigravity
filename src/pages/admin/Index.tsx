import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Button } from "@/components/ui/button"
import { Plus, Download, Calendar, Eye, EyeOff } from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"

const Index = () => {
  const [numbersBlurred, setNumbersBlurred] = useState(true);
  const [userName, setUserName] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserName();
    }
  }, [user]);

  const fetchUserName = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user?.id)
        .single();
      
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }
    } catch (error) {
      console.error('Failed to fetch user name:', error);
    }
  };
  return (
    <Layout>
      <div className="p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                Welcome {userName || 'to your cleaning business management system'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setNumbersBlurred(!numbersBlurred)}
                className="flex-shrink-0"
              >
                {numbersBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.print()}
                className="hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/jobs'}
                className="hidden sm:flex"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Plan Week
              </Button>
              <Button 
                variant="gradient" 
                size="sm" 
                onClick={() => window.location.href = '/jobs'}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats blurNumbers={numbersBlurred} />
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
