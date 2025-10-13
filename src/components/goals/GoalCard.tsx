
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Target, TrendingUp, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/utils/formatters";
import { CurrencyCode } from "@/utils/currencyUtils";

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

interface GoalCardProps {
  goal: Goal;
  savings: number;
  progress: number;
  tip: string;
  hasBudget: boolean;
  currencyCode: string;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ 
  goal, 
  savings, 
  progress, 
  tip, 
  hasBudget, 
  currencyCode, 
  onDelete 
}: GoalCardProps) {
  const formattedProgress = Math.round(progress);
  const isOverspent = savings < 0;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-border/60 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Target className="h-4 w-4 text-primary flex-shrink-0" />
              <CardTitle className="text-base truncate">{goal.title}</CardTitle>
              {progress >= 100 && (
                <Trophy className="h-4 w-4 text-green-500 flex-shrink-0 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary/40"></span>
              {goal.category}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(goal.id)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Progress</span>
            <span className={`text-xs font-semibold ${
              progress >= 100 ? "text-green-600 dark:text-green-500" : 
              progress > 50 ? "text-primary" : "text-muted-foreground"
            }`}>
              {formattedProgress}%
            </span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 transition-all"
            indicatorClassName={
              progress >= 100 ? "bg-green-500" : 
              progress > 50 ? "bg-primary" : "bg-muted-foreground/60"
            } 
          />
        </div>

        {/* Amount Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Saved</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(Math.max(0, savings), currencyCode as CurrencyCode)}
            </p>
          </div>
          <div className="space-y-1 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span>Target</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {formatCurrency(goal.target_amount, currencyCode as CurrencyCode)}
            </p>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>Due {format(parseISO(goal.deadline), 'MMM dd, yyyy')}</span>
        </div>

        {/* Alerts */}
        {!hasBudget && (
          <Alert variant="default" className="py-2 px-3 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/30">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-600 ml-2">
              Set a budget for {goal.category} to track progress
            </AlertDescription>
          </Alert>
        )}

        {progress >= 100 && (
          <Alert variant="default" className="py-2 px-3 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900/30">
            <Trophy className="h-3.5 w-3.5 text-green-600" />
            <AlertDescription className="text-xs text-green-700 dark:text-green-600 ml-2">
              🎉 Congratulations! Goal achieved!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
