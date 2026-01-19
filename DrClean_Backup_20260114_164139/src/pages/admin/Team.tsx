import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Calendar, Users, Briefcase, Wallet, History, UserX } from 'lucide-react';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddTeamMemberForm } from '@/components/forms/AddTeamMemberForm';
import { EditTeamMemberForm } from '@/components/forms/EditTeamMemberForm';
import { Layout } from '@/components/layout/Layout';
import { useMobileResponsive } from '@/components/ui/mobile-responsive';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  address: string;
  hourly_rate: number;
  hire_date: string;
  is_active: boolean;
  total_earnings: number;
  calculated_total_earnings: number;
}

export default function Team() {
  useMobileResponsive();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

  const fetchTeamMembers = async () => {
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamError) throw teamError;

      // Fetch all PAID jobs with their team member assignments
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id, team_member_ids, status, payment_received_date')
        .eq('status', 'paid')
        .not('payment_received_date', 'is', null);

      if (jobsError) throw jobsError;

      const paidJobIds = (jobsData || []).map(j => j.id);

      // Fetch job expenses for PAID jobs only
      const { data: expensesData, error: expensesError } = await supabase
        .from('job_expenses')
        .select('job_id, team_member_id, cleaner_expense')
        .in('job_id', paidJobIds);

      if (expensesError) throw expensesError;

      // Calculate total earnings for each team member from PAID jobs only
      const earningsByMember: Record<string, number> = {};

      (teamData || []).forEach(member => {
        const memberExpenses = (expensesData || []).filter(e => e.team_member_id === member.id);
        const totalEarnings = memberExpenses.reduce((sum, e) => sum + Number(e.cleaner_expense || 0), 0);
        earningsByMember[member.id] = totalEarnings;
      });

      // Combine team data with calculated earnings
      const membersWithEarnings = teamData?.map(member => ({
        ...member,
        calculated_total_earnings: earningsByMember[member.id] || 0
      })) || [];

      setTeamMembers(membersWithEarnings);
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se načíst členy týmu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTeamMembers = teamMembers
    .filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.calculated_total_earnings - a.calculated_total_earnings);

  const handleDeleteTeamMember = async (memberId: string) => {
    if (!confirm('Opravdu chcete smazat tohoto člena týmu?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Úspěch',
        description: 'Člen týmu byl úspěšně smazán',
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Chyba',
        description: 'Nepodařilo se smazat člena týmu',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground/90">Tým</h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary/60" />
              Správa zaměstnanců a spolupracovníků
            </p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="rounded-[1.25rem] h-12 px-8 font-black shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-white"
          >
            <Plus className="h-5 w-5 mr-2" />
            Přidat člena
          </Button>
        </div>

        {/* Global Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-[2rem] border-0 shadow-lg bg-indigo-500/5 border-l-4 border-l-indigo-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-900/40 leading-none">Celkem členů</p>
                <p className="text-2xl font-black text-indigo-600 tabular-nums">
                  {teamMembers.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-emerald-500/5 border-l-4 border-l-emerald-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <Briefcase className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-900/40 leading-none">Aktivní</p>
                <p className="text-2xl font-black text-emerald-600 tabular-nums">
                  {teamMembers.filter(m => m.is_active).length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-amber-500/5 border-l-4 border-l-amber-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Wallet className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-900/40 leading-none">Vyplaceno celkem</p>
                <p className="text-2xl font-black text-amber-600 tabular-nums">
                  {teamMembers.reduce((sum, m) => sum + (m.calculated_total_earnings || 0), 0).toLocaleString('cs-CZ')} Kč
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 shadow-lg bg-blue-500/5 border-l-4 border-l-blue-500">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                <History className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-900/40 leading-none">Čekající úkoly</p>
                <p className="text-2xl font-black text-blue-600 tabular-nums">
                  -
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Panel */}
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Hledat jméno, email nebo pozici..."
              className="pl-12 h-14 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all w-full text-base font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeamMembers.map((member) => (
            <Card key={member.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white dark:bg-slate-900/80 backdrop-blur-sm">
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2.5 z-10 transition-all duration-500",
                member.is_active ? "bg-amber-400" : "bg-slate-300"
              )} />

              <CardContent className="p-7 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={cn(
                        "rounded-full px-2 py-0 text-[10px] font-black uppercase tracking-tighter border-0",
                        member.is_active ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
                      )}>
                        {member.is_active ? "Aktivní" : "Neaktivní"}
                      </Badge>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">
                        {member.position || 'Člen týmu'}
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-foreground/90 leading-tight truncate">
                      {member.name}
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMember(member)}
                      className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-white hover:text-primary transition-all hover:scale-110 shadow-sm shrink-0"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTeamMember(member.id)}
                      className="h-10 w-10 rounded-2xl bg-red-50 hover:bg-red-100/50 text-red-500 transition-all hover:scale-110 shadow-sm shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                        {member.email || 'Email neuveden'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {member.phone || 'Telefon neuveden'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate">
                        {member.address || 'Adresa neuvedena'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-900/40 mb-1 leading-none">Celkem vyplaceno</span>
                      <p className="text-sm font-black text-amber-600 leading-none">
                        {member.calculated_total_earnings.toLocaleString()} Kč
                      </p>
                    </div>
                    <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1 leading-none">Hodinová sazba</span>
                      <p className="text-sm font-black text-primary leading-none">
                        {member.hourly_rate ? `${member.hourly_rate} Kč` : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Calendar className="h-3.5 w-3.5" />
                    Přidán: {member.hire_date ? new Date(member.hire_date).toLocaleDateString('cs-CZ') : '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeamMembers.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] border border-white/20 shadow-xl animate-in fade-in zoom-in duration-700">
            <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
              <UserX className="h-12 w-12" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Žádní členové týmu</h3>
            <p className="text-muted-foreground font-medium mb-8 text-center max-w-sm">
              {searchTerm ? 'Zkuste upravit vyhledávací termíny.' : 'Začněte přidáním svého prvního člena týmu.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowAddForm(true)} className="rounded-2xl h-14 px-10 font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95">
                <Plus className="h-6 w-6 mr-2" />
                Přidat člena týmu
              </Button>
            )}
          </div>
        )}

        {/* Form Modals */}
        {showAddForm && (
          <AddTeamMemberForm
            onClose={() => setShowAddForm(false)}
            onMemberAdded={() => {
              fetchTeamMembers();
              setShowAddForm(false);
            }}
          />
        )}

        {editingMember && (
          <EditTeamMemberForm
            member={editingMember}
            onClose={() => setEditingMember(null)}
            onMemberUpdated={() => {
              fetchTeamMembers();
              setEditingMember(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
}