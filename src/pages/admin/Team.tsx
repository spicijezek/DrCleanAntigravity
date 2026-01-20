import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AddTeamMemberForm } from '@/components/forms/AddTeamMemberForm';
import { EditTeamMemberForm } from '@/components/forms/EditTeamMemberForm';
import { Layout } from '@/components/layout/Layout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';

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
        title: 'Error',
        description: 'Failed to fetch team members',
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
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Team member deleted successfully',
      });

      fetchTeamMembers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete team member',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading team members..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="Tým"
          description="Správa členů týmu a zaměstnanců"
          action={
            <Button
              onClick={() => setShowAddForm(true)}
              variant="default"
              className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl h-11 px-6 font-bold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Přidat člena týmu
            </Button>
          }
        />

        <div className="space-y-6">
          <div className="bg-card border border-border p-6 rounded-xl shadow-soft space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Hledat členy týmu..."
                className="pl-12 h-12 bg-background border border-border rounded-xl focus-visible:ring-2 focus-visible:ring-primary/10 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Team Members Grid */}
          {filteredTeamMembers.length === 0 ? (
            <div className="text-center py-24 bg-card/30 backdrop-blur-xl rounded-xl border-2 border-dashed border-border max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-10 w-10 text-primary opacity-40" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Žádní členové týmu</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                Začněte přidáním prvního člena týmu do systému.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="rounded-xl h-12 px-8 font-semibold transition-all hover:shadow-medium">
                <Plus className="h-5 w-5 mr-2" />
                Přidat člena týmu
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeamMembers.map((member) => (
                <Card key={member.id} className="border border-border shadow-soft hover:shadow-medium transition-all duration-standard rounded-xl overflow-hidden group">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">{member.name}</CardTitle>
                        {member.position && (
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{member.position}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "rounded-lg px-2 py-0.5 text-[10px] uppercase font-bold border-0",
                          member.is_active ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
                        )}>
                          {member.is_active ? "Aktivní" : "Neaktivní"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-0 space-y-4">
                    <div className="space-y-3 bg-secondary/20 p-4 rounded-xl border border-border min-h-[120px]">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors text-xs">
                        <Mail className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate">{member.email || 'E-mail neuveden'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors text-xs">
                        <Phone className="h-3.5 w-3.5 text-primary/70" />
                        <span>{member.phone || 'Telefon neuveden'}</span>
                      </div>
                      <div className="flex items-start gap-3 text-sm text-muted-foreground font-medium group-hover:text-foreground transition-colors text-xs">
                        <MapPin className="h-3.5 w-3.5 text-primary/70 mt-0.5" />
                        <span className="leading-snug">{member.address || 'Adresa neuvedena'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold uppercase tracking-tight">Hodinová sazba:</span>
                        <span className="font-black text-foreground">{member.hourly_rate ? `${member.hourly_rate} CZK` : 'Neuvedena'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-bold uppercase tracking-tight">Celkem vyplaceno:</span>
                        <Badge variant="secondary" className="bg-success-light text-success border border-success-border rounded-md px-2 py-0.5 font-semibold">
                          {member.calculated_total_earnings.toLocaleString('cs-CZ')} CZK
                        </Badge>
                      </div>
                      {member.hire_date && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-bold uppercase tracking-tight">Datum nástupu:</span>
                          <span className="font-black text-foreground">{new Date(member.hire_date).toLocaleDateString('cs-CZ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingMember(member)}
                        className="flex-1 rounded-lg border border-border hover:bg-secondary hover:border-gray-300 transition-all font-semibold"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Upravit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="flex-1 rounded-lg hover:bg-destructive-light hover:text-destructive text-muted-foreground transition-all font-medium"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Smazat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add Team Member Form */}
          {showAddForm && (
            <AddTeamMemberForm
              onClose={() => setShowAddForm(false)}
              onMemberAdded={() => {
                fetchTeamMembers();
                setShowAddForm(false);
              }}
            />
          )}

          {/* Edit Team Member Form */}
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
      </div>
    </Layout>
  );
}