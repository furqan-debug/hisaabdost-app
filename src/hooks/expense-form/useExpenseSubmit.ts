
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ExpenseFormData, UseExpenseFormProps } from "./types";
import { Expense } from "@/components/expenses/types";
import { saveExpenseOffline } from "@/services/offlineExpenseService";
import { updateExpenseCache } from "@/utils/expenseCacheUtils";
import { logExpenseActivity } from "@/services/activityLogService";
import { useCarryoverAdjustment } from "@/hooks/useCarryoverAdjustment";
import { useFamilyContext } from "@/hooks/useFamilyContext";

interface UseExpenseSubmitProps extends UseExpenseFormProps {
  formData: ExpenseFormData;
  resetForm: () => void;
}

export function useExpenseSubmit({ 
  expenseToEdit, 
  onClose, 
  formData, 
  resetForm,
  onAddExpense 
}: UseExpenseSubmitProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { adjustCarryover } = useCarryoverAdjustment();
  const { activeFamilyId, isPersonalMode } = useFamilyContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description || !formData.date || !formData.category) return;

    setIsSubmitting(true);
    try {
      if (expenseToEdit) {
        // For editing, we still need online connection
        if (!user) {
          toast({
            title: "Authentication Required",
            description: "Please log in to edit expenses.",
            variant: "destructive",
          });
          return;
        }

        const expenseData = {
          user_id: user.id,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          category: formData.category,
          payment: formData.paymentMethod,
          notes: formData.notes,
          is_recurring: formData.isRecurring,
          receipt_url: formData.receiptUrl,
          family_id: activeFamilyId
        };

        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expenseToEdit.id);

        if (error) throw error;

        const updatedExpense: Expense = {
          ...expenseToEdit,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          category: formData.category,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes,
          isRecurring: formData.isRecurring,
          receiptUrl: formData.receiptUrl
        };

        // Log expense update activity
        try {
          await logExpenseActivity('updated', {
            description: updatedExpense.description,
            amount: updatedExpense.amount,
            category: updatedExpense.category,
            id: updatedExpense.id,
            date: updatedExpense.date
          });
        } catch (logError) {
          console.error('Failed to log expense update activity:', logError);
        }

        // Update cache and invalidate all relevant queries
        console.log("Updating expense cache after edit");
        updateExpenseCache({
          queryClient,
          userId: user.id,
          expense: updatedExpense,
          operation: 'update'
        });

        // Invalidate ALL expense-related queries to ensure budget page updates
        await queryClient.invalidateQueries({ 
          queryKey: ['expenses']
        });
        await queryClient.invalidateQueries({ 
          queryKey: ['activity_logs']
        });

        // Dispatch multiple events to ensure all components update
        window.dispatchEvent(new CustomEvent('expense-updated', { 
          detail: { expense: updatedExpense, timestamp: Date.now() } 
        }));
        window.dispatchEvent(new CustomEvent('budget-refresh', { 
          detail: { timestamp: Date.now() } 
        }));

        // Check if carryover adjustment is needed
        await adjustCarryover(new Date(formData.date));

        if (onAddExpense) {
          onAddExpense(updatedExpense);
        }

        toast({
          title: "Expense Updated",
          description: "Your expense has been updated successfully.",
        });

      } else {
        // For new expenses, use offline-capable service
        const newExpense: Expense = {
          id: `temp_${Date.now()}`,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          category: formData.category,
          paymentMethod: formData.paymentMethod,
          notes: formData.notes || "",
          isRecurring: formData.isRecurring,
          receiptUrl: formData.receiptUrl || "",
          familyId: isPersonalMode ? null : activeFamilyId,
        };

        console.log("💾 Saving new expense with context:", { 
          isPersonalMode, 
          activeFamilyId, 
          family_id: newExpense.familyId 
        });
        const success = await saveExpenseOffline(newExpense, newExpense.familyId);
        
        if (success && user) {
          // Log expense creation activity
          try {
            await logExpenseActivity('added', {
              description: newExpense.description,
              amount: newExpense.amount,
              category: newExpense.category,
              id: newExpense.id,
              date: newExpense.date
            });
          } catch (logError) {
            console.error('Failed to log expense creation activity:', logError);
          }

          // Update cache and invalidate all relevant queries
          console.log("Updating expense cache after new expense");
          updateExpenseCache({
            queryClient,
            userId: user.id,
            expense: newExpense,
            operation: 'add'
          });

          // Invalidate ALL expense-related queries to ensure budget page updates
          await queryClient.invalidateQueries({ 
            queryKey: ['expenses']
          });
          await queryClient.invalidateQueries({ 
            queryKey: ['activity_logs']
          });

          // Dispatch multiple events to ensure all components update immediately
          window.dispatchEvent(new CustomEvent('expense-added', { 
            detail: { expense: newExpense, timestamp: Date.now() } 
          }));
          window.dispatchEvent(new CustomEvent('budget-refresh', { 
            detail: { timestamp: Date.now() } 
          }));
          window.dispatchEvent(new CustomEvent('finny-expense-added', { 
            detail: { expense: newExpense, source: 'manual-entry', timestamp: Date.now() } 
          }));

          // Check if carryover adjustment is needed
          await adjustCarryover(new Date(formData.date));

          if (onAddExpense) {
            onAddExpense(newExpense);
          }
        } else {
          throw new Error('Failed to save expense');
        }
      }

      resetForm();
      onClose?.();

    } catch (error) {
      console.error('Error saving expense:', error);
      toast({
        title: "Error",
        description: "Failed to save the expense. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    isSubmitting,
    handleSubmit 
  };
}
