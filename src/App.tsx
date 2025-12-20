
import React, { Suspense, lazy } from 'react';
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
import { AppTourProvider } from "@/hooks/useAppTour";
import { OfflineProvider } from "@/components/offline/OfflineProvider";
import { AppOpenAd } from "@/components/ads/AppOpenAd";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useFirstTimeVisit } from "@/hooks/useFirstTimeVisit";
import { ScrollToTop } from "@/components/ScrollToTop";
import { QUERY_CONFIG } from "@/lib/queryConfig";
import { OptimizedLoadingScreen } from "@/components/shared/OptimizedLoadingScreen";

// Lazy load pages for better performance
const Auth = lazy(() => import("@/pages/Auth"));
const Welcome = lazy(() => import("@/pages/Welcome"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const AppGuide = lazy(() => import("@/pages/AppGuide"));
const Budget = lazy(() => import("@/pages/Budget"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Family = lazy(() => import("@/pages/Family"));
const FinnyChat = lazy(() => import("@/pages/FinnyChat"));
const Goals = lazy(() => import("@/pages/Goals"));
const History = lazy(() => import("@/pages/History"));
const Loans = lazy(() => import("@/pages/Loans"));
const ManageCategories = lazy(() => import("@/pages/ManageCategories"));
const ManageFunds = lazy(() => import("@/pages/ManageFunds"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Create QueryClient with optimized settings for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      ...QUERY_CONFIG.DEFAULT_OPTIONS,
      staleTime: QUERY_CONFIG.STALE_TIME.EXPENSES,
      gcTime: QUERY_CONFIG.GC_TIME.DEFAULT,
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
    <ErrorBoundary 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center space-y-4 max-w-md">
            <p className="text-lg font-medium text-foreground">Unable to start app</p>
            <p className="text-sm text-muted-foreground">
              Please ensure you're running the latest version. If the problem persists, try reinstalling the app.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      }
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <AuthProvider>
                <OfflineProvider>
                  <CurrencyProvider>
                    <MonthProvider>
                      <FamilyProvider>
                        <FinnyProvider>
                          <AppTourProvider>
                      <BrowserRouter>
                        <AnalyticsProvider>
                        <ScrollToTop />
                        <Suspense fallback={<OptimizedLoadingScreen />}>
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
                        </Suspense>
                        </AnalyticsProvider>
                    </BrowserRouter>
                    
                    {/* Native App Open Ad */}
                    <AppOpenAd 
                      adUnitId="ca-app-pub-8996865130200922/5906339239"
                      showFrequencyHours={4}
                      enabled={false}
                    />
                    
                    <Toaster />
                    <Sonner />
                          </AppTourProvider>
                      </FinnyProvider>
                    </FamilyProvider>
                  </MonthProvider>
                </CurrencyProvider>
                </OfflineProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
