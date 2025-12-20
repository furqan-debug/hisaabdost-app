import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity, User, MousePointer, Navigation, Zap, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserEvent {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  session_id: string;
  event_name: string;
  event_category: string;
  page_path: string | null;
  created_at: string;
  event_data: Record<string, unknown>;
}

export function RealTimeActivityFeed() {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Fetch initial events
    const fetchInitialEvents = async () => {
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (!error && data) {
        setEvents(data as UserEvent[]);
      }
    };

    fetchInitialEvents();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('realtime-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_events',
        },
        (payload) => {
          setEvents((prev) => [payload.new as UserEvent, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return <Navigation className="h-3 w-3" />;
      case 'interaction':
        return <MousePointer className="h-3 w-3" />;
      case 'feature':
        return <Zap className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Activity className="h-3 w-3" />;
    }
  };

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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Live Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Live' : 'Paused'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {events.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for events...</p>
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="mt-0.5">
                    <Badge variant={getCategoryColor(event.event_category)} className="gap-1">
                      {getCategoryIcon(event.event_category)}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {event.event_name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <User className="h-3 w-3" />
                      <span className="truncate">
                        {event.user_id?.slice(0, 8) || event.anonymous_id?.slice(0, 8) || 'Anonymous'}
                      </span>
                      {event.page_path && (
                        <>
                          <span>•</span>
                          <span className="truncate">{event.page_path}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
