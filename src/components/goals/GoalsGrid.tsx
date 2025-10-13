
import React from 'react';
import { GoalCard } from './GoalCard';

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

interface GoalsGridProps {
  goals: Goal[];
  calculateCategorySavings: (goal: Goal) => number;
  calculateProgress: (goal: Goal) => number;
  generateTip: (goal: Goal) => string;
  budgets: any[];
  currencyCode: string;
  onDeleteGoal: (goalId: string) => void;
  syncGoalProgress: (goal: Goal) => void;
}

export function GoalsGrid({ 
  goals, 
  calculateCategorySavings, 
  calculateProgress, 
  generateTip, 
  budgets, 
  currencyCode, 
  onDeleteGoal,
  syncGoalProgress 
}: GoalsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {goals.map((goal) => {
        // Sync goal progress with calculated savings
        syncGoalProgress(goal);

        const savings = calculateCategorySavings(goal);
        const progress = calculateProgress(goal);
        const tip = generateTip(goal);
        const hasBudget = budgets?.some(b => b.category === goal.category && b.amount > 0) ?? false;

        return (
          <GoalCard
            key={goal.id}
            goal={goal}
            savings={savings}
            progress={progress}
            tip={tip}
            hasBudget={hasBudget}
            currencyCode={currencyCode}
            onDelete={onDeleteGoal}
          />
        );
      })}
    </div>
  );
}
