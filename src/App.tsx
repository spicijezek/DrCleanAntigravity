import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClientProtectedRoute } from "@/components/ClientProtectedRoute";
import { CleanerProtectedRoute } from "@/components/CleanerProtectedRoute";
import Index from "./pages/admin/Index";
import Auth from "./pages/admin/Auth";
import PendingApproval from "./pages/admin/PendingApproval";
import AdminApproval from "./pages/admin/AdminApproval";
import Clients from "./pages/admin/Clients";
import Jobs from "./pages/admin/Jobs";
import Team from "./pages/admin/Team";
import { LoadingOverlay } from "@/components/LoadingOverlay";

import Finances from "./pages/admin/Finances";
import InvoiceGenerator from "./pages/admin/InvoiceGenerator";
import InvoiceStorage from "./pages/admin/InvoiceStorage";
import InvoiceDefaultInfo from "./pages/admin/InvoiceDefaultInfo";
import ClientAuth from "./pages/client/ClientAuth";
import MobileAppInfo from "./pages/client/MobileAppInfo";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientServices from "./pages/client/ClientServices";
import ClientProfile from "./pages/client/ClientProfile";
import ClientBilling from "./pages/client/ClientBilling";
import ClientLoyalty from "./pages/client/ClientLoyalty";
import ClientChecklistManager from "./pages/client/ClientChecklistManager";
import ClientFAQ from "./pages/client/ClientFAQ";
import BookingConfirmation from "./pages/client/BookingConfirmation";
import { ClientLayout } from "./components/client/ClientLayout";
import CleanerAuth from "./pages/cleaner/CleanerAuth";
import CleanerDashboard from "./pages/cleaner/CleanerDashboard";
import CleanerProfile from "./pages/cleaner/CleanerProfile";
import { CleanerLayout } from "./components/cleaner/CleanerLayout";
import CleanerHistory from "./pages/cleaner/CleanerHistory";
import ManageEducationalContent from "./pages/admin/ManageEducationalContent";
import ManageExtraServices from "./pages/admin/ManageExtraServices";
import AppBookings from "./pages/admin/AppBookings";
import AppRegisters from "./pages/admin/AppRegisters";
import AdminChecklistManager from "./pages/admin/AdminChecklistManager";
import AdminLoyalty from "./pages/admin/Loyalty";
import { Layout } from "./components/layout/Layout";
import NotFound from "./pages/admin/NotFound";
import { ScrollToTop } from "@/components/ScrollToTop";
import LandingPage from "./pages/LandingPage";
import PublicBooking from "./pages/PublicBooking";
import VOP from "./pages/VOP";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiesPage from "./pages/Cookies";

import CookieConsent from "./components/CookieConsent";

const DomainRedirect = () => {
  const { pathname, search } = useLocation();
  const hostname = window.location.hostname;

  useEffect(() => {
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    const searchParams = new URLSearchParams(search);
    const testDomain = searchParams.get('test_domain');

    // Only apply logic on production domains or if manually testing on localhost
    if (isLocalhost && !testDomain) return;

    // Use the test domain if provided and on localhost, otherwise real hostname
    const effectiveHostname = (isLocalhost && testDomain) ? testDomain : hostname;

    const landingPaths = ['/', '/landing', '/rezervace', '/vop', '/zasady-ochrany-osobnich-udaju', '/cookies'];
    const isLandingPath = landingPaths.includes(pathname) || pathname.startsWith('/rezervace-');

    // Determine the target domains
    const isLandingDomain = effectiveHostname === 'klinr.cz' || effectiveHostname === 'www.klinr.cz';
    const isAppDomain = effectiveHostname === 'app.klinr.cz';
    const isVercelPreview = effectiveHostname.endsWith('.vercel.app') && !effectiveHostname.includes('klinr.cz');

    const handleRedirect = (url: string) => {
      if (isLocalhost) {
        toast.info(`[Testing] Would redirect to: ${url}`);
        console.log(`[DomainRedirect] Would redirect to: ${url}`);
      } else {
        window.location.href = url;
      }
    };

    if (isLandingDomain) {
      // If on landing domain but accessing app route
      if (!isLandingPath) {
        handleRedirect(`https://app.klinr.cz${pathname}${search}`);
      } else if (pathname === '/landing') {
        handleRedirect(`https://klinr.cz/${search}`);
      }
    } else if (isAppDomain) {
      // If on app domain but accessing landing route
      if (isLandingPath && pathname !== '/') {
        const targetPath = pathname === '/landing' ? '/' : pathname;
        handleRedirect(`https://klinr.cz${targetPath}${search}`);
      }
    } else if (isVercelPreview) {
      // OPTIONAL: On Vercel preview, we allow both app and landing without redirects
      // This enables full testing of changes on preview deployments
    }
  }, [pathname, search, hostname]);

  return null;
};

const HomeRoute = () => {
  const { search } = useLocation();
  const { user, loading } = useAuth();
  const hostname = window.location.hostname;
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // Check for test override
  const searchParams = new URLSearchParams(search);
  const testDomain = searchParams.get('test_domain');
  const effectiveHostname = (isLocalhost && testDomain) ? testDomain : hostname;

  if (loading) {
    return <LoadingOverlay />;
  }

  // Explicitly check for app domain
  if (effectiveHostname === 'app.klinr.cz') {
    return (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    );
  }

  // Explicitly check for landing domain
  if (effectiveHostname === 'klinr.cz' || effectiveHostname === 'www.klinr.cz') {
    return <LandingPage />;
  }

  // Fallback for Vercel Preview / Localhost / Other
  // If logged in, show Dashboard (Index) for convenience
  if (user) {
    return (
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    );
  }

  // Default to Landing Page otherwise
  return <LandingPage />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" duration={4000} />
        <BrowserRouter>
          <DomainRedirect />
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Public Landing Page & Booking Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/rezervace" element={<PublicBooking />} />
            <Route path="/rezervace-uklid" element={<PublicBooking soloService="cleaning" />} />
            <Route path="/rezervace-mytioken" element={<PublicBooking soloService="window_cleaning" />} />
            <Route path="/rezervace-cistenicalouneni" element={<PublicBooking soloService="upholstery_cleaning" />} />
            <Route path="/rezervace-potvrzeni" element={<BookingConfirmation />} />
            <Route path="/vop" element={<VOP />} />
            <Route path="/zasady-ochrany-osobnich-udaju" element={<PrivacyPolicy />} />
            <Route path="/cookies" element={<CookiesPage />} />

            {/* Client Portal Routes */}
            <Route path="/klient-prihlaseni" element={<ClientAuth />} />
            <Route path="/klient/aplikace" element={<MobileAppInfo />} />
            <Route path="/klient" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientDashboard />
                </ClientLayout>
              </ClientProtectedRoute>
            } />
            <Route path="/klient/sluzby" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientServices />
                </ClientLayout>
              </ClientProtectedRoute>
            } />
            <Route path="/klient/profil" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientProfile />
                </ClientLayout>
              </ClientProtectedRoute>
            } />
            <Route path="/klient/fakturace" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientBilling />
                </ClientLayout>
              </ClientProtectedRoute>
            } />
            <Route path="/klient/vernost" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientLoyalty />
                </ClientLayout>
              </ClientProtectedRoute>
            } />
            <Route path="/klient/checklist" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientChecklistManager />
                </ClientLayout>
              </ClientProtectedRoute>
            } />
            <Route path="/klient/faq" element={
              <ClientProtectedRoute>
                <ClientLayout>
                  <ClientFAQ />
                </ClientLayout>
              </ClientProtectedRoute>
            } />

            {/* Cleaner Portal Routes */}
            <Route path="/cleaner/auth" element={<CleanerAuth />} />
            <Route path="/cleaner/dashboard" element={
              <CleanerProtectedRoute>
                <CleanerLayout>
                  <CleanerDashboard />
                </CleanerLayout>
              </CleanerProtectedRoute>
            } />
            <Route path="/cleaner/profile" element={
              <CleanerProtectedRoute>
                <CleanerLayout>
                  <CleanerProfile />
                </CleanerLayout>
              </CleanerProtectedRoute>
            } />
            <Route path="/cleaner/history" element={
              <CleanerProtectedRoute>
                <CleanerLayout>
                  <CleanerHistory />
                </CleanerLayout>
              </CleanerProtectedRoute>
            } />

            <Route path="/admin/approval" element={
              <ProtectedRoute>
                <AdminApproval />
              </ProtectedRoute>
            } />
            <Route path="/admin/educational-content" element={
              <ProtectedRoute>
                <ManageEducationalContent />
              </ProtectedRoute>
            } />
            <Route path="/admin/extra-services" element={
              <ProtectedRoute>
                <ManageExtraServices />
              </ProtectedRoute>
            } />
            <Route path="/admin/app-bookings" element={
              <ProtectedRoute>
                <AppBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/checklists" element={
              <ProtectedRoute>
                <AdminChecklistManager />
              </ProtectedRoute>
            } />
            <Route path="/admin/app-registers" element={
              <ProtectedRoute>
                <AppRegisters />
              </ProtectedRoute>
            } />
            <Route path="/admin/loyalty" element={
              <ProtectedRoute>
                <AdminLoyalty />
              </ProtectedRoute>
            } />
            <Route path="/" element={<HomeRoute />} />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="/team" element={
              <ProtectedRoute>
                <Team />
              </ProtectedRoute>
            } />

            <Route path="/finances" element={
              <ProtectedRoute>
                <Finances />
              </ProtectedRoute>
            } />
            <Route path="/invoices/generator" element={
              <ProtectedRoute>
                <InvoiceGenerator />
              </ProtectedRoute>
            } />
            <Route path="/invoices/storage" element={
              <ProtectedRoute>
                <InvoiceStorage />
              </ProtectedRoute>
            } />
            <Route path="/invoices/default-info" element={
              <ProtectedRoute>
                <InvoiceDefaultInfo />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
