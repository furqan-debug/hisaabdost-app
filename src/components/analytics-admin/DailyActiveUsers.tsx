import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { subDays, format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

interface DailyActiveUsersProps {
  dateRange: 'today' | '7d' | '30d';
}

export function DailyActiveUsers({ dateRange }: DailyActiveUsersProps) {
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
    queryKey: ['daily-active-users', dateRange],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('user_events')
        .select('user_id, session_id, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (error) throw error;

      // Generate all days in range
      const days = eachDayOfInterval({ start, end });
      
      // Group by day
      const dailyData = days.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const dayEvents = events?.filter(e => {
          const eventDate = new Date(e.created_at);
          return eventDate >= dayStart && eventDate <= dayEnd;
        }) || [];

        const uniqueUsers = new Set(dayEvents.filter(e => e.user_id).map(e => e.user_id)).size;
        const uniqueSessions = new Set(dayEvents.map(e => e.session_id)).size;

        return {
          date: format(day, 'MMM dd'),
          users: uniqueUsers,
          sessions: uniqueSessions,
        };
      });

      return dailyData;
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Daily Active Users & Sessions
        </CardTitle>
        <CardDescription>
          Unique users and sessions per day
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Unique Users"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorUsers)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorSessions)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
