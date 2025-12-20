import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

// Event categories
export type EventCategory = 'navigation' | 'interaction' | 'feature' | 'engagement' | 'error';

// Typed event names
export type EventName =
  // Navigation events
  | 'page_view'
  | 'screen_enter'
  | 'screen_exit'
  | 'tab_change'
  // Interaction events
  | 'button_click'
  | 'form_submit'
  | 'swipe_action'
  | 'pull_refresh'
  // Feature events
  | 'finny_opened'
  | 'finny_closed'
  | 'finny_message_sent'
  | 'finny_message_received'
  | 'receipt_scan_started'
  | 'receipt_scan_completed'
  | 'receipt_scan_failed'
  | 'expense_added'
  | 'expense_deleted'
  | 'expense_edited'
  | 'budget_created'
  | 'budget_updated'
  | 'goal_created'
  | 'goal_updated'
  | 'loan_created'
  | 'income_set'
  // Engagement events
  | 'session_start'
  | 'session_end'
  | 'app_foreground'
  | 'app_background'
  | 'signup_completed'
  | 'login_completed'
  | 'onboarding_completed'
  // Error events
  | 'api_error'
  | 'validation_error'
  | 'network_error'
  | 'crash_report';

interface UserEvent {
  user_id?: string | null;
  anonymous_id?: string | null;
  session_id: string;
  event_name: EventName;
  event_category: EventCategory;
  event_data?: Record<string, unknown>;
  page_path?: string;
  referrer?: string;
  device_info?: Record<string, unknown>;
}

interface DeviceInfo {
  platform: string;
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  online: boolean;
  [key: string]: unknown;
}

class AnalyticsService {
  private sessionId: string;
  private anonymousId: string;
  private userId: string | null = null;
  private eventQueue: UserEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private deviceInfo: DeviceInfo | null = null;
  private isEnabled: boolean = true;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL_MS = 5000;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.anonymousId = this.getOrCreateAnonymousId();
    this.deviceInfo = this.captureDeviceInfo();
    this.startFlushInterval();
    this.setupVisibilityListener();
  }

  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;
    
    const newId = uuidv4();
    sessionStorage.setItem('analytics_session_id', newId);
    return newId;
  }

  private getOrCreateAnonymousId(): string {
    const stored = localStorage.getItem('analytics_anonymous_id');
    if (stored) return stored;
    
    const newId = uuidv4();
    localStorage.setItem('analytics_anonymous_id', newId);
    return newId;
  }

  private captureDeviceInfo(): DeviceInfo {
    return {
      platform: navigator.platform || 'unknown',
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: window.screen?.width || 0,
      screenHeight: window.screen?.height || 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      online: navigator.onLine,
    };
  }

  private startFlushInterval(): void {
    if (this.flushInterval) return;
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL_MS);
  }

  private setupVisibilityListener(): void {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Flush immediately when user leaves
        this.flush();
        this.track('app_background', 'engagement');
      } else {
        this.track('app_foreground', 'engagement');
      }
    });

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });
  }

  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  track(
    eventName: EventName,
    category: EventCategory,
    data?: Record<string, unknown>,
    pagePath?: string
  ): void {
    if (!this.isEnabled) return;

    const event: UserEvent = {
      user_id: this.userId,
      anonymous_id: this.anonymousId,
      session_id: this.sessionId,
      event_name: eventName,
      event_category: category,
      event_data: data || {},
      page_path: pagePath || (typeof window !== 'undefined' ? window.location.pathname : undefined),
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      device_info: this.deviceInfo || {},
    };

    this.eventQueue.push(event);

    // Flush if queue is full
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  // Convenience methods for common events
  trackPageView(pagePath: string, pageTitle?: string): void {
    this.track('page_view', 'navigation', { page_title: pageTitle }, pagePath);
  }

  trackButtonClick(buttonName: string, context?: Record<string, unknown>): void {
    this.track('button_click', 'interaction', { button_name: buttonName, ...context });
  }

  trackFeature(eventName: EventName, data?: Record<string, unknown>): void {
    this.track(eventName, 'feature', data);
  }

  trackError(errorType: string, errorMessage: string, context?: Record<string, unknown>): void {
    this.track('api_error', 'error', {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  }

  trackSessionStart(): void {
    this.sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', this.sessionId);
    this.track('session_start', 'engagement', {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
    });
  }

  trackSessionEnd(): void {
    this.track('session_end', 'engagement', {
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
    });
    this.flush(true);
  }

  async flush(sync = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      if (sync && 'sendBeacon' in navigator) {
        // Use sendBeacon for sync flush (page unload)
        const payload = JSON.stringify(eventsToSend);
        navigator.sendBeacon(
          `https://bklfolfivjonzpprytkz.supabase.co/rest/v1/user_events`,
          new Blob([payload], { type: 'application/json' })
        );
      } else {
        // Use regular insert for async flush
        const { error } = await supabase
          .from('user_events')
          .insert(eventsToSend as any);

        if (error) {
          console.error('Analytics flush error:', error);
          // Re-queue failed events
          this.eventQueue.unshift(...eventsToSend);
        }
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Re-queue failed events
      this.eventQueue.unshift(...eventsToSend);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getAnonymousId(): string {
    return this.anonymousId;
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(true);
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// Export for use in components
export default analytics;
