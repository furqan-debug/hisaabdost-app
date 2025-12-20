import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign,
  Palette,
  Sun,
  Moon,
  Monitor,
  History,
  LogOut,
  User,
  Settings,
  Wallet,
  ArrowRightLeft,
  Calendar,
  BookOpen,
  Tag,
  Shield,
  Lock,
  Key,
  RotateCcw,
} from "lucide-react";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { useTheme } from "next-themes";
import { useCurrency } from "@/hooks/use-currency";
import { useCarryoverPreferences } from "@/hooks/useCarryoverPreferences";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useSignOut } from "@/hooks/auth/useSignOut";
import { CURRENCY_OPTIONS, CurrencyCode } from "@/utils/currencyUtils";
import { toast } from "@/components/ui/use-toast";
import { useIncomeDate } from "@/hooks/useIncomeDate";
import { useUserProfile } from "@/hooks/useUserProfile";
interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onParentClose?: () => void;
}
const SettingsSidebar = ({ isOpen, onClose, onParentClose }: SettingsSidebarProps) => {
  const { theme, setTheme } = useTheme();
  const { currencyCode, setCurrencyCode, version } = useCurrency();
  const {
    incomeDate,
    setIncomeDate,
    isLoading: isLoadingIncomeDate,
    isUpdating: isUpdatingIncomeDate,
  } = useIncomeDate();
  const { preferences, updatePreferences, isUpdating } = useCarryoverPreferences();
  const { user } = useAuth();
  const { signOut } = useSignOut();
  const { getDisplayName, getUsername } = useUserProfile(user);
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const handleMonthlySummaryClick = () => {
    navigate("/app/history");
    onClose();
    onParentClose?.();
  };
  const handleManageFundsClick = () => {
    navigate("/app/manage-funds");
    onClose();
    onParentClose?.();
  };
  const handleAppGuideClick = () => {
    navigate("/app/guide");
    onClose();
    onParentClose?.();
  };
  const handleManageCategoriesClick = () => {
    navigate("/app/manage-categories");
    onClose();
    onParentClose?.();
  };
  const handleSignOut = async () => {
    await signOut();
    onClose();
  };
  const handleCarryoverToggle = (enabled: boolean) => {
    updatePreferences({
      auto_carryover_enabled: enabled,
    });
  };
  const handleCurrencyChange = async (value: string) => {
    console.log("Currency changing from:", currencyCode, "to:", value);
    try {
      const newCurrency = value as CurrencyCode;

      // Update the context first
      setCurrencyCode(newCurrency);

      // Show success toast
      toast({
        title: "Currency Updated",
        description: `Currency changed to ${value}`,
      });
      console.log("Currency change completed successfully");
    } catch (error) {
      console.error("Error changing currency:", error);
      toast({
        title: "Error",
        description: "Failed to change currency",
        variant: "destructive",
      });
    }
  };
  const handleIncomeDateChange = (value: string) => {
    const dateValue = Number(value);
    if (dateValue >= 1 && dateValue <= 31) {
      setIncomeDate(dateValue);
      toast({
        title: "Income Date Updated",
        description: `Income date set to ${dateValue}${dateValue === 1 ? "st" : dateValue === 2 ? "nd" : dateValue === 3 ? "rd" : "th"} of each month`,
      });
    }
  };

  // Generate ordinal suffix for date display
  const getOrdinalSuffix = (day: number) => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };
  console.log("Current currency code in settings:", currencyCode, "version:", version);
  return (
    <>
      <ChangePasswordDialog 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
      
      <div className="h-full flex flex-col bg-background">
      {/* Header with proper safe area handling */}
      <div className="px-4 py-4 border-b safe-area-top">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-0">
          {/* Currency */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-medium">Currency</h2>
            </div>
            <div className="ml-9">
              <p className="text-xs text-muted-foreground mb-2">Current: {currencyCode}</p>
              <Select
                value={currencyCode}
                onValueChange={handleCurrencyChange}
                key={`currency-select-${currencyCode}-${version}`}
              >
                <SelectTrigger className="w-full bg-background border-input">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-popover border shadow-lg z-[9999]">
                  {CURRENCY_OPTIONS.map((currency) => (
                    <SelectItem
                      key={currency.code}
                      value={currency.code}
                      className="cursor-pointer hover:bg-accent focus:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-muted-foreground min-w-[24px]">{currency.symbol}</span>
                        <span>{currency.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Income Settings - Improved UI/UX */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-medium">Income Settings</h2>
                <p className="text-xs text-muted-foreground">Configure your income cycle</p>
              </div>
            </div>

            <div className="ml-9 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="income-date-select" className="text-sm font-medium text-foreground">
                    Your income day
                  </label>
                  <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                    {incomeDate}
                    {getOrdinalSuffix(incomeDate)} of month
                  </span>
                </div>

                <Select
                  value={incomeDate.toString()}
                  onValueChange={handleIncomeDateChange}
                  disabled={isLoadingIncomeDate || isUpdatingIncomeDate}
                >
                  <SelectTrigger className="w-full bg-background border-input hover:border-ring transition-colors">
                    <SelectValue placeholder="Select income date" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 bg-popover border shadow-lg z-[9999]">
                    {Array.from({
                      length: 31,
                    }).map((_, idx) => {
                      const day = idx + 1;
                      return (
                        <SelectItem
                          key={day}
                          value={day.toString()}
                          className="cursor-pointer hover:bg-accent focus:bg-accent"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{day}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {day}
                              {getOrdinalSuffix(day)}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">💡 Tip:</span> Set the date you typically receive your
                    main income. This helps align monthly tracking and reports with your personal income cycle for
                    better budget management.
                  </p>
                </div>

                {(isLoadingIncomeDate || isUpdatingIncomeDate) && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLoadingIncomeDate ? "Loading..." : "Updating..."}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="font-medium">Categories</h2>
            </div>
            <div className="ml-9">
              <Button variant="ghost" className="w-full justify-start" onClick={handleManageCategoriesClick}>
                <Tag className="w-4 h-4 mr-3" />
                Manage Categories
              </Button>
            </div>
          </div>

          {/* Wallet Settings */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-medium">Wallet</h2>
            </div>
            <div className="ml-9">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium">Auto Carryover</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically carry over leftover balance to next month
                  </p>
                </div>
                <Switch
                  checked={preferences?.auto_carryover_enabled ?? true}
                  onCheckedChange={handleCarryoverToggle}
                  disabled={isUpdating}
                />
              </div>
            </div>
          </div>

          {/* Password & Security */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="font-medium">Password & Security</h2>
            </div>
            <div className="ml-9 space-y-2">
              <Button 
                variant="ghost" 
                className="w-full justify-start" 
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <Lock className="w-4 h-4 mr-3" />
                Change Password
              </Button>
              <Button variant="ghost" className="w-full justify-start" disabled>
                <Key className="w-4 h-4 mr-3" />
                Security Settings
                <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
              </Button>
            </div>
          </div>

          {/* Theme - Updated to work properly with ThemeProvider */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="font-medium">Appearance</h2>
            </div>
            <div className="ml-9 space-y-2">
              <Button
                variant={theme === "light" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setTheme("light")}
              >
                <Sun className="w-4 h-4 mr-3" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setTheme("dark")}
              >
                <Moon className="w-4 h-4 mr-3" />
                Dark
              </Button>
              <Button
                variant={theme === "system" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setTheme("system")}
              >
                <Monitor className="w-4 h-4 mr-3" />
                System
              </Button>
            </div>
          </div>

          {/* Help & Support */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-medium">Help & Support</h2>
            </div>
            <div className="ml-9 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={handleAppGuideClick}>
                <BookOpen className="w-4 h-4 mr-3" />
                App Guide
              </Button>
            </div>
          </div>

          {/* Activity */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <History className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="font-medium">Activity</h2>
            </div>
            <div className="ml-9 space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={handleMonthlySummaryClick}>
                <History className="w-4 h-4 mr-3" />
                Monthly Summary
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={handleManageFundsClick}>
                <Wallet className="w-4 h-4 mr-3" />
                Manage Funds
              </Button>
            </div>
          </div>

          {/* Account */}
          <div className="p-4 safe-area-bottom my-0 py-[15px]">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-900/20 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="font-medium">Account</h2>
            </div>

            {/* User Profile with Avatar */}
            <div className="ml-9 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face" 
                    alt={user?.email || "User"} 
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    👤
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getDisplayName()}</p>
                  <p className="text-xs text-muted-foreground truncate">@{getUsername()}</p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            <div className="ml-9">
              <Button variant="destructive" className="w-full justify-start" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
export default SettingsSidebar;
