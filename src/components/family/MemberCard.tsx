import { FamilyMember } from '@/types/family';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Shield, User, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MemberCardProps {
  member: FamilyMember;
  canRemove: boolean;
  onRemove: () => void;
  isCurrentUser: boolean;
}

export function MemberCard({ member, canRemove, onRemove, isCurrentUser }: MemberCardProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3.5 w-3.5" />;
      case 'admin':
        return <Shield className="h-3.5 w-3.5" />;
      default:
        return <User className="h-3.5 w-3.5" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'admin':
        return 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const displayName = member.profile?.display_name || member.profile?.full_name || 'Unknown User';
  const initials = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="group hover:shadow-lg hover:border-primary/20 transition-all duration-300 backdrop-blur-sm border-muted">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-border group-hover:ring-primary/50 group-hover:scale-105 transition-all duration-300">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary font-bold text-base">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <p className="font-semibold text-base truncate">
                {displayName}
              </p>
              {isCurrentUser && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                  You
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
            </p>
          </div>

          {/* Role Badge & Actions */}
          <div className="flex items-center gap-2">
            <Badge className={`gap-1.5 px-3 py-1.5 font-medium ${getRoleBadgeClass(member.role)}`}>
              {getRoleIcon(member.role)}
              <span className="capitalize">{member.role}</span>
            </Badge>
            {canRemove && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive hover:scale-110"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
