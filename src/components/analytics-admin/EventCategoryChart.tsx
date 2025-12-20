import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart as PieChartIcon } from 'lucide-react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface EventCategoryChartProps {
  dateRange: 'today' | '7d' | '30d';
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--destructive))',
];

export function EventCategoryChart({ dateRange }: EventCategoryChartProps) {
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
    queryKey: ['event-categories', dateRange],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('user_events')
        .select('event_category')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (error) throw error;

      // Count by category
      const counts: Record<string, number> = {};
      events?.forEach((event) => {
        counts[event.event_category] = (counts[event.event_category] || 0) + 1;
      });

      return Object.entries(counts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
    refetchInterval: 30000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Events by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
