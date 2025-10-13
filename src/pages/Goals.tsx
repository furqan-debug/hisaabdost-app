
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalsHeader } from "@/components/goals/GoalsHeader";
import { GoalsEmptyState } from "@/components/goals/GoalsEmptyState";
import { GoalsGrid } from "@/components/goals/GoalsGrid";
import { useCurrency } from "@/hooks/use-currency";
import { useGoalCalculations } from "@/hooks/useGoalCalculations";
import { useGoalManagement } from "@/hooks/useGoalManagement";
import { useFamilyContext } from "@/hooks/useFamilyContext";
import { startOfMonth, endOfMonth } from "date-fns";

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

export default function Goals() {
  const { user } = useAuth();
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const { currencyCode } = useCurrency();
  const { refreshTrigger, handleDeleteGoal, syncGoalProgress } = useGoalManagement();
  const { activeFamilyId, isPersonalMode } = useFamilyContext();


  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', user?.id, refreshTrigger],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("Fetching goals for user:", user.id, "context:", isPersonalMode ? 'personal' : activeFamilyId);
      
      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);
      
      // Filter by family context
      if (isPersonalMode) {
        query = query.is('family_id', null);
      } else if (activeFamilyId) {
        query = query.eq('family_id', activeFamilyId);
      }
      
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching goals:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} goals:`, data);
      return data as Goal[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes for mobile optimization
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { data: budgets } = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const { calculateCategorySavings, calculateProgress, generateTip } = useGoalCalculations(
    expenses || [], 
    budgets || [], 
    currencyCode
  );

  const handleCreateGoal = () => {
    setSelectedGoal(null);
    setShowGoalForm(true);
  };

  const handleSyncGoalProgress = (goal: Goal) => {
    syncGoalProgress(goal, calculateCategorySavings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 max-w-5xl">
        <div className="space-y-8 pb-24 md:pb-8">
          <GoalsHeader onCreateGoal={handleCreateGoal} />

          {goals?.length === 0 ? (
            <GoalsEmptyState onCreateGoal={handleCreateGoal} />
          ) : (
            <GoalsGrid
              goals={goals || []}
              calculateCategorySavings={calculateCategorySavings}
              calculateProgress={calculateProgress}
              generateTip={generateTip}
              budgets={budgets || []}
              currencyCode={currencyCode}
              onDeleteGoal={handleDeleteGoal}
              syncGoalProgress={handleSyncGoalProgress}
            />
          )}
        </div>
      </div>
        
      <GoalForm 
        open={showGoalForm} 
        onOpenChange={setShowGoalForm} 
        goal={selectedGoal} 
      />
    </div>
  );
}
