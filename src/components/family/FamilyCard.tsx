import { Family } from '@/types/family';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, MoreVertical, Settings, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FamilyCardProps {
  family: Family;
  isActive: boolean;
  memberCount: number;
  onSwitch: () => void;
  onSettings?: () => void;
  onLeave?: () => void;
}

export function FamilyCard({ 
  family, 
  isActive, 
  memberCount,
  onSwitch,
  onSettings,
  onLeave
}: FamilyCardProps) {
  const initials = family.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasActions = onSettings || onLeave;

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'ring-2 ring-primary shadow-lg' 
          : 'hover:shadow-md hover:border-primary/50'
      }`}
      onClick={onSwitch}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Family Avatar */}
          <div className="relative">
            <Avatar className={`h-12 w-12 ring-2 transition-all ${
              isActive ? 'ring-primary' : 'ring-muted group-hover:ring-primary/50'
            }`}>
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-primary rounded-full ring-2 ring-background" />
            )}
          </div>

          {/* Family Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base truncate ${
                  isActive ? 'text-primary' : ''
                }`}>
                  {family.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(family.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {/* Action Menu */}
              {hasActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background">
                    {onSettings && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSettings(); }}>
                        <Settings className="h-4 w-4 mr-2" />
                        Delete Family
                      </DropdownMenuItem>
                    )}
                    {onLeave && (
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onLeave(); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Leave Family
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Stats & Badges */}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary" className="gap-1.5 px-2 py-0.5 text-xs font-medium">
                <Users className="h-3 w-3" />
                {memberCount}
              </Badge>
              {isActive && (
                <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-2 py-0.5 text-xs font-medium">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  Active
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
