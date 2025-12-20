import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ListOrdered } from 'lucide-react';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface TopEventsTableProps {
  dateRange: 'today' | '7d' | '30d';
}

export function TopEventsTable({ dateRange }: TopEventsTableProps) {
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
    queryKey: ['top-events', dateRange],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('user_events')
        .select('event_name, event_category, user_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (error) throw error;

      // Count events and unique users
      const eventStats: Record<string, { count: number; users: Set<string>; category: string }> = {};
      
      events?.forEach((event) => {
        if (!eventStats[event.event_name]) {
          eventStats[event.event_name] = {
            count: 0,
            users: new Set(),
            category: event.event_category,
          };
        }
        eventStats[event.event_name].count++;
        if (event.user_id) {
          eventStats[event.event_name].users.add(event.user_id);
        }
      });

      return Object.entries(eventStats)
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          uniqueUsers: stats.users.size,
          category: stats.category,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    },
    refetchInterval: 30000,
  });

  const getCategoryColor = (category: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (category) {
      case 'navigation':
        return 'secondary';
      case 'interaction':
        return 'default';
      case 'feature':
        return 'outline';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          Top Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Event Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Unique Users</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((event, index) => (
                <TableRow key={event.name}>
                  <TableCell className="font-medium text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="font-medium">
                    {event.name.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryColor(event.category)}>
                      {event.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {event.count.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {event.uniqueUsers.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              {(!data || data.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No events recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
