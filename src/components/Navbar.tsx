import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import SettingsSidebar from "./SettingsSidebar";
import { useUserProfile } from "@/hooks/useUserProfile";
const Navbar = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    getDisplayName,
    getUsername
  } = useUserProfile(user);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleLogoClick = () => {
    navigate('/app/dashboard');
  };
  return <nav style={{
    paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : '0',
    top: 0
  }} className="fixed -top-0.5 left-0 right-0 z-50 bg-background/95 dark:bg-card/95 backdrop-blur-lg border-b-2 border-border/60 dark:border-border dark:shadow-xl dark:shadow-black/40 py-0">
      <div className="flex h-12 items-center justify-between px-2 sm:px-3 lg:px-4 max-w-6xl mx-auto mt-[10px] mb-[10px] py-[2px]">
        {/* Left: Logo and Title */}
        <div onClick={handleLogoClick} className="flex items-center cursor-pointer hover:opacity-90 transition-all duration-200 flex-1 justify-start mx-1 my-[3px] px-2 py-1 rounded-lg hover:bg-accent/10 dark:hover:bg-accent/20">
          <div className="h-9 w-9 mr-2 rounded-lg bg-primary/10 dark:bg-white p-1.5 ring-2 ring-border/50 dark:ring-white/20 dark:shadow-lg dark:shadow-primary/20">
            <img src="/lovable-uploads/865d9039-b9ca-4d0f-9e62-7321253ffafa.png" alt="Hisaab Dost logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-sm text-foreground dark:text-foreground leading-tight">
              Hisaab Dost
            </h2>
            <span className="text-xs text-foreground/70 dark:text-foreground/90 font-semibold leading-none">
              Personal Finance
            </span>
          </div>
        </div>
        
        {/* Right: Notification and User Avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationBell />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-accent/10 dark:hover:bg-accent/20">
                <Avatar className="h-7 w-7 ring-1 ring-border/50">
                  <AvatarImage src="https://images.unsplash.com/photo-1501286353178-1ec881214838?w=100&h=100&fit=crop&crop=face" alt={user?.email || "User"} />
                  <AvatarFallback className="text-xs">
                    🐵
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>;
};
export default Navbar;