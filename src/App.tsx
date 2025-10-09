
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/hooks/use-currency";
import { MonthProvider } from "@/hooks/use-month-context";
import { FamilyProvider } from "@/hooks/useFamilyContext";
import { FinnyProvider } from "@/components/finny/FinnyProvider";
import { OfflineProvider } from "@/components/offline/OfflineProvider";
import { AppOpenAd } from "@/components/ads/AppOpenAd";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Import pages
import Auth from "@/pages/Auth";
import Welcome from "@/pages/Welcome";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import AppGuide from "@/pages/AppGuide";
import Budget from "@/pages/Budget";
import Expenses from "@/pages/Expenses";
import Family from "@/pages/Family";
import FinnyChat from "@/pages/FinnyChat";
import Goals from "@/pages/Goals";
import History from "@/pages/History";
import Loans from "@/pages/Loans";
import ManageCategories from "@/pages/ManageCategories";
import ManageFunds from "@/pages/ManageFunds";
import Settings from "@/pages/Settings";

import NotFound from "@/pages/NotFound";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useFirstTimeVisit } from "@/hooks/useFirstTimeVisit";
import { ScrollToTop } from "@/components/ScrollToTop";

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

const RootRedirect = () => {
  const { isFirstVisit, isLoading } = useFirstTimeVisit();

  if (isLoading) {
    return null;
  }

  if (isFirstVisit) {
    return <Navigate to="/welcome" replace />;
  }

  return (
    <ProtectedRoute>
      <Navigate to="/app/dashboard" replace />
    </ProtectedRoute>
  );
};

const App = () => {
  console.log('🚀 App component rendering with full functionality...');
  
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <AuthProvider>
              <ErrorBoundary>
                <OfflineProvider>
                  <CurrencyProvider>
                    <MonthProvider>
                      <FamilyProvider>
                        <FinnyProvider>
                      <BrowserRouter>
                        <ScrollToTop />
                      <Routes>
                        {/* Welcome route for first-time visitors */}
                        <Route path="/welcome" element={<Welcome />} />
                        
                        {/* Public routes */}
                        <Route path="/auth" element={<Auth />} />
                        
                        
                        {/* Protected routes with Layout */}
                        <Route path="/app" element={
                          <ProtectedRoute>
                            <Layout />
                          </ProtectedRoute>
                        }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="budget" element={<Budget />} />
          <Route path="goals" element={<Goals />} />
          <Route path="loans" element={<Loans />} />
          <Route path="history" element={<History />} />
          <Route path="family" element={<Family />} />
          <Route path="settings" element={<Settings />} />
          <Route path="finny-chat" element={<FinnyChat />} />
          <Route path="guide" element={<AppGuide />} />
          <Route path="manage-categories" element={<ManageCategories />} />
          <Route path="manage-funds" element={<ManageFunds />} />
                        </Route>
                        
                        {/* Default redirects */}
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                    
                    {/* App Open Ad - inside providers to access React hooks */}
                    <AppOpenAd 
                      adUnitId="ca-app-pub-8996865130200922/5906339239" 
                      showFrequencyHours={4}
                      enabled={true}
                    />
                    
                    <Toaster />
                    <Sonner />
                      </FinnyProvider>
                    </FamilyProvider>
                  </MonthProvider>
                </CurrencyProvider>
              </OfflineProvider>
              </ErrorBoundary>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
