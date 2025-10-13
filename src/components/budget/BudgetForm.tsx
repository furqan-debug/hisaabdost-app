
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CategorySelect } from "@/components/expenses/category/CategorySelect";
import { Budget } from "@/pages/Budget";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { useCurrency } from "@/hooks/use-currency";
import { useBudgetValidation } from "@/hooks/useBudgetValidation";
import { useBudgetQueries } from "@/hooks/useBudgetQueries";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFamilyContext } from "@/hooks/useFamilyContext";

const budgetSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.number().min(0, "Amount must be positive"),
  period: z.enum(["monthly", "quarterly", "yearly"]),
  carry_forward: z.boolean(),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
  onSuccess: () => void;
  monthlyIncome: number;
}

export function BudgetForm({
  open,
  onOpenChange,
  budget,
  onSuccess,
  monthlyIncome,
}: BudgetFormProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { currencyCode } = useCurrency();
  const queryClient = useQueryClient();
  const { activeFamilyId } = useFamilyContext();
  
  // Get all budgets for validation
  const { budgets = [] } = useBudgetQueries(new Date());
  
  // Convert Budget period to form period, defaulting weekly to monthly
  const getFormDefaultValues = (budget: Budget | null) => {
    if (!budget) {
      return {
        category: "",
        amount: 0,
        period: "monthly" as const,
        carry_forward: false,
      };
    }
    
    return {
      category: budget.category,
      amount: budget.amount,
      period: budget.period === "weekly" ? "monthly" : budget.period,
      carry_forward: budget.carry_forward,
    };
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: getFormDefaultValues(budget),
  });

  const currentAmount = watch("amount") || 0;
  const currentPeriod = watch("period") || "monthly";
  
  // Use the new smart validation system
  const validation = useBudgetValidation({
    budgets,
    currentAmount,
    currentPeriod,
    monthlyIncome,
    editingBudget: budget
  });

  const onSubmit = async (formData: BudgetFormData) => {
    if (!user) return;
    
    try {
      const budgetData = {
        amount: formData.amount,
        category: formData.category,
        period: formData.period,
        carry_forward: formData.carry_forward,
        user_id: user.id,
        family_id: activeFamilyId || null,
      };

      if (budget) {
        const { error } = await supabase
          .from("budgets")
          .update(budgetData)
          .eq("id", budget.id);
        if (error) throw error;
        toast.success("Budget updated successfully");
      } else {
        const { error } = await supabase
          .from("budgets")
          .insert(budgetData);
        if (error) throw error;
        toast.success("Budget created successfully");
      }

      // Immediately invalidate and refresh budget queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.refetchQueries({ queryKey: ['budgets'] })
      ]);

      // Dispatch budget update event for other components
      window.dispatchEvent(new CustomEvent('budget-updated', { 
        detail: { 
          action: budget ? 'updated' : 'created',
          budget: { ...budgetData, id: budget?.id }
        }
      }));

      reset();
      onSuccess();
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget. Please try again.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90%] rounded-t-2xl" : ""}>
        <SheetHeader>
          <SheetTitle>{budget ? "Edit" : "Create"} Budget</SheetTitle>
          <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none" />
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-6 budget-form-container">
          {/* Level 1: Sustainability Warning */}
          {validation.sustainabilityWarning.show && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Long-term Sustainability Concern</div>
                {validation.sustainabilityWarning.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Level 2: Immediate Affordability Warning */}
          {validation.affordabilityWarning.show && (
            <Alert className="border-orange-200 bg-orange-50 text-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="font-medium mb-1">Immediate Affordability Alert</div>
                {validation.affordabilityWarning.message}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <CategorySelect
              value={watch("category")}
              onChange={(value) => setValue("category", value, { shouldValidate: true })}
            />
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Budget Amount</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              autoComplete="off"
              {...register("amount", { valueAsNumber: true })}
              className="text-base"
            />
            {errors.amount && (
              <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Budget Period</Label>
            <Select
              value={watch("period")}
              onValueChange={(value: "monthly" | "quarterly" | "yearly") =>
                setValue("period", value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            {errors.period && (
              <p className="text-xs text-red-500 mt-1">{errors.period.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
            <Label htmlFor="carry_forward" className="flex-1 cursor-pointer">
              Carry Forward Unused Amount
            </Label>
            <Switch
              id="carry_forward"
              checked={watch("carry_forward")}
              onCheckedChange={(checked) => setValue("carry_forward", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <SheetClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </SheetClose>
            <Button 
              type="submit"
            >
              {budget ? "Update" : "Create"} Budget
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
