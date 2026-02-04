import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { supabase } from '@/integrations/supabase/client';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export const ClientProtectedRoute: React.FC<ClientProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [isAppClient, setIsAppClient] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Allow admin stepan.tomov5@seznam.cz to access client routes
  const isAdminUsingClientPages = user?.email === 'stepan.tomov5@seznam.cz';

  useEffect(() => {
    const checkClientSource = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (isAdminUsingClientPages) {
        setIsAppClient(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('client_source, onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        // Only allow access if client_source is explicitly 'App' AND onboarding is completed
        const clientData = data as any;
        setIsAppClient(clientData?.client_source === 'App' && clientData?.onboarding_completed === true);
      } catch (error) {
        console.error('Error checking client source:', error);
        setIsAppClient(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkClientSource();
    }
  }, [user, authLoading, isAdminUsingClientPages]);

  // Prevent clients from accessing non-client routes (unless they're the admin)
  useEffect(() => {
    if (!authLoading && user && !location.pathname.startsWith('/klient') && !isAdminUsingClientPages) {
      const restrictedPaths = ['/finances', '/protocols', '/team', '/clients', '/jobs', '/invoices', '/admin'];
      const isRestrictedPath = restrictedPaths.some(path => location.pathname.startsWith(path));

      if (isRestrictedPath) {
        navigate('/klient', { replace: true });
      }
    }
  }, [location.pathname, user, authLoading, navigate, isAdminUsingClientPages]);

  if (authLoading || (loading && user)) {
    return <LoadingOverlay message="Ověřuji přístup..." />;
  }

  if (!user) {
    return <Navigate to="/klient-prihlaseni" replace />;
  }

  if (isAppClient === false && !isAdminUsingClientPages) {
    // If not an App client and not an admin, they shouldn't be in the client portal
    return <Navigate to="/klient-prihlaseni" replace />;
  }

  return <>{children}</>;
};
