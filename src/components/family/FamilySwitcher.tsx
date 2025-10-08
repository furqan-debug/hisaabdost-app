import { Users, ChevronDown, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import { useNavigate } from 'react-router-dom';

export function FamilySwitcher() {
  const { currentFamily, isPersonalMode, userFamilies, switchToFamily, switchToPersonal } = useFamilyContext();
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {isPersonalMode ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {isPersonalMode ? 'Personal' : currentFamily?.name || 'Family'}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Context</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={async () => {
          await switchToPersonal();
          navigate('/app/dashboard');
        }} className="gap-2">
          <User className="h-4 w-4" />
          Personal
          {isPersonalMode && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
        </DropdownMenuItem>
        
        {userFamilies.length > 0 && <DropdownMenuSeparator />}
        
        {userFamilies.map((family) => (
          <DropdownMenuItem
            key={family.id}
            onClick={() => switchToFamily(family.id)}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            {family.name}
            {currentFamily?.id === family.id && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/app/family')} className="gap-2">
          <Users className="h-4 w-4" />
          Manage Families...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
