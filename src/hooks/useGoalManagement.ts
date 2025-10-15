
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { logGoalAchieved } from "@/utils/appsflyerTracking";

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

export function useGoalManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshTrigger, setRefreshTrigger] = useState<number>(Date.now());

  // Listen for goal update events from Finny
  useEffect(() => {
    const handleGoalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const detail = customEvent.detail || {};
      const isFinnyEvent = detail.source === 'finny-chat';
      
      console.log("Goal update detected, immediate refresh", e, { isFinnyEvent });
      
      if (isFinnyEvent) {
        console.log("IMMEDIATE goal refresh for Finny event");
        
        // Force immediate invalidation and refetch for Finny events
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.refetchQueries({ queryKey: ['goals', user?.id] });
        
        // Update refresh trigger immediately
        setRefreshTrigger(Date.now());
        
        // Additional refresh after short delay to ensure backend processing is complete
        setTimeout(() => {
          console.log("Secondary goal refresh for Finny event");
          queryClient.refetchQueries({ queryKey: ['goals', user?.id] });
          setRefreshTrigger(Date.now());
        }, 300);
      } else {
        // Standard refresh for other events
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        
        // Update refresh trigger
        setRefreshTrigger(Date.now());
        
        // Force a refetch after a short delay
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ['goals', user?.id] });
        }, 100);
      }
    };
    
    const eventTypes = [
      'goal-updated',
      'goal-deleted',
      'goals-refresh',
      'goal-added'
    ];
    
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, handleGoalUpdate);
    });
    
    return () => {
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, handleGoalUpdate);
      });
    };
  }, [queryClient, user?.id]);

  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Goal deleted",
        description: "Your goal has been successfully deleted."
      });

      queryClient.invalidateQueries({ queryKey: ["goals"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the goal. Please try again.",
        variant: "destructive"
      });
    }
  };

  // This function will update goal progress in the database based on actual savings
  const syncGoalProgress = async (goal: Goal, calculateCategorySavings: (goal: Goal) => number) => {
    try {
      const savings = calculateCategorySavings(goal);

      // We don't store negative values in the database
      const savingsToStore = Math.max(0, savings);

      // Update only if savings are different from what's stored
      if (Math.abs(savingsToStore - goal.current_amount) > 0.01) {
        // Check if goal was just achieved (crossed the threshold)
        const wasNotAchieved = goal.current_amount < goal.target_amount;
        const isNowAchieved = savingsToStore >= goal.target_amount;
        
        if (wasNotAchieved && isNowAchieved) {
          console.log(`🎉 Goal "${goal.title}" just achieved!`);
          logGoalAchieved(goal.title, goal.target_amount, 'achieved');
        }

        const { error } = await supabase
          .from('goals')
          .update({ current_amount: savingsToStore })
          .eq('id', goal.id);

        if (error) throw error;

        // Quietly refresh data
        queryClient.invalidateQueries({ queryKey: ["goals"] });
      }
    } catch (error) {
      console.error("Failed to sync goal progress:", error);
    }
  };

  return {
    refreshTrigger,
    handleDeleteGoal,
    syncGoalProgress
  };
}
