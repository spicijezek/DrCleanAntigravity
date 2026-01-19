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
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000 leading-normal">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground/90 leading-none">Dashboard</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/60" />
              Vítejte zpět, {userName || 'Administrátore'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNumbersBlurred(!numbersBlurred)}
              className="rounded-[1.25rem] h-12 w-12 p-0 shadow-sm transition-all hover:scale-105 active:scale-95 border-primary/20 text-primary hover:bg-primary/5"
            >
              {numbersBlurred ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Premium Shortcut Bar */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000 flex flex-wrap gap-3">
          <Button
            onClick={() => window.location.href = '/jobs'}
            className="rounded-2xl h-14 px-6 font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nová Zakázka
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/clients'}
            className="rounded-2xl h-14 px-6 font-black border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200"
          >
            <Plus className="h-5 w-5 mr-2 text-indigo-500" />
            Přidat Klienta
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/jobs'}
            className="rounded-2xl h-14 px-6 font-black border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200"
          >
            <Calendar className="h-5 w-5 mr-2 text-blue-500" />
            Plánování Týdne
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/finances'}
            className="rounded-2xl h-14 px-6 font-black border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200"
          >
            <Download className="h-5 w-5 mr-2 text-emerald-500" />
            Finanční Přehled
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="rounded-2xl h-14 px-6 font-black border-0 bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 text-slate-700 dark:text-slate-200"
          >
            <Download className="h-5 w-5 mr-2 text-rose-500" />
            Export Dat
          </Button>
        </div>

        {/* Stats Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          <DashboardStats blurNumbers={numbersBlurred} />
        </div>

        {/* Activity Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <RecentActivity />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
