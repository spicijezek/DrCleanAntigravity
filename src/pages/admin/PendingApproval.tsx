import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

export default function PendingApproval() {
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Avatar className="mx-auto mb-4 h-16 w-16">
            {profile?.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt="Profile" />
            ) : (
              <AvatarFallback className="bg-gradient-primary text-white">
                <span className="font-bold text-lg">Dr</span>
              </AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Account Pending Approval
          </CardTitle>
          <CardDescription>Your account is currently under review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Thank you for registering with Dr.Clean! Your account has been created successfully 
              and is currently awaiting approval from an administrator.
            </p>
            <p className="text-muted-foreground">
              You will receive an email notification once your account has been approved and you 
              can start using the cleaning management system.
            </p>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">What happens next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• An administrator will review your account</li>
              <li>• You'll receive an email once approved</li>
              <li>• You can then sign in and access all features</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}