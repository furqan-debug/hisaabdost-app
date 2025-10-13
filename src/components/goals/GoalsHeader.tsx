import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  PageHeader, 
  PageHeaderTitle, 
  PageHeaderDescription, 
  PageHeaderActions 
} from "@/components/ui/page-header";

interface GoalsHeaderProps {
  onCreateGoal: () => void;
}

export function GoalsHeader({ onCreateGoal }: GoalsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <PageHeader variant="simple">
        <PageHeaderTitle gradient>Financial Goals</PageHeaderTitle>
        <PageHeaderDescription>Track and achieve your savings targets</PageHeaderDescription>
      </PageHeader>
      <PageHeaderActions>
        <Button 
          onClick={onCreateGoal} 
          size="default"
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          New Goal
        </Button>
      </PageHeaderActions>
    </div>
  );
}
