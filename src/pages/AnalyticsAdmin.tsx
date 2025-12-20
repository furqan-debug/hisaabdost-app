import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity, 
  Users, 
  MousePointerClick, 
  TrendingUp,
  Clock,
  AlertCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { RealTimeActivityFeed } from '@/components/analytics-admin/RealTimeActivityFeed';
import { EventCategoryChart } from '@/components/analytics-admin/EventCategoryChart';
import { UserFunnelChart } from '@/components/analytics-admin/UserFunnelChart';
import { TopEventsTable } from '@/components/analytics-admin/TopEventsTable';
import { DailyActiveUsers } from '@/components/analytics-admin/DailyActiveUsers';

export default function AnalyticsAdmin() {
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d'>('7d');
  
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

  // Fetch summary stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats', dateRange],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from('user_events')
        .select('id, user_id, session_id, event_name, event_category, created_at')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());
      
      if (error) throw error;

      const totalEvents = events?.length || 0;
      const uniqueUsers = new Set(events?.filter(e => e.user_id).map(e => e.user_id)).size;
      const uniqueSessions = new Set(events?.map(e => e.session_id)).size;
      const pageViews = events?.filter(e => e.event_name === 'page_view').length || 0;
      const interactions = events?.filter(e => e.event_category === 'interaction').length || 0;
      const errors = events?.filter(e => e.event_category === 'error').length || 0;

      return {
        totalEvents,
        uniqueUsers,
        uniqueSessions,
        pageViews,
        interactions,
        errors,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time user behavior and engagement metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={dateRange === 'today' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setDateRange('today')}
            >
              Today
            </Badge>
            <Badge 
              variant={dateRange === '7d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setDateRange('7d')}
            >
              7 Days
            </Badge>
            <Badge 
              variant={dateRange === '30d' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setDateRange('30d')}
            >
              30 Days
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            title="Total Events"
            value={stats?.totalEvents || 0}
            icon={<Zap className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Unique Users"
            value={stats?.uniqueUsers || 0}
            icon={<Users className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Sessions"
            value={stats?.uniqueSessions || 0}
            icon={<Clock className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Page Views"
            value={stats?.pageViews || 0}
            icon={<Activity className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Interactions"
            value={stats?.interactions || 0}
            icon={<MousePointerClick className="h-4 w-4" />}
            loading={statsLoading}
          />
          <StatCard
            title="Errors"
            value={stats?.errors || 0}
            icon={<AlertCircle className="h-4 w-4" />}
            loading={statsLoading}
            variant="error"
          />
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="realtime" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="realtime">Real-Time</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <RealTimeActivityFeed />
              <EventCategoryChart dateRange={dateRange} />
            </div>
          </TabsContent>

          <TabsContent value="engagement" className="space-y-4">
            <DailyActiveUsers dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="funnel" className="space-y-4">
            <UserFunnelChart dateRange={dateRange} />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <TopEventsTable dateRange={dateRange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
  variant?: 'default' | 'error';
}

function StatCard({ title, value, icon, loading, variant = 'default' }: StatCardProps) {
  return (
    <Card className={variant === 'error' && value > 0 ? 'border-destructive/50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className={`${variant === 'error' && value > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {icon}
          </span>
        </div>
        <div className="mt-2">
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className={`text-2xl font-bold ${variant === 'error' && value > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {value.toLocaleString()}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
