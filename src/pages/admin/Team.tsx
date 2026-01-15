import { useState, useEffect } from 'react';
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
          title="Team"
          description="Manage your team members and employees"
          action={
            <Button
              onClick={() => setShowAddForm(true)}
              variant="gradient"
              className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          }
        />

        <div className="space-y-6">
          <div className="bg-card/50 backdrop-blur-sm p-6 rounded-3xl border-0 shadow-lg space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search team members..."
                className="pl-10 bg-background/50 border-0 shadow-sm focus:ring-2 focus:ring-primary/20 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Team Members Grid */}
          {filteredTeamMembers.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 text-muted-foreground mb-4">
                  <Calendar className="h-full w-full" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
                <p className="text-muted-foreground mb-6">Start by adding your first team member.</p>
                <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTeamMembers.map((member) => (
                <Card key={member.id} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.is_active ? "default" : "secondary"}>
                          {member.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteTeamMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {member.position && (
                      <p className="text-sm text-muted-foreground">{member.position}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 min-h-[72px]">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{member.email || 'No email provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{member.phone || 'No phone provided'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{member.address || 'No address provided'}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hourly Rate:</span>
                        <span className="font-medium">{member.hourly_rate ? `${member.hourly_rate} CZK` : 'Not set'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Earned:</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                          {member.calculated_total_earnings.toLocaleString()} CZK
                        </Badge>
                      </div>
                      {member.hire_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Hired:</span>
                          <span className="font-medium">{new Date(member.hire_date).toLocaleDateString()}</span>
                        </div>
                      )}
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