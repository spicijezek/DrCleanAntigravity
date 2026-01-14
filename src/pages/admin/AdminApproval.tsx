import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';
import { Check, X, Clock, Users, Mail, Calendar } from 'lucide-react';
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="h-8 w-8" />
          User Approval Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and approve pending user registrations
        </p>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">All caught up!</h3>
              <p className="text-muted-foreground">No pending user approvals at this time.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.id} className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.full_name} />
                      ) : (
                        <AvatarFallback>
                          {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.full_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Registered: {new Date(user.created_at).toLocaleDateString()}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`roles-${user.user_id}`}>Assign Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {['user', 'admin', 'invoice_user'].map((role) => (
                      <Button
                        key={role}
                        type="button"
                        variant={selectedRoles[user.user_id]?.includes(role) || (!selectedRoles[user.user_id] && role === 'user') ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleRole(user.user_id, role)}
                        className="capitalize"
                      >
                        {role === 'invoice_user' ? 'Invoice User' : role}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select one or more roles. Default is 'user'.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`notes-${user.user_id}`}>Approval Notes (Optional)</Label>
                  <Textarea
                    id={`notes-${user.user_id}`}
                    placeholder="Add any notes about this approval decision..."
                    value={notes[user.user_id] || ''}
                    onChange={(e) => updateNotes(user.user_id, e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApproval(user.user_id, 'approved')}
                    disabled={processingUser === user.user_id}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve User
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleApproval(user.user_id, 'rejected')}
                    disabled={processingUser === user.user_id}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
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