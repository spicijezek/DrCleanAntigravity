import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { LoadingOverlay } from '@/components/LoadingOverlay';

interface CleanerProtectedRouteProps {
  children: React.ReactNode;
}

export const CleanerProtectedRoute: React.FC<CleanerProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isCleaner, setIsCleaner] = useState<boolean | null>(null);

  useEffect(() => {
    const checkCleanerRole = async () => {
      if (!user) {
        setIsCleaner(false);
        return;
      }

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      setIsCleaner(roles?.some(r => r.role === 'cleaner') || false);
    };

    checkCleanerRole();
  }, [user]);

  if (loading || isCleaner === null) {
    return <LoadingOverlay />;
  }

  if (!user || !isCleaner) {
    return <Navigate to="/cleaner/auth" replace />;
  }

  return <>{children}</>;
};
