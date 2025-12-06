import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { addDays, format, differenceInDays } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate CRON_SECRET for authorization
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('Authorization');
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error('❌ Unauthorized access attempt to scheduled-push-notifications');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type } = await req.json().catch(() => ({}));
    const now = new Date();

    console.log('🔔 Processing scheduled notifications, type:', type || 'all');

    // Get all users with push tokens
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, notification_preferences, notification_timezone, preferred_currency')
      .eq('notifications_enabled', true);

    if (usersError) throw usersError;

    const results = { analyzed: 0, notificationsSent: 0, errors: 0 };

    for (const user of users || []) {
      try {
        const prefs = user.notification_preferences || {};
        const notifications: NotificationPayload[] = [];

        // Get user's push tokens
        const { data: tokens } = await supabase
          .from('user_device_tokens')
          .select('device_token, platform')
          .eq('user_id', user.id);

        if (!tokens || tokens.length === 0) continue;

        // 1. Check Loan Reminders
        if (prefs.loanReminders !== false) {
          const { data: loans } = await supabase
            .from('loans')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .not('due_date', 'is', null);

          for (const loan of loans || []) {
            const dueDate = new Date(loan.due_date);
            const daysUntilDue = differenceInDays(dueDate, now);
            const reminderDays = prefs.loanReminderDays || [7, 3, 1];

            if (reminderDays.includes(daysUntilDue)) {
              const symbol = user.preferred_currency === 'INR' ? '₹' : '$';
              const urgency = daysUntilDue === 0 ? '🚨 Due Today!' : daysUntilDue === 1 ? '⏰ Due Tomorrow!' : `⏰ ${daysUntilDue} Days Left`;
              
              notifications.push({
                title: loan.loan_type === 'i_gave' ? '💰 Loan Collection Reminder' : '⚠️ Loan Payment Due',
                body: `${urgency}: ${loan.loan_type === 'i_gave' ? 'Collect' : 'Pay'} ${symbol}${loan.amount} ${loan.loan_type === 'i_gave' ? 'from' : 'to'} ${loan.person_name}`,
                data: { type: 'loan_reminder', loanId: loan.id, route: '/app/loans' },
                priority: daysUntilDue <= 1 ? 'critical' : daysUntilDue <= 3 ? 'high' : 'medium',
              });
            }
          }
        }

        // 2. Check Budget Thresholds
        if (prefs.budgetAlerts !== false) {
          const currentMonth = format(now, 'yyyy-MM');
          const { data: budgets } = await supabase
            .from('budgets')
            .select('*')
            .eq('user_id', user.id)
            .eq('period', currentMonth);

          const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', `${currentMonth}-01`);

          for (const budget of budgets || []) {
            const categoryExpenses = expenses?.filter(e => e.category === budget.category) || [];
            const spent = categoryExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
            const percentage = (spent / Number(budget.amount)) * 100;
            const thresholds = prefs.budgetThresholds || [50, 60, 70, 80, 90, 100];

            // Check if we should notify for this threshold
            const crossedThreshold = thresholds.find((t: number) =>
              percentage >= t && percentage < t + 5 // 5% tolerance to avoid duplicate notifications
            );

            if (crossedThreshold) {
              const symbol = user.preferred_currency === 'INR' ? '₹' : '$';
              const remaining = Number(budget.amount) - spent;
              const emoji = percentage >= 100 ? '❌' : percentage >= 90 ? '🔴' : percentage >= 80 ? '🟠' : percentage >= 70 ? '🟡' : '⚠️';
              
              notifications.push({
                title: `${emoji} Budget Alert: ${budget.category}`,
                body: percentage >= 100 
                  ? `Exceeded by ${symbol}${Math.abs(remaining).toFixed(0)}! Total spent: ${symbol}${spent.toFixed(0)}`
                  : `${percentage.toFixed(0)}% used (${symbol}${spent.toFixed(0)}/${symbol}${budget.amount}). ${symbol}${remaining.toFixed(0)} remaining`,
                data: { type: 'budget_alert', category: budget.category, route: '/app/dashboard' },
                priority: percentage >= 90 ? 'critical' : percentage >= 70 ? 'high' : 'medium',
              });
            }
          }
        }

        // 3. Check Overspending
        if (prefs.overspendingAlerts !== false && type !== 'weekly_report') {
          const { data: todayExpenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .eq('date', format(now, 'yyyy-MM-dd'));

          const { data: recentExpenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', format(addDays(now, -7), 'yyyy-MM-dd'));

          const todayTotal = todayExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          const dailyAverage = (recentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0) / 7;

          if (todayTotal > dailyAverage * 3) {
            const symbol = user.preferred_currency === 'INR' ? '₹' : '$';
            notifications.push({
              title: '⚠️ High Spending Alert',
              body: `Today's spending (${symbol}${todayTotal.toFixed(0)}) is 3x your daily average (${symbol}${dailyAverage.toFixed(0)}). Review your expenses?`,
              data: { type: 'overspending', route: '/app/expenses' },
              priority: 'high',
            });
          }
        }

        // 4. Check Goal Deadlines
        if (prefs.goalReminders !== false) {
          const { data: goals } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
            .not('deadline', 'is', null);

          for (const goal of goals || []) {
            const deadline = new Date(goal.deadline);
            const daysUntilDeadline = differenceInDays(deadline, now);

            if ([30, 14, 7, 3, 1].includes(daysUntilDeadline)) {
              const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
              const symbol = user.preferred_currency === 'INR' ? '₹' : '$';
              
              notifications.push({
                title: '🎯 Goal Deadline Reminder',
                body: `"${goal.title}" deadline in ${daysUntilDeadline} days. Progress: ${progress.toFixed(0)}% (${symbol}${goal.current_amount}/${symbol}${goal.target_amount})`,
                data: { type: 'goal_reminder', goalId: goal.id, route: '/app/goals' },
                priority: daysUntilDeadline <= 3 ? 'high' : 'medium',
              });
            }
          }
        }

        // 5. Daily Summary (only if type is daily_summary)
        if (type === 'daily_summary' && prefs.dailySummary !== false) {
          const { data: todayExpenses } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .eq('date', format(now, 'yyyy-MM-dd'));

          const todayTotal = todayExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          const symbol = user.preferred_currency === 'INR' ? '₹' : '$';

          notifications.push({
            title: '📊 Today\'s Financial Summary',
            body: `Spent ${symbol}${todayTotal.toFixed(0)} across ${todayExpenses?.length || 0} transactions`,
            data: { type: 'daily_summary', route: '/app/dashboard' },
            priority: 'low',
          });
        }

        // 6. Weekly Report (only if type is weekly_report)
        if (type === 'weekly_report' && prefs.weeklySummary !== false) {
          const weekStart = addDays(now, -7);
          const { data: weekExpenses } = await supabase
            .from('expenses')
            .select('amount, category')
            .eq('user_id', user.id)
            .gte('date', format(weekStart, 'yyyy-MM-dd'));

          const weekTotal = weekExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
          const symbol = user.preferred_currency === 'INR' ? '₹' : '$';

          // Find top category
          const categoryTotals = weekExpenses?.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
            return acc;
          }, {} as Record<string, number>);
          const topCategory = Object.entries(categoryTotals || {}).sort((a, b) => b[1] - a[1])[0];

          notifications.push({
            title: '📈 Weekly Financial Report',
            body: `Spent ${symbol}${weekTotal.toFixed(0)} this week${topCategory ? `. Top: ${topCategory[0]} (${symbol}${topCategory[1].toFixed(0)})` : ''}`,
            data: { type: 'weekly_report', route: '/app/dashboard' },
            priority: 'low',
          });
        }

        // Send notifications via Firebase
        const firebaseServiceAccount = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
        
        if (!firebaseServiceAccount) {
          console.error('❌ FIREBASE_SERVICE_ACCOUNT not configured');
          results.errors++;
          continue;
        }

        try {
          const serviceAccount = JSON.parse(firebaseServiceAccount);
          console.log("🔐 Starting FCM OAuth flow for scheduled notifications...");
          
          // Build JWT and exchange for OAuth access token
          const jwt = await buildServiceAccountJWT(serviceAccount);
          const accessToken = await exchangeForAccessToken(jwt);
          console.log("✅ OAuth access token obtained");
          
          for (const notification of notifications) {
            for (const tokenData of tokens) {
              try {
                const tokenPreview = tokenData.device_token.substring(0, 20) + "...";
                console.log(`📤 Sending scheduled notification to ${tokenPreview}`);


                const fcmResponse = await fetch(
                  `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
                  {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      message: {
                        token: tokenData.device_token,
                        notification: {
                          title: notification.title,
                          body: notification.body,
                        },
                        data: notification.data || {},
                        android: {
                          priority: notification.priority === 'critical' ? 'high' : 'normal',
                          notification: {
                            sound: 'default',
                            channel_id: notification.data?.type || 'default',
                          },
                        },
                      },
                    }),
                  }
                );

                const fcmResult = await fcmResponse.json();
                console.log(`📊 FCM response: ${fcmResponse.status}`, fcmResult);

                if (fcmResponse.ok) {
                  console.log(`✅ Scheduled notification sent to ${tokenPreview}`);
                  results.notificationsSent++;
                } else {
                  console.error(`❌ FCM error for ${tokenPreview}:`, fcmResult);
                  results.errors++;
                }
              } catch (error) {
                console.error('❌ Error sending notification:', error);
                results.errors++;
              }
            }
          }
        } catch (error) {
          console.error('❌ Error in scheduled notification Firebase flow:', error);
          results.errors++;
        }

        results.analyzed++;
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        results.errors++;
      }
    }

    console.log('✅ Notification processing complete:', results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in scheduled notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function buildServiceAccountJWT(serviceAccount: any): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerBase64 = btoa(JSON.stringify(header));
  const payloadBase64 = btoa(JSON.stringify(payload));
  const data = `${headerBase64}.${payloadBase64}`;

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encoder.encode(data));
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${data}.${signatureBase64}`;
}

async function exchangeForAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OAuth token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
