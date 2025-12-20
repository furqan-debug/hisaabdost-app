import React, { createContext, useContext } from 'react';
import { useAnalyticsInit, usePageTracking } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({ isInitialized: false });

export function useAnalyticsContext() {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // Initialize analytics with user context
  useAnalyticsInit();
  
  // Auto-track page views
  usePageTracking();

  return (
    <AnalyticsContext.Provider value={{ isInitialized: true }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
