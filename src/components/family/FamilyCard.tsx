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

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border backdrop-blur-sm ${
        isActive 
          ? 'ring-2 ring-primary shadow-lg bg-gradient-to-br from-primary/5 via-primary/3 to-background' 
          : 'hover:border-primary/30 bg-card/50'
      }`}
      onClick={onSwitch}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Family Avatar */}
          <div className="relative">
            <Avatar className={`h-16 w-16 ring-2 transition-all duration-300 ${
              isActive ? 'ring-primary shadow-lg shadow-primary/20' : 'ring-border group-hover:ring-primary/50'
            }`}>
              <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary font-bold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isActive && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full ring-4 ring-background shadow-lg">
                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75" />
              </div>
            )}
          </div>

          {/* Family Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg truncate transition-colors ${
                  isActive ? 'text-primary' : ''
                }`}>
                  {family.name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  Created {new Date(family.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {/* Action Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onSettings && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSettings(); }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                  )}
                  {onLeave && (
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); onLeave(); }}
                      className="text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Family
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats & Badges */}
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 font-medium backdrop-blur-sm">
                <Users className="h-3.5 w-3.5" />
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Badge>
              {isActive && (
                <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 gap-1.5 px-2.5 py-1 font-medium shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
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
