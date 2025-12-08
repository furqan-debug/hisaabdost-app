import { useLocation, Link } from "react-router-dom";
import { Home, Receipt, Wallet, MoreHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreSheet } from "./navigation/MoreSheet";
import { useFinny } from "@/components/finny";
import { usePlatform } from "@/hooks/usePlatform";
import { lightImpact, selectionChanged } from "@/utils/haptics";
import { motion } from "framer-motion";

const navItems = [{
  icon: Home,
  label: "Home",
  path: "/app/dashboard"
}, {
  icon: Receipt,
  label: "Expenses",
  path: "/app/expenses"
}, {
  icon: Wallet,
  label: "Budget",
  path: "/app/budget"
}, {
  icon: MoreHorizontal,
  label: "More",
  path: null
}];

export function BottomNavigation() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { isIOS } = usePlatform();
  const [mounted, setMounted] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const { openChat } = useFinny();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNavClick = async () => {
    await selectionChanged();
  };

  const handleFabClick = async () => {
    await lightImpact();
    openChat();
  };

  const handleMoreClick = async () => {
    await lightImpact();
    setMoreSheetOpen(true);
  };
  
  if (!isMobile || !mounted) return null;
  
  return (
    <>
      <div className="fixed left-0 right-0 bottom-0 z-50 w-full overflow-visible" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className={cn(
          "relative backdrop-blur-xl border-t border-border/30 overflow-visible",
          isIOS 
            ? "bg-background/80" 
            : "bg-background shadow-lg shadow-black/5"
        )}>
          
          {/* Finny AI FAB - Absolutely positioned above navbar */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-1/2 z-10">
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleFabClick}
                size="icon"
                className="h-16 w-16 rounded-full bg-white dark:bg-white shadow-2xl shadow-primary/50 hover:shadow-primary/70 active:ring-4 active:ring-primary/40 transition-all duration-200 border-4 border-primary/30 dark:border-primary/50 p-3"
              >
                <img src="/lovable-uploads/865d9039-b9ca-4d0f-9e62-7321253ffafa.png" alt="Finny AI" className="w-full h-full object-contain" />
              </Button>
            </motion.div>
          </div>

          <div className="relative grid grid-cols-5 h-16 items-center max-w-[480px] mx-auto px-2 overflow-visible">
            {/* First 2 items: Home, Expenses */}
            {navItems.slice(0, 2).map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Link 
                  key={item.label} 
                  to={item.path!} 
                  onClick={handleNavClick}
                  className="flex items-center justify-center min-h-[48px] min-w-[48px]"
                >
                  <motion.div 
                    whileTap={{ scale: 0.9 }}
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 w-full py-2 transition-colors duration-200",
                      isActive && "scale-105"
                    )}
                  >
                    <item.icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className={cn(
                      "text-[10px] font-medium leading-none transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="navIndicator"
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" 
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
            
            {/* Center column - visual space for FAB */}
            <div className="flex items-center justify-center" />
            
            {/* Last 2 items: Budget, More */}
            {navItems.slice(2, 4).map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <div key={item.label} className="flex items-center justify-center min-h-[48px] min-w-[48px]">
                  {item.path ? (
                    <Link 
                      to={item.path} 
                      onClick={handleNavClick}
                      className="flex items-center justify-center w-full"
                    >
                      <motion.div 
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "relative flex flex-col items-center justify-center gap-1 w-full py-2 transition-colors duration-200",
                          isActive && "scale-105"
                        )}
                      >
                        <item.icon 
                          size={22} 
                          strokeWidth={isActive ? 2.5 : 2} 
                          className={cn(
                            "transition-colors duration-200",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className={cn(
                          "text-[10px] font-medium leading-none transition-colors duration-200",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}>
                          {item.label}
                        </span>
                        {isActive && (
                          <motion.div 
                            layoutId="navIndicator"
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" 
                          />
                        )}
                      </motion.div>
                    </Link>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={handleMoreClick}
                      className="flex items-center justify-center w-full"
                    >
                      <div className="relative flex flex-col items-center justify-center gap-1 w-full py-2 transition-colors duration-200">
                        <item.icon 
                          size={22} 
                          strokeWidth={2} 
                          className="text-muted-foreground transition-colors duration-200"
                        />
                        <span className="text-[10px] font-medium leading-none text-muted-foreground transition-colors duration-200">
                          {item.label}
                        </span>
                      </div>
                    </motion.button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <MoreSheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen} />
    </>
  );
}
