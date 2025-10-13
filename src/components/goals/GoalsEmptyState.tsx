
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";

interface GoalsEmptyStateProps {
  onCreateGoal: () => void;
}

export function GoalsEmptyState({ onCreateGoal }: GoalsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 animate-fade-in">
        <Target className="h-10 w-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-foreground">No financial goals yet</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-md leading-relaxed">
        Start your journey to financial success by creating your first savings goal. Track your progress and achieve your targets faster.
      </p>
      <Button 
        onClick={onCreateGoal}
        size="lg"
        className="gap-2 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        Create Your First Goal
      </Button>
    </div>
  );
}
