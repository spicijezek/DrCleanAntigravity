import { useState, useEffect } from "react"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardActions } from "@/components/dashboard/DashboardActions"
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
          description={`Welcome back, ${userName || 'Admin'}. Here's what's happening today.`}
          variant="luxurious"
          action={
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNumbersBlurred(!numbersBlurred)}
                className="flex-shrink-0 bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all rounded-xl"
              >
                {numbersBlurred ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="hidden sm:flex bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 transition-all rounded-xl"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => window.location.href = '/jobs'}
                className="flex-shrink-0 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Job
              </Button>
            </div>
          }
        />

        <div className="space-y-8 mt-4">
          <DashboardStats blurNumbers={numbersBlurred} />

          <DashboardActions />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
