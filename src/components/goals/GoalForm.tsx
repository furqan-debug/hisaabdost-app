
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { CategorySelect } from "@/components/expenses/category/CategorySelect";
import { useFamilyContext } from "@/hooks/useFamilyContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  target_amount: z.number().min(1, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  deadline: z.string().min(1, "Deadline is required"),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  category: string;
  deadline: string;
  created_at: string;
}

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Goal | null;
}

export function GoalForm({ open, onOpenChange, goal }: GoalFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { activeFamilyId } = useFamilyContext();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal ? {
      title: goal.title,
      target_amount: goal.target_amount,
      category: goal.category,
      deadline: goal.deadline,
    } : {
      title: "",
      target_amount: 0,
      category: "",
      deadline: "",
    },
  });

  const onSubmit = async (formData: GoalFormData) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const goalData = {
        title: formData.title,
        target_amount: formData.target_amount,
        category: formData.category,
        deadline: formData.deadline,
        user_id: user.id,
        // Progress always starts at 0 and will be calculated automatically
        current_amount: goal?.current_amount || 0,
        family_id: activeFamilyId || null,
      };

      if (goal) {
        const { error } = await supabase
          .from("goals")
          .update(goalData)
          .eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("goals")
          .insert(goalData);
        if (error) throw error;
      }

      toast({
        title: `Goal ${goal ? "updated" : "created"} successfully!`,
        description: `Your goal "${formData.title}" has been ${goal ? "updated" : "created"}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["goals"] });
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the goal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{goal ? "Edit" : "New"} Goal</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-8">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter goal title"
              autoCorrect="on"
              autoCapitalize="words"
              spellCheck={true}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">Target Amount</Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              min="0"
              autoComplete="off"
              {...register("target_amount", { valueAsNumber: true })}
            />
            {errors.target_amount && (
              <p className="text-sm text-destructive">{errors.target_amount.message}</p>
            )}
          </div>

          <div>
            <CategorySelect
              value={watch("category") || ""}
              onChange={(value) => setValue("category", value, { shouldValidate: true })}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              {...register("deadline")}
            />
            {errors.deadline && (
              <p className="text-sm text-destructive">{errors.deadline.message}</p>
            )}
          </div>

          <Alert className="bg-muted/50 border-muted">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Goal progress is automatically calculated based on your monthly savings (Budget - Expenses) in the selected category. 
              Progress starts at 0% each month and increases as you save money by staying under budget.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Goal"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
