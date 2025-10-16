import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface ScheduledNotification {
  id: string;
  userId: string;
  notificationType: string;
  triggerData: Record<string, any>;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
}

export class MobileNotificationScheduler {
  private static instance: MobileNotificationScheduler;

  private constructor() {
    this.initializeChannels();
  }

  static getInstance(): MobileNotificationScheduler {
    if (!MobileNotificationScheduler.instance) {
      MobileNotificationScheduler.instance = new MobileNotificationScheduler();
    }
    return MobileNotificationScheduler.instance;
  }

  private async initializeChannels() {
    // Notification channels are managed by Firebase on the backend
    console.log('✅ Notification system ready');
  }

  async scheduleLoanReminders(loan: {
    id: string;
    person_name: string;
    amount: number;
    due_date?: string;
    loan_type: string;
  }): Promise<void> {
    if (!loan.due_date) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      const prefs = (profile?.notification_preferences as any) || {};
      const reminderDays = prefs.loanReminderDays || [7, 3, 1];
      const dueDate = new Date(loan.due_date);

      // Schedule notifications for each reminder day
      for (const days of reminderDays) {
        const notificationDate = addDays(dueDate, -days);

        if (notificationDate > new Date()) {
          await supabase.from('scheduled_notifications').insert({
            user_id: user.id,
            notification_type: 'loan_reminder',
            trigger_data: { loanId: loan.id, daysUntilDue: days },
            scheduled_for: notificationDate.toISOString(),
            status: 'pending',
          });
        }
      }

      console.log(`✅ Scheduled ${reminderDays.length} loan reminders for ${loan.person_name}`);
    } catch (error) {
      console.error('❌ Failed to schedule loan reminders:', error);
    }
  }

  async cancelLoanReminders(loanId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notifications } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('notification_type', 'loan_reminder')
        .eq('status', 'pending');

      if (notifications && notifications.length > 0) {
        const idsToCancel = notifications
          .filter(n => (n as any).trigger_data?.loanId === loanId)
          .map(n => n.id);

        if (idsToCancel.length > 0) {
          await supabase
            .from('scheduled_notifications')
            .update({ status: 'cancelled' })
            .in('id', idsToCancel);
        }
      }

      console.log(`✅ Cancelled loan reminders for loan ${loanId}`);
    } catch (error) {
      console.error('❌ Failed to cancel loan reminders:', error);
    }
  }

  async scheduleGoalReminders(goal: {
    id: string;
    title: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
  }): Promise<void> {
    if (!goal.deadline) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deadline = new Date(goal.deadline);
      const reminderDays = [30, 14, 7, 3, 1];

      for (const days of reminderDays) {
        const notificationDate = addDays(deadline, -days);

        if (notificationDate > new Date()) {
          await supabase.from('scheduled_notifications').insert({
            user_id: user.id,
            notification_type: 'goal_reminder',
            trigger_data: { goalId: goal.id, daysUntilDeadline: days },
            scheduled_for: notificationDate.toISOString(),
            status: 'pending',
          });
        }
      }

      console.log(`✅ Scheduled goal reminders for "${goal.title}"`);
    } catch (error) {
      console.error('❌ Failed to schedule goal reminders:', error);
    }
  }

  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // Send via backend scheduled notification system
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert immediate notification (scheduled for 1 second from now)
      await supabase.from('scheduled_notifications').insert({
        user_id: user.id,
        notification_type: data?.type || 'immediate',
        trigger_data: { title, body, ...data },
        scheduled_for: new Date(Date.now() + 1000).toISOString(),
        status: 'pending',
      });

      console.log('✅ Immediate notification queued:', title);
    } catch (error) {
      console.error('❌ Failed to send immediate notification:', error);
    }
  }

  async checkBudgetThreshold(
    category: string,
    percentage: number,
    spent: number,
    budget: number,
    currency: string = '$'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      const prefs = (profile?.notification_preferences as any) || {};
      const thresholds = prefs.budgetThresholds || [50, 60, 70, 80, 90, 100];

      // Check if this threshold should trigger a notification
      const shouldNotify = thresholds.some((t: number) => 
        percentage >= t && percentage < t + 5 // 5% tolerance
      );

      if (shouldNotify && prefs.budgetAlerts !== false) {
        const emoji = percentage >= 100 ? '❌' : percentage >= 90 ? '🔴' : percentage >= 80 ? '🟠' : percentage >= 70 ? '🟡' : '⚠️';
        const remaining = budget - spent;

        const title = `${emoji} Budget Alert: ${category}`;
        const body = percentage >= 100
          ? `Exceeded by ${currency}${Math.abs(remaining).toFixed(0)}!`
          : `${percentage.toFixed(0)}% used. ${currency}${remaining.toFixed(0)} remaining`;

        await this.sendImmediateNotification(title, body, {
          type: 'budget_alert',
          category,
          route: '/app/dashboard',
        });
      }
    } catch (error) {
      console.error('❌ Failed to check budget threshold:', error);
    }
  }
}

export const mobileNotificationScheduler = MobileNotificationScheduler.getInstance();
