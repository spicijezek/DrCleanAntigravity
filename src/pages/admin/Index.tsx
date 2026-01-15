import { useState, useEffect } from "react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Button } from "@/components/ui/button"
import { Plus, Download, Calendar, Eye, EyeOff } from "lucide-react"
import { Layout } from "@/components/layout/Layout"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/integrations/supabase/client"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"

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
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Dashboard"
          description={`Welcome ${userName || 'to your cleaning business management system'}`}
          action={
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNumbersBlurred(!numbersBlurred)}
                className="flex-shrink-0 bg-card/50 backdrop-blur-sm border-0 shadow-sm hover:bg-card/80 transition-all rounded-xl"
              >
                {numbersBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="hidden sm:flex bg-card/50 backdrop-blur-sm border-0 shadow-sm hover:bg-card/80 transition-all rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/jobs'}
                className="hidden sm:flex bg-card/50 backdrop-blur-sm border-0 shadow-sm hover:bg-card/80 transition-all rounded-xl"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Plan Week
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => window.location.href = '/jobs'}
                className="flex-shrink-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          }
        />

        <div className="space-y-8 mt-4">
          <DashboardStats blurNumbers={numbersBlurred} />

          <div className="pt-2">
            <RecentActivity />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
