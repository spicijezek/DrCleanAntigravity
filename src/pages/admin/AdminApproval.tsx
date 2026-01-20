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
import { Check, X, Clock, Users, Mail, Calendar, Info, ShieldCheck, Search, LayoutGrid, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string[] }>({});
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('id, user_id, full_name, email, created_at, approval_status, avatar_url');

      // Filter by status if not 'all' (though standard UI only shows pending/approved/rejected pills)
      if (statusFilter !== 'all') {
        query = query.eq('approval_status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers((data || []) as PendingUser[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

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
      // Update local state
      setUsers(prev => prev.map(u =>
        u.user_id === userId ? { ...u, approval_status: status } : u
      ).filter(u => u.approval_status === statusFilter));

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

  const sortedUsers = users
    .filter(u => {
      const search = searchTerm.toLowerCase();
      return u.full_name?.toLowerCase().includes(search) || u.email?.toLowerCase().includes(search);
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'alphabetical') return (a.full_name || '').localeCompare(b.full_name || '');
      return 0;
    });

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

        {/* Glassmorphic Filter Bar */}
        <div className="flex flex-col xl:flex-row gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-3 sm:p-4 rounded-[2.5rem] border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">

          {/* Top Row: Search & Sort (Left) */}
          <div className="flex flex-col sm:flex-row gap-3 xl:w-auto w-full">
            <div className="relative group flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 transition-colors group-focus-within:text-blue-500" />
              <input
                type="text"
                placeholder="Find users..."
                className="pl-12 pr-4 h-12 bg-white/50 dark:bg-slate-800/50 border-0 shadow-sm rounded-full focus:ring-2 focus:ring-blue-500/20 transition-all w-full text-base outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-1.5 rounded-full border border-white/10 shadow-sm sm:w-auto w-full">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0 p-2 h-auto text-sm font-medium min-w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="alphabetical">Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bottom Row: Status Pills (Right) */}
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <ToggleGroup type="single" value={statusFilter} onValueChange={(val) => val && setStatusFilter(val)} className="justify-start xl:justify-end w-full gap-2">
              <ToggleGroupItem value="pending" className="rounded-full px-4 h-11 data-[state=on]:bg-orange-500 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <Clock className="h-4 w-4" /> Pending
              </ToggleGroupItem>
              <ToggleGroupItem value="approved" className="rounded-full px-4 h-11 data-[state=on]:bg-emerald-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <CheckCircle2 className="h-4 w-4" /> Approved
              </ToggleGroupItem>
              <ToggleGroupItem value="rejected" className="rounded-full px-4 h-11 data-[state=on]:bg-red-600 data-[state=on]:text-white data-[state=on]:shadow-lg shadow-sm border border-slate-200 bg-white/50 hover:bg-white/80 transition-all gap-2 min-w-fit">
                <XCircle className="h-4 w-4" /> Rejected
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {sortedUsers.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden p-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-emerald-100/50 dark:bg-emerald-950/20 p-4 rounded-full">
                <ShieldCheck className="h-12 w-12 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">No users found</h3>
                <p className="text-muted-foreground text-sm">There are no {statusFilter} users matching your search.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sortedUsers.map((user) => (
              <Card key={user.id} className={cn(
                "bg-card/50 backdrop-blur-sm border-0 shadow-lg rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4",
                user.approval_status === 'pending' ? 'border-l-orange-500' :
                  user.approval_status === 'approved' ? 'border-l-emerald-500' : 'border-l-red-500'
              )}>
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
                    <Badge className={cn(
                      "border-0 font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm",
                      user.approval_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        user.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    )}>
                      {user.approval_status === 'pending' && <Clock className="h-4 w-4" />}
                      {user.approval_status === 'approved' && <CheckCircle2 className="h-4 w-4" />}
                      {user.approval_status === 'rejected' && <XCircle className="h-4 w-4" />}
                      {user.approval_status.charAt(0).toUpperCase() + user.approval_status.slice(1)}
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

                  {/* Actions only for pending users */}
                  {user.approval_status === 'pending' && (
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
                  )}
                  {user.approval_status !== 'pending' && (
                    <div className="pt-2 text-sm text-muted-foreground italic flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      This user has already been {user.approval_status}.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}