import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { Check, X, Clock, Users, Mail, Calendar, Info, ShieldCheck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { LoadingOverlay } from '@/components/LoadingOverlay';

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  avatar_url?: string;
}

export default function AdminApproval() {
  const { user, profile } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string[] }>({});
  const { toast } = useToast();

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, created_at, approval_status, avatar_url')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingUsers((data || []) as PendingUser[]);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: "Error",
        description: "Failed to load pending users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApproval = async (userId: string, status: 'approved' | 'rejected') => {
    setProcessingUser(userId);

    try {
      // Update profile approval status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          approval_status: status,
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          approval_notes: notes[userId] || null
        })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      // If approved, assign selected roles
      if (status === 'approved') {
        const rolesToAssign = selectedRoles[userId] || ['user'];

        // Insert roles for the user
        const roleInserts = rolesToAssign.map(role => ({
          user_id: userId,
          role: role as 'admin' | 'user' | 'invoice_user',
          created_by: user.id
        }));

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (rolesError) throw rolesError;
      }

      toast({
        title: "Success",
        description: `User ${status} successfully!`,
      });

      // Remove the user from the pending list
      setPendingUsers(prev => prev.filter(u => u.user_id !== userId));

      // Clear notes and roles for this user
      setNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[userId];
        return newNotes;
      });

      setSelectedRoles(prev => {
        const newRoles = { ...prev };
        delete newRoles[userId];
        return newRoles;
      });

    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setProcessingUser(null);
    }
  };

  const updateNotes = (userId: string, note: string) => {
    setNotes(prev => ({ ...prev, [userId]: note }));
  };

  const toggleRole = (userId: string, role: string) => {
    setSelectedRoles(prev => {
      const userRoles = prev[userId] || ['user'];
      if (userRoles.includes(role)) {
        const filtered = userRoles.filter(r => r !== role);
        return { ...prev, [userId]: filtered.length > 0 ? filtered : ['user'] };
      } else {
        return { ...prev, [userId]: [...userRoles, role] };
      }
    });
  };

  if (loading) {
    return <LoadingOverlay message="Načítám žádosti o schválení..." />;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 pb-24 space-y-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <AdminPageHeader
          title="User Approval"
          description="Review and manage pending user registrations"
        />

        {pendingUsers.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden p-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-emerald-100/50 dark:bg-emerald-950/20 p-4 rounded-full">
                <ShieldCheck className="h-12 w-12 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">All caught up!</h3>
                <p className="text-muted-foreground text-sm">No pending user approvals for DrClean.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {pendingUsers.map((user) => (
              <Card key={user.id} className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-orange-500">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-white/10 shadow-md">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} alt={user.full_name} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="space-y-0.5">
                        <CardTitle className="text-xl font-bold">{user.full_name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-primary font-medium">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 border-0 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                      <Clock className="h-4 w-4" />
                      Pending Approval
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-0">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-white/10">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span className="font-medium text-foreground">Registered:</span>
                      {new Date(user.created_at).toLocaleDateString('cs-CZ')}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Assign User Roles
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {['user', 'admin', 'invoice_user'].map((role) => {
                        const isSelected = selectedRoles[user.user_id]?.includes(role) || (!selectedRoles[user.user_id] && role === 'user');
                        return (
                          <Button
                            key={role}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleRole(user.user_id, role)}
                            className={cn(
                              "capitalize rounded-xl px-4 h-9 shadow-sm transition-all",
                              isSelected ? "bg-primary border-0" : "bg-white/40 hover:bg-white/60 border-primary/20"
                            )}
                          >
                            {role === 'invoice_user' ? 'Invoice User' : role}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      Select one or more roles. Default is 'user'.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${user.user_id}`} className="text-sm font-bold ml-1">Decision Notes (Optional)</Label>
                    <Textarea
                      id={`notes-${user.user_id}`}
                      placeholder="Add any internal notes about this user or approval decision..."
                      value={notes[user.user_id] || ''}
                      onChange={(e) => updateNotes(user.user_id, e.target.value)}
                      className="bg-white/40 backdrop-blur-sm border-0 shadow-inner rounded-2xl min-h-[80px] focus-visible:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      onClick={() => handleApproval(user.user_id, 'approved')}
                      disabled={processingUser === user.user_id}
                      className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg border-0 transition-all"
                    >
                      <Check className="h-5 w-5 mr-2" />
                      Approve Registraton
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleApproval(user.user_id, 'rejected')}
                      disabled={processingUser === user.user_id}
                      className="flex-1 h-12 rounded-2xl hover:bg-red-50 hover:text-red-600 text-muted-foreground font-semibold transition-all"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Reject User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}