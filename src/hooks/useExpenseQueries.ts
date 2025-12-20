
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Expense } from "@/components/expenses/types";
import { useFamilyContext } from "@/hooks/useFamilyContext";

export function useExpenseQueries() {
  const { user } = useAuth();
  const { activeFamilyId, isPersonalMode } = useFamilyContext();

  // Simplified expenses query with better performance
  const {
    data: expenses = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses', user?.id, isPersonalMode ? 'personal' : activeFamilyId],
    queryFn: async () => {
      if (!user) return [];

      console.log("Fetching expenses for user:", user.id, "Mode:", isPersonalMode ? 'personal' : `family: ${activeFamilyId}`);

      let query = supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000); // Limit to prevent performance issues with large datasets

      // Filter by family context
      if (isPersonalMode) {
        // Personal mode: only expenses with no family_id
        query = query.eq('user_id', user.id).is('family_id', null);
      } else if (activeFamilyId) {
        // Family mode: only expenses with the active family_id
        query = query.eq('family_id', activeFamilyId);
      } else {
        // Fallback: user's expenses (shouldn't happen)
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} expenses`);

      return data.map(exp => ({
        id: exp.id,
        amount: Number(exp.amount),
        description: exp.description,
        date: exp.date,
        category: exp.category,
        paymentMethod: exp.payment || undefined,
        notes: exp.notes || undefined,
        isRecurring: exp.is_recurring || false,
        receiptUrl: exp.receipt_url || undefined,
      })) as Expense[];
    },
    enabled: !!user,
    staleTime: 30000,             // 30 seconds - more responsive for receipt scans
    gcTime: 1000 * 60 * 10,       // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,         // Always refetch on mount to catch new data
  });

  return {
    expenses,
    isLoading,
    error,
    refetch,
  };
}
