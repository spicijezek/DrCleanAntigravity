import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.approval_status === 'pending') {
    return <Navigate to="/pending-approval" replace />;
  }

  if (profile?.approval_status === 'rejected') {
    return <Navigate to="/auth" replace />;
  }

  // Allow main admin full access
  const isMainAdmin = user?.email === 'stepan.tomov5@seznam.cz';
  
  // Check if user has internal access roles (admin, user, invoice_user)
  const hasInternalAccess = isMainAdmin || profile?.roles?.some(role => 
    ['admin', 'user', 'invoice_user'].includes(role)
  );
  
  // If user only has client/cleaner role, redirect to client app
  if (!hasInternalAccess) {
    return <Navigate to="/klient" replace />;
  }

  // Restrict invoice_user role to only invoice pages
  const isInvoiceUser = profile?.roles?.includes('invoice_user') && !profile?.roles?.includes('admin') && !profile?.roles?.includes('user');
  const isInvoicePage = location.pathname.startsWith('/invoices/');
  
  if (isInvoiceUser && !isInvoicePage) {
    return <Navigate to="/invoices/generator" replace />;
  }

  return <>{children}</>;
};