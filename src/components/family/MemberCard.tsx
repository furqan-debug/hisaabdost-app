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
export function MemberCard({
  member,
  canRemove,
  onRemove,
  isCurrentUser
}: MemberCardProps) {
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
        return 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/40 shadow-sm';
      case 'admin':
        return 'bg-blue-500/15 text-blue-900 dark:text-blue-300 border-blue-500/40 shadow-sm';
      default:
        return 'bg-muted/80 text-foreground border-border shadow-sm';
    }
  };
  const displayName = member.profile?.display_name || member.profile?.full_name || 'Unknown User';
  const initials = displayName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  return <Card className="group hover:shadow-md hover:border-primary/50 transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative px-[3px] py-[3px]">
            <Avatar className="h-11 w-11 ring-2 ring-muted group-hover:ring-primary/50 transition-all">
              <AvatarImage src={member.profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Member Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-sm truncate">
                {displayName}
              </p>
              {isCurrentUser && <Badge variant="secondary" className="text-xs px-1.5 py-0 font-medium">
                  You
                </Badge>}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(member.joined_at), {
              addSuffix: true
            })}
            </p>
          </div>

          {/* Role Badge & Actions */}
          <div className="flex items-center gap-2">
            <Badge className={`gap-1 px-2 py-1 text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
              {getRoleIcon(member.role)}
              <span className="capitalize">{member.role}</span>
            </Badge>
            {canRemove && <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>}
          </div>
        </div>
      </CardContent>
    </Card>;
}