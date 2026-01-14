import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import Protocols from "./pages/admin/Protocols";
import Finances from "./pages/admin/Finances";
import InvoiceGenerator from "./pages/admin/InvoiceGenerator";
import InvoiceStorage from "./pages/admin/InvoiceStorage";
import InvoiceDefaultInfo from "./pages/admin/InvoiceDefaultInfo";
import ClientAuth from "./pages/client/ClientAuth";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientServices from "./pages/client/ClientServices";
import ClientProfile from "./pages/client/ClientProfile";
import ClientBilling from "./pages/client/ClientBilling";
import ClientLoyalty from "./pages/client/ClientLoyalty";
import ClientChecklistManager from "./pages/client/ClientChecklistManager";
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
import { Layout } from "./components/layout/Layout";
import NotFound from "./pages/admin/NotFound";
import { ScrollToTop } from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" duration={2000} />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Client Portal Routes */}
            <Route path="/klient-prihlaseni" element={<ClientAuth />} />
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
                <Layout>
                  <AppBookings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/checklists" element={
              <ProtectedRoute>
                <Layout>
                  <AdminChecklistManager />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/app-registers" element={
              <ProtectedRoute>
                <Layout>
                  <AppRegisters />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
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
            <Route path="/protocols" element={
              <ProtectedRoute>
                <Protocols />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
