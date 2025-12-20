import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import analytics, { EventName } from '@/services/analyticsService';

// Hook to initialize analytics with user context
export function useAnalyticsInit() {
  const { user } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      analytics.trackSessionStart();
      initialized.current = true;
    }

    analytics.setUserId(user?.id || null);
  }, [user]);

  useEffect(() => {
    return () => {
      analytics.trackSessionEnd();
    };
  }, []);
}

// Hook for automatic page view tracking
export function usePageTracking() {
  const location = useLocation();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Don't track if same page
    if (previousPath.current === currentPath) return;
    
    // Track page exit if there was a previous page
    if (previousPath.current) {
      analytics.track('screen_exit', 'navigation', {
        from_path: previousPath.current,
        to_path: currentPath,
      }, previousPath.current);
    }

    // Track page view
    const pageTitle = getPageTitle(currentPath);
    analytics.trackPageView(currentPath, pageTitle);

    previousPath.current = currentPath;
  }, [location.pathname]);
}

// Hook for tracking specific features
export function useFeatureTracking() {
  const trackFeature = useCallback((eventName: EventName, data?: Record<string, unknown>) => {
    analytics.trackFeature(eventName, data);
  }, []);

  const trackButtonClick = useCallback((buttonName: string, context?: Record<string, unknown>) => {
    analytics.trackButtonClick(buttonName, context);
  }, []);

  const trackError = useCallback((errorType: string, errorMessage: string, context?: Record<string, unknown>) => {
    analytics.trackError(errorType, errorMessage, context);
  }, []);

  return { trackFeature, trackButtonClick, trackError };
}

// Hook for tracking Finny interactions
export function useFinnyTracking() {
  const trackFinnyOpened = useCallback(() => {
    analytics.track('finny_opened', 'feature');
  }, []);

  const trackFinnyClosed = useCallback(() => {
    analytics.track('finny_closed', 'feature');
  }, []);

  const trackFinnyMessage = useCallback((isUser: boolean, messageLength: number) => {
    analytics.track(
      isUser ? 'finny_message_sent' : 'finny_message_received',
      'feature',
      { message_length: messageLength }
    );
  }, []);

  return { trackFinnyOpened, trackFinnyClosed, trackFinnyMessage };
}

// Hook for tracking tour progress
export function useTourTracking() {
  const trackTourStarted = useCallback(() => {
    analytics.track('tour_started', 'feature');
  }, []);

  const trackTourStep = useCallback((stepIndex: number, stepId: string) => {
    analytics.track('tour_step_completed', 'feature', {
      step_index: stepIndex,
      step_id: stepId,
    });
  }, []);

  const trackTourCompleted = useCallback((totalSteps: number) => {
    analytics.track('tour_completed', 'feature', { total_steps: totalSteps });
  }, []);

  const trackTourSkipped = useCallback((atStep: number) => {
    analytics.track('tour_skipped', 'feature', { skipped_at_step: atStep });
  }, []);

  return { trackTourStarted, trackTourStep, trackTourCompleted, trackTourSkipped };
}

// Hook for tracking expense actions
export function useExpenseTracking() {
  const trackExpenseAdded = useCallback((amount: number, category: string) => {
    analytics.track('expense_added', 'feature', { amount, category });
  }, []);

  const trackExpenseDeleted = useCallback((expenseId: string) => {
    analytics.track('expense_deleted', 'feature', { expense_id: expenseId });
  }, []);

  const trackExpenseEdited = useCallback((expenseId: string, changes: string[]) => {
    analytics.track('expense_edited', 'feature', { expense_id: expenseId, changed_fields: changes });
  }, []);

  return { trackExpenseAdded, trackExpenseDeleted, trackExpenseEdited };
}

// Utility function to get page titles
function getPageTitle(path: string): string {
  const titles: Record<string, string> = {
    '/': 'Home',
    '/welcome': 'Welcome',
    '/auth': 'Authentication',
    '/app/dashboard': 'Dashboard',
    '/app/analytics': 'Analytics',
    '/app/expenses': 'Expenses',
    '/app/budget': 'Budget',
    '/app/goals': 'Goals',
    '/app/loans': 'Loans',
    '/app/history': 'History',
    '/app/family': 'Family',
    '/app/settings': 'Settings',
    '/app/finny-chat': 'Finny Chat',
    '/app/guide': 'App Guide',
    '/app/manage-categories': 'Manage Categories',
    '/app/manage-funds': 'Manage Funds',
    '/analytics-admin': 'Analytics Admin',
  };
  
  return titles[path] || path.split('/').pop() || 'Unknown';
}
