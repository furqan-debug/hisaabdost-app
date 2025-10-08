import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SentInvitations() {
  const { user } = useAuth();

  const { data: sentInvitations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['sent-invitations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('family_invitations')
        .select('*, families(name)')
        .eq('invited_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
          Loading sent invitations...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load sent invitations. 
          <Button variant="link" size="sm" onClick={() => refetch()} className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (sentInvitations.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Mail className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpiringSoon = new Date(expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/30">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/30">Rejected</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return (
          <Badge className={isExpiringSoon ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' : 'bg-blue-500/10 text-blue-700 border-blue-500/30'}>
            {isExpiringSoon ? 'Expiring Soon' : 'Pending'}
          </Badge>
        );
    }
  };

  return (
    <Card className="border-muted shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invitations You've Sent
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {sentInvitations.length} {sentInvitations.length === 1 ? 'invitation' : 'invitations'} sent
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {sentInvitations.map((invitation) => {
            const familyName = invitation.families?.name || 'Unknown Family';
            const expiresAt = new Date(invitation.expires_at);
            const timeUntilExpiry = formatDistanceToNow(expiresAt, { addSuffix: true });

            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-1">
                    {getStatusIcon(invitation.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {invitation.member_name && (
                          <p className="font-semibold text-foreground truncate">{invitation.member_name}</p>
                        )}
                        <p className={`${invitation.member_name ? 'text-sm' : 'font-medium'} text-muted-foreground truncate`}>
                          {invitation.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Invited to <span className="font-medium text-foreground">{familyName}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {invitation.status === 'pending' ? (
                            <>Expires {timeUntilExpiry}</>
                          ) : (
                            <>Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}</>
                          )}
                        </p>
                      </div>
                      {getStatusBadge(invitation.status, invitation.expires_at)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
