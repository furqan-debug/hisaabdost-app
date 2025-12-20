import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface UserFunnelChartProps {
  dateRange: 'today' | '7d' | '30d';
}

const FUNNEL_STEPS = [
  { event: 'session_start', label: 'Sessions Started', color: 'bg-primary' },
  { event: 'page_view', label: 'Page Views', color: 'bg-chart-2' },
  { event: 'signup_completed', label: 'Signups', color: 'bg-chart-3' },
  { event: 'onboarding_completed', label: 'Onboarding Done', color: 'bg-chart-4' },
  { event: 'expense_added', label: 'First Expense', color: 'bg-green-500' },
];

export function UserFunnelChart({ dateRange }: UserFunnelChartProps) {
  const getDateRange = () => {
    const end = endOfDay(new Date());
    let start: Date;
    
    switch (dateRange) {
      case 'today':
        start = startOfDay(new Date());
        break;
      case '7d':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case '30d':
        start = startOfDay(subDays(new Date(), 30));
        break;
    }
    
    return { start, end };
  };

  const { start, end } = getDateRange();

  const { data, isLoading } = useQuery({
    queryKey: ['user-funnel', dateRange],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('user_events')
        .select('event_name, user_id, session_id')
        .in('event_name', FUNNEL_STEPS.map(s => s.event))
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (error) throw error;

      // Count unique users/sessions for each step
      const counts: Record<string, number> = {};
      FUNNEL_STEPS.forEach(step => {
        const stepEvents = events?.filter(e => e.event_name === step.event) || [];
        // Use unique sessions for session-based events, unique users for others
        if (step.event === 'session_start' || step.event === 'page_view') {
          counts[step.event] = new Set(stepEvents.map(e => e.session_id)).size;
        } else {
          counts[step.event] = new Set(stepEvents.filter(e => e.user_id).map(e => e.user_id)).size;
        }
      });

      return FUNNEL_STEPS.map(step => ({
        ...step,
        count: counts[step.event] || 0,
      }));
    },
    refetchInterval: 30000,
  });

  const maxCount = data ? Math.max(...data.map(d => d.count), 1) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          User Funnel
        </CardTitle>
        <CardDescription>
          Track user progression through key milestones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))
        ) : (
          data?.map((step, index) => {
            const percentage = (step.count / maxCount) * 100;
            const conversionRate = index > 0 && data[0].count > 0
              ? ((step.count / data[0].count) * 100).toFixed(1)
              : '100';

            return (
              <div key={step.event} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{step.count.toLocaleString()}</span>
                    {index > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({conversionRate}%)
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className="h-6"
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
