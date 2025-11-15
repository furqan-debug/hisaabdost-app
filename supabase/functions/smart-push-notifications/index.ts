
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface User {
  id: string;
  email: string;
  monthly_income: number;
  notification_timezone: string;
  last_notification_date: string | null;
  preferred_currency: string;
  notifications_enabled: boolean;
}

interface Expense {
  amount: number;
  category: string;
  date: string;
}

interface Budget {
  category: string;
  amount: number;
}

interface Goal {
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category: string;
}

interface NotificationContext {
  totalSpent: number;
  budgetUtilization: number;
  spendingTrend: number;
  topCategory: string;
  daysInMonth: number;
  expenseCount: number;
  monthlyIncome: number;
  currency: string;
  weeklySpent: number;
  dailyAverage: number;
  goals: Goal[];
  budgets: Budget[];
  overspentCategories: string[];
  monthlyProgress: number;
}

type NotificationType = 
  | 'budget_warning' 
  | 'overspending_alert' 
  | 'monthly_reset' 
  | 'daily_reminder' 
  | 'weekly_report' 
  | 'category_insights' 
  | 'savings_update'
  | 'goal_progress';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🧠 Starting comprehensive smart notifications analysis...');

    // Get request body to check for specific notification type
    const body = await req.json().catch(() => ({}));
    const requestedType = body.notification_type as NotificationType | undefined;

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const currentDate = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const dayOfMonth = now.getDate();

    // Get active users based on notification type
    const users = await getEligibleUsers(supabaseAdmin, currentDate, requestedType, dayOfWeek, dayOfMonth);

    console.log(`Found ${users?.length || 0} users to analyze for ${requestedType || 'all'} notifications`);

    let notificationsSent = 0;
    const processedUsers = users?.length || 0;

    for (const user of users || []) {
      try {
        const sent = await processUserNotifications(
          supabaseAdmin, 
          user, 
          currentMonth, 
          currentDate, 
          requestedType,
          dayOfWeek,
          dayOfMonth
        );
        if (sent) notificationsSent++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analyzed_users: processedUsers,
        notifications_sent: notificationsSent,
        notification_type: requestedType || 'smart_analysis',
        automated: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Smart notifications error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

async function getEligibleUsers(
  supabase: any, 
  currentDate: string, 
  requestedType?: NotificationType,
  dayOfWeek?: number,
  dayOfMonth?: number
) {
  let query = supabase
    .from('profiles')
    .select('id, monthly_income, notification_timezone, last_notification_date, preferred_currency, notifications_enabled')
    .eq('notifications_enabled', true);

  // Filter based on notification type and timing
  if (requestedType === 'daily_reminder') {
    // Daily reminders - skip if already sent today
    query = query.or(`last_notification_date.is.null,last_notification_date.neq.${currentDate}`);
  } else if (requestedType === 'weekly_report') {
    // Weekly reports - only on Sundays
    if (dayOfWeek !== 0) return [];
  } else if (requestedType === 'monthly_reset') {
    // Monthly reset - only on 1st of month
    if (dayOfMonth !== 1) return [];
  } else {
    // For other types, don't send if already sent today
    query = query.or(`last_notification_date.is.null,last_notification_date.neq.${currentDate}`);
  }

  const { data: users, error } = await query;
  
  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  return users;
}

async function processUserNotifications(
  supabase: any, 
  user: User, 
  currentMonth: string, 
  currentDate: string,
  requestedType?: NotificationType,
  dayOfWeek?: number,
  dayOfMonth?: number
): Promise<boolean> {
  console.log(`Processing notifications for user: ${user.id}`);

  // Get comprehensive user financial data
  const financialData = await getUserFinancialData(supabase, user.id, currentMonth);
  
  // Calculate comprehensive financial context
  const context = calculateFinancialContext(
    financialData.expenses || [], 
    financialData.budgets || [], 
    financialData.goals || [],
    financialData.monthlyIncome,
    user.preferred_currency || 'USD'
  );

  // Determine notification type if not specified
  const notificationType = requestedType || determineNotificationType(context, dayOfWeek, dayOfMonth);
  
  if (!notificationType) {
    console.log(`No suitable notification type for user ${user.id}`);
    return false;
  }

  // Generate AI notification using DeepSeek
  const notification = await generateMultilingualNotification(context, user, notificationType);
  
  if (notification) {
    // Send actual push notification
    console.log(`📱 Sending ${notificationType} notification to ${user.id}`);
    
    try {
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: user.id,
          title: notification.title,
          body: notification.message,
          data: {
            type: notificationType,
            priority: notification.priority,
            context: context
          }
        }
      });

      if (pushError) {
        console.error(`Failed to send push notification to ${user.id}:`, pushError);
      } else {
        console.log(`✅ Push notification sent successfully to ${user.id}`);
      }
    } catch (error) {
      console.error(`Error sending push notification to ${user.id}:`, error);
    }
    
    // Store notification analytics
    await supabase
      .from('notification_analytics')
      .insert({
        user_id: user.id,
        notification_type: notificationType,
        priority_score: notification.priority,
        financial_context: context,
        ai_reasoning: notification.reasoning,
        user_timezone: user.notification_timezone || 'UTC'
      });

    // Update last notification date (except for weekly/monthly which have their own timing)
    if (!['weekly_report', 'monthly_reset'].includes(notificationType)) {
      await supabase
        .from('profiles')
        .update({ last_notification_date: currentDate })
        .eq('id', user.id);
    }

    return true;
  }

  return false;
}

async function getUserFinancialData(supabase: any, userId: string, currentMonth: string) {
  const [expensesData, budgetsData, goalsData, monthlyIncomeData] = await Promise.all([
    // Get expenses for current month
    supabase
      .from('expenses')
      .select('amount, category, date')
      .eq('user_id', userId)
      .gte('date', `${currentMonth}-01`)
      .lte('date', `${currentMonth}-31`),
    
    // Get user's budgets
    supabase
      .from('budgets')
      .select('category, amount')
      .eq('user_id', userId)
      .eq('period', currentMonth),
    
    // Get user's goals
    supabase
      .from('goals')
      .select('title, target_amount, current_amount, deadline, category')
      .eq('user_id', userId),
    
    // Get monthly income
    supabase
      .from('monthly_incomes')
      .select('income_amount')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .maybeSingle()
  ]);

  return {
    expenses: expensesData.data,
    budgets: budgetsData.data,
    goals: goalsData.data,
    monthlyIncome: monthlyIncomeData.data?.income_amount || 0
  };
}

function calculateFinancialContext(
  expenses: Expense[], 
  budgets: Budget[], 
  goals: Goal[],
  monthlyIncome: number,
  currency: string
): NotificationContext {
  const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  
  // Calculate budget utilization
  const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate weekly spending (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  
  const weeklySpent = expenses
    .filter(exp => exp.date >= weekAgoStr)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Calculate daily average
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const dailyAverage = currentDay > 0 ? totalSpent / currentDay : 0;

  // Calculate spending trend
  const expectedSpending = dailyAverage * daysInMonth;
  const spendingTrend = monthlyIncome > 0 ? ((expectedSpending - monthlyIncome) / monthlyIncome) * 100 : 0;

  // Find top spending category
  const categorySpending: Record<string, number> = {};
  expenses.forEach(exp => {
    categorySpending[exp.category] = (categorySpending[exp.category] || 0) + Number(exp.amount);
  });
  
  const topCategory = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'General';

  // Find overspent categories
  const overspentCategories: string[] = [];
  budgets.forEach(budget => {
    const spent = categorySpending[budget.category] || 0;
    if (spent > Number(budget.amount)) {
      overspentCategories.push(budget.category);
    }
  });

  // Calculate monthly progress (days passed vs total days)
  const monthlyProgress = (currentDay / daysInMonth) * 100;

  return {
    totalSpent,
    budgetUtilization,
    spendingTrend,
    topCategory,
    daysInMonth,
    expenseCount: expenses.length,
    monthlyIncome,
    currency,
    weeklySpent,
    dailyAverage,
    goals,
    budgets,
    overspentCategories,
    monthlyProgress
  };
}

function determineNotificationType(
  context: NotificationContext, 
  dayOfWeek?: number, 
  dayOfMonth?: number
): NotificationType | null {
  // Priority order for automatic notifications
  
  // Critical alerts first
  if (context.overspentCategories.length > 0) {
    return 'overspending_alert';
  }
  
  if (context.budgetUtilization > 85) {
    return 'budget_warning';
  }
  
  // Monthly reset on 1st
  if (dayOfMonth === 1) {
    return 'monthly_reset';
  }
  
  // Weekly report on Sundays
  if (dayOfWeek === 0) {
    return 'weekly_report';
  }
  
  // Goal updates if goals exist
  if (context.goals.length > 0) {
    return 'savings_update';
  }
  
  // Category insights if there's spending data
  if (context.expenseCount > 5) {
    return 'category_insights';
  }
  
  // Daily reminder as fallback
  return 'daily_reminder';
}

async function generateMultilingualNotification(
  context: NotificationContext, 
  user: User,
  type: NotificationType
): Promise<{ title: string; message: string; priority: number; reasoning: string } | null> {
  
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
  
  if (!deepseekApiKey) {
    console.warn('DeepSeek API key not found, using fallback notifications');
    return generateFallbackNotification(context, user, type);
  }

  try {
    // Determine user language based on currency
    const language = getCurrencyLanguage(user.preferred_currency || 'USD');
    
    // Create context-specific prompt
    const prompt = createNotificationPrompt(context, type, language, user.preferred_currency);
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are a helpful financial assistant. Generate concise, actionable push notifications in ${language}. Keep messages under 100 characters for titles and 200 characters for body text. Use appropriate emojis and be encouraging but realistic about financial advice.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse AI response (expecting JSON format)
    const notification = parseAIResponse(aiResponse, type);
    
    if (notification) {
      return {
        ...notification,
        reasoning: `AI-generated ${type} notification in ${language} for user ${user.id}`
      };
    }
    
  } catch (error) {
    console.error('Error generating AI notification:', error);
  }
  
  // Fallback to template-based notifications
  return generateFallbackNotification(context, user, type);
}

function getCurrencyLanguage(currency: string): string {
  const currencyLanguageMap: Record<string, string> = {
    'USD': 'English',
    'EUR': 'English',
    'GBP': 'English',
    'JPY': 'Japanese',
    'CNY': 'Chinese',
    'KRW': 'Korean',
    'INR': 'English',
    'BRL': 'Portuguese',
    'MXN': 'Spanish',
    'CAD': 'English',
    'AUD': 'English',
    'CHF': 'English',
    'SGD': 'English',
    'HKD': 'English'
  };
  
  return currencyLanguageMap[currency] || 'English';
}

function createNotificationPrompt(
  context: NotificationContext, 
  type: NotificationType, 
  language: string,
  currency: string
): string {
  const currencySymbol = getCurrencySymbol(currency);
  
  const baseContext = `
Financial Data:
- Monthly Income: ${currencySymbol}${context.monthlyIncome}
- Total Spent: ${currencySymbol}${context.totalSpent}
- Budget Utilization: ${context.budgetUtilization.toFixed(1)}%
- Top Category: ${context.topCategory}
- Weekly Spent: ${currencySymbol}${context.weeklySpent}
- Daily Average: ${currencySymbol}${context.dailyAverage.toFixed(2)}
- Month Progress: ${context.monthlyProgress.toFixed(1)}%
- Overspent Categories: ${context.overspentCategories.join(', ') || 'None'}
`;

  const typeSpecificPrompts: Record<NotificationType, string> = {
    budget_warning: `Generate a budget warning notification. The user is at ${context.budgetUtilization.toFixed(1)}% of their budget.`,
    overspending_alert: `Generate an overspending alert. Categories over budget: ${context.overspentCategories.join(', ')}`,
    monthly_reset: `Generate a new month motivation message. Previous month total: ${currencySymbol}${context.totalSpent}`,
    daily_reminder: `Generate a daily expense tracking reminder. Current spending: ${currencySymbol}${context.totalSpent}`,
    weekly_report: `Generate a weekly spending summary. This week: ${currencySymbol}${context.weeklySpent}`,
    category_insights: `Generate spending insights for top category: ${context.topCategory}`,
    savings_update: `Generate savings goal progress update. User has ${context.goals.length} active goals.`,
    goal_progress: `Generate goal progress notification for ${context.goals.length} goals.`
  };

  return `${baseContext}

${typeSpecificPrompts[type]}

Please respond with a JSON object in this exact format:
{
  "title": "Short notification title",
  "message": "Notification body message", 
  "priority": 1-5
}

Language: ${language}
Currency: ${currency}`;
}

function parseAIResponse(aiResponse: string, type: NotificationType): { title: string; message: string; priority: number } | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.title && parsed.message && parsed.priority) {
        return {
          title: parsed.title.substring(0, 100), // Ensure title length
          message: parsed.message.substring(0, 200), // Ensure message length
          priority: Math.min(Math.max(parsed.priority, 1), 5) // Ensure priority is 1-5
        };
      }
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
  }
  
  return null;
}

function generateFallbackNotification(
  context: NotificationContext, 
  user: User,
  type: NotificationType
): { title: string; message: string; priority: number; reasoning: string } {
  const currencySymbol = getCurrencySymbol(user.preferred_currency || 'USD');
  
  const notifications: Record<NotificationType, { title: string; message: string; priority: number }> = {
    budget_warning: {
      title: '⚠️ Budget Alert',
      message: `You've used ${context.budgetUtilization.toFixed(1)}% of your budget. Consider reviewing your ${context.topCategory} spending.`,
      priority: 4
    },
    overspending_alert: {
      title: '🚨 Overspending Alert', 
      message: `You've exceeded your budget in: ${context.overspentCategories.join(', ')}. Time to adjust your spending!`,
      priority: 5
    },
    monthly_reset: {
      title: '🗓️ New Month Started',
      message: `Last month you spent ${currencySymbol}${context.totalSpent}. Ready to track this month's expenses?`,
      priority: 2
    },
    daily_reminder: {
      title: '📊 Daily Check-in',
      message: `You've spent ${currencySymbol}${context.totalSpent} so far this month. Don't forget to log today's expenses!`,
      priority: 1
    },
    weekly_report: {
      title: '📈 Weekly Summary',
      message: `This week: ${currencySymbol}${context.weeklySpent}. Daily average: ${currencySymbol}${context.dailyAverage.toFixed(2)}. Keep it up!`,
      priority: 2
    },
    category_insights: {
      title: '💡 Spending Insights',
      message: `Your top spending category is ${context.topCategory}. You're ${context.monthlyProgress.toFixed(1)}% through the month.`,
      priority: 2
    },
    savings_update: {
      title: '🎯 Goal Progress',
      message: `You have ${context.goals.length} active savings goals. Your spending control helps you reach them faster!`,
      priority: 3
    },
    goal_progress: {
      title: '🌟 Savings Update',
      message: `Making progress on your goals! Keep tracking expenses to stay on target.`,
      priority: 3
    }
  };

  const notification = notifications[type];
  
  return {
    ...notification,
    reasoning: `Fallback ${type} notification for user ${user.id}`
  };
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CNY': '¥', 
    'KRW': '₩', 'INR': '₹', 'BRL': 'R$', 'MXN': '$', 'CAD': 'C$',
    'AUD': 'A$', 'CHF': 'CHF', 'SGD': 'S$', 'HKD': 'HK$'
  };
  return symbols[currency] || currency;
}
