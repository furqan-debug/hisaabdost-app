import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { mobileNotificationScheduler } from '@/services/mobileNotificationScheduler';
import { useBudgetData } from './useBudgetData';
import { useLoans } from './useLoans';
import { Capacitor } from '@capacitor/core';

export function useScheduledNotifications() {
  const { user } = useAuth();
  const { budgetNotificationData } = useBudgetData() || {};
  const { data: loans } = useLoans();

  // Monitor budget thresholds in real-time
  useEffect(() => {
    if (!user || !budgetNotificationData || !Capacitor.isNativePlatform()) return;

    const checkBudgets = async () => {
      for (const budget of budgetNotificationData) {
        const percentage = (budget.spent / budget.budget) * 100;
        
        // Only notify for significant thresholds
        if (percentage >= 50) {
          await mobileNotificationScheduler.checkBudgetThreshold(
            budget.category,
            percentage,
            budget.spent,
            budget.budget,
            '₹' // Get from user preferences
          );
        }
      }
    };

    checkBudgets();
  }, [user, budgetNotificationData]);

  return {
    scheduleLoanReminders: mobileNotificationScheduler.scheduleLoanReminders.bind(mobileNotificationScheduler),
    scheduleGoalReminders: mobileNotificationScheduler.scheduleGoalReminders.bind(mobileNotificationScheduler),
    sendImmediateNotification: mobileNotificationScheduler.sendImmediateNotification.bind(mobileNotificationScheduler),
  };
}
