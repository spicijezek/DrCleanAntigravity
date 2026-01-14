import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

export const ClientProtectedRoute: React.FC<ClientProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Allow admin stepan.tomov5@seznam.cz to access client routes
  const isAdminUsingClientPages = user?.email === 'stepan.tomov5@seznam.cz';

  // Prevent clients from accessing non-client routes (unless they're the admin)
  useEffect(() => {
    if (!loading && user && !location.pathname.startsWith('/klient') && !isAdminUsingClientPages) {
      const restrictedPaths = ['/finances', '/protocols', '/team', '/clients', '/jobs', '/invoices', '/admin'];
      const isRestrictedPath = restrictedPaths.some(path => location.pathname.startsWith(path));
      
      if (isRestrictedPath) {
        navigate('/klient', { replace: true });
      }
    }
  }, [location.pathname, user, loading, navigate, isAdminUsingClientPages]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/klient-prihlaseni" replace />;
  }

  return <>{children}</>;
};
