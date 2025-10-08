import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePendingInvitations } from "@/hooks/usePendingInvitations";
import { Mail, Clock, Check, X, Loader2, RefreshCw, AlertCircle, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const PendingInvitations = () => {
  console.log("🔔 PendingInvitations component mounted");
  const { invitations, isLoading, error, refetch, acceptInvitation, rejectInvitation, isAccepting, isRejecting } = usePendingInvitations();
  
  console.log("🔔 PendingInvitations state:", { invitationsCount: invitations?.length, isLoading, error });

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading invitations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("🔔 Error in PendingInvitations:", error);
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Error Loading Invitations</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load invitations"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    console.log("🔔 No pending invitations to display");
    return null;
  }

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Pending Invitations
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        {invitations.length > 1 && (
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            <Users className="h-4 w-4 text-primary" />
            <AlertDescription>
              You have {invitations.length} pending family invitations waiting for your response
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {invitations.map((invitation) => {
            const expiresAt = new Date(invitation.expires_at);
            const isExpiringSoon = expiresAt < new Date(Date.now() + 24 * 60 * 60 * 1000);
            const timeUntilExpiry = formatDistanceToNow(expiresAt, { addSuffix: true });
            
            const familyInitials = (invitation.family_name || 'F')
              .split(' ')
              .map(word => word[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={invitation.id}
                className="group flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/30"
              >
                {/* Family Avatar */}
                <Avatar className="h-12 w-12 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                    {familyInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    {invitation.member_name && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Join as <span className="font-semibold text-foreground">{invitation.member_name}</span>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{invitation.inviter_name || 'Someone'}</span> invited you to join
                    </p>
                    <p className="text-xl font-bold text-primary mt-1">
                      {invitation.family_name || 'a family'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className={`h-4 w-4 ${isExpiringSoon ? 'text-amber-600' : 'text-muted-foreground'}`} />
                    <span className={isExpiringSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                      Expires {timeUntilExpiry}
                    </span>
                    {isExpiringSoon && (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                        Expiring Soon!
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => acceptInvitation(invitation.id)}
                      disabled={isAccepting || isRejecting}
                      className="flex-1"
                    >
                      {isAccepting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => rejectInvitation(invitation.id)}
                      disabled={isAccepting || isRejecting}
                      className="flex-1"
                    >
                      {isRejecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
