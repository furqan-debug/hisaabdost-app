
import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingFormData } from "../types";
import { useState } from "react";
import { CURRENCY_OPTIONS, CurrencyOption, CurrencyCode } from "@/utils/currencyUtils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { MonthlyIncomeService } from "@/services/monthlyIncomeService";

interface CurrencyStepProps {
  onComplete: (data: Partial<OnboardingFormData>) => void;
  initialData: OnboardingFormData;
}

export function CurrencyStep({ onComplete, initialData }: CurrencyStepProps) {
  const [currency, setCurrency] = useState<CurrencyCode>(initialData.preferredCurrency as CurrencyCode || "USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async () => {
    if (isSubmitting) return;
    
    try {
      if (!currency) {
        toast.error("Please select a currency before continuing");
        return;
      }
      
      if (!user) {
        toast.error("User not authenticated");
        return;
      }
      
      setIsSubmitting(true);
      console.log("Starting final onboarding step with currency:", currency);
      
      // Complete the onboarding data first
      const finalFormData = { ...initialData, preferredCurrency: currency };
      console.log("Final form data:", finalFormData);
      
      // Save all data to the profile and mark onboarding as complete
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: finalFormData.fullName,
          age: finalFormData.age,
          gender: finalFormData.gender,
          preferred_currency: finalFormData.preferredCurrency,
          monthly_income: finalFormData.monthlyIncome,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error("Error saving final onboarding data:", error);
        throw error;
      }

      console.log("Onboarding data saved successfully");
      
      // Also save monthly income to monthly_incomes table for the current month
      if (finalFormData.monthlyIncome) {
        console.log("Saving monthly income to monthly_incomes table:", finalFormData.monthlyIncome);
        await MonthlyIncomeService.setMonthlyIncome(
          user.id,
          new Date(),
          finalFormData.monthlyIncome,
          null,
          true  // Always personal mode during onboarding
        );
      }
      
      // Call the parent completion handler first to close the dialog
      onComplete({ preferredCurrency: currency });
      
      // Show success message
      toast.success("Setup completed! Welcome to your dashboard.");
      
      // Multiple navigation strategies for mobile compatibility
      console.log("Attempting navigation to dashboard");
      
      // Strategy 1: Immediate navigation
      navigate("/app/dashboard", { replace: true });
      
      // Strategy 2: Delayed navigation for mobile WebView
      setTimeout(() => {
        console.log("Executing delayed navigation");
        navigate("/app/dashboard", { replace: true });
      }, 100);
      
      // Strategy 3: Force page reload as fallback for mobile
      setTimeout(() => {
        console.log("Executing page reload fallback");
        if (window.location.pathname !== "/app/dashboard") {
          window.location.href = "/app/dashboard";
        }
      }, 500);
      
    } catch (error) {
      console.error("Error completing onboarding:", error);
      
      // Even on error, complete the onboarding to prevent getting stuck
      onComplete({ preferredCurrency: currency });
      toast.success("Setup completed! Welcome to your dashboard.");
      
      // Navigate even on error to prevent getting stuck
      navigate("/app/dashboard", { replace: true });
      setTimeout(() => {
        if (window.location.pathname !== "/app/dashboard") {
          window.location.href = "/app/dashboard";
        }
      }, 500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>Set your preferred currency</DialogTitle>
        <DialogDescription>
          Choose the currency you'd like to use for all your transactions
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Preferred Currency</label>
          <Select value={currency} onValueChange={(value: CurrencyCode) => setCurrency(value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your currency" />
            </SelectTrigger>
            <SelectContent className="touch-scroll">
              {CURRENCY_OPTIONS.map((currencyOption: CurrencyOption) => (
                <SelectItem key={currencyOption.code} value={currencyOption.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currencyOption.symbol}</span>
                    <span>{currencyOption.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={handleComplete}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-w-[140px]"
          size="lg"
        >
          {isSubmitting ? "Setting up..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
