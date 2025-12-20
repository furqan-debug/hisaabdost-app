import { Appsflyer } from '@awesome-cordova-plugins/appsflyer';

// Track events that have been logged to prevent duplicates
const loggedEvents = new Map<string, number>();
const DEDUPE_WINDOW_MS = 2000; // 2 second window to prevent duplicate events

/**
 * Helper to safely log AppsFlyer events with deduplication
 */
const safeLogEvent = (eventName: string, eventValues: Record<string, any> = {}) => {
  try {
    // Create unique key for deduplication
    const eventKey = `${eventName}_${JSON.stringify(eventValues)}`;
    const now = Date.now();
    const lastLogged = loggedEvents.get(eventKey);

    // Check if this exact event was logged recently
    if (lastLogged && (now - lastLogged) < DEDUPE_WINDOW_MS) {
      console.log(`[AppsFlyer] Skipping duplicate event: ${eventName}`);
      return;
    }

    // Log the event
    Appsflyer.logEvent(eventName, eventValues);
    loggedEvents.set(eventKey, now);
    console.log(`[AppsFlyer] Logged: ${eventName}`, eventValues);

    // Clean up old entries every 100 events
    if (loggedEvents.size > 100) {
      const cutoff = now - DEDUPE_WINDOW_MS * 2;
      for (const [key, timestamp] of loggedEvents.entries()) {
        if (timestamp < cutoff) {
          loggedEvents.delete(key);
        }
      }
    }
  } catch (error) {
    console.error(`[AppsFlyer] Error logging ${eventName}:`, error);
  }
};

/**
 * 1. User completes registration
 */
export const logCompleteRegistration = (method: string = 'email') => {
  safeLogEvent('af_complete_registration', {
    registration_method: method
  });
};

/**
 * 2. User logs in
 */
export const logLogin = () => {
  safeLogEvent('af_login', {});
};

/**
 * 3. User views analytics/report screen
 */
export const logReportViewed = (reportType: string = 'analytics') => {
  safeLogEvent('report_viewed', {
    report_type: reportType
  });
};

/**
 * 4. User creates or updates budget
 */
export const logAddBudget = (budgetName: string, budgetAmount: number) => {
  safeLogEvent('add_budget', {
    budget_name: budgetName,
    budget_amount: budgetAmount
  });
};

/**
 * 5. User adds an expense
 */
export const logExpenseAdded = (category: string, amount: number, paymentMode: string) => {
  safeLogEvent('expense_added', {
    category,
    amount,
    payment_mode: paymentMode
  });
};

/**
 * 6. User achieves a goal
 */
export const logGoalAchieved = (goalName: string, goalTarget: number, goalStatus: string = 'achieved') => {
  safeLogEvent('goal_achieved', {
    goal_name: goalName,
    goal_target: goalTarget,
    goal_status: goalStatus
  });
};

/**
 * 7. Receipt successfully scanned via OCR
 */
export const logReceiptScanned = (merchantName: string, totalAmount: number) => {
  safeLogEvent('receipt_scanned', {
    merchant_name: merchantName || 'Unknown',
    total_amount: totalAmount
  });
};

/**
 * 8. Finny AI assistant is opened
 */
export const logFinnyInvoked = (invocationSource: string = 'unknown') => {
  safeLogEvent('finny_invoked', {
    invocation_source: invocationSource
  });
};

/**
 * 9. User sends a message to Finny
 */
export const logFinnyMessageSent = (message: string) => {
  // Categorize the query based on content
  const queryCategory = categorizeQuery(message);
  
  safeLogEvent('finny_message_sent', {
    query_category: queryCategory,
    query_length: message.length
  });
};

/**
 * 10. Finny sends a response to user
 */
export const logFinnyResponseShown = (response: string, hasAction: boolean) => {
  safeLogEvent('finny_response_shown', {
    response_type: hasAction ? 'action_response' : 'text_response',
    response_length: response.length
  });
};

/**
 * Helper to categorize Finny queries using simple keyword matching
 */
const categorizeQuery = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('expense') || lowerMessage.includes('spent') || lowerMessage.includes('cost')) {
    return 'expense';
  }
  if (lowerMessage.includes('budget') || lowerMessage.includes('limit')) {
    return 'budget';
  }
  if (lowerMessage.includes('goal') || lowerMessage.includes('save') || lowerMessage.includes('saving')) {
    return 'goal';
  }
  if (lowerMessage.includes('report') || lowerMessage.includes('analytics') || lowerMessage.includes('summary')) {
    return 'report';
  }
  
  return 'general';
};
