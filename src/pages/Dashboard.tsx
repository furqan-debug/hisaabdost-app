
import React, { useEffect, useCallback } from "react";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { EnhancedDashboardContent } from "@/components/dashboard/EnhancedDashboardContent";
import { useMonthContext } from "@/hooks/use-month-context";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { useMonthCarryover } from "@/hooks/useMonthCarryover";
import { useAnalyticsNotifications } from "@/hooks/useAnalyticsNotifications";
import { useOptimizedDataSync } from "@/hooks/useOptimizedDataSync";
import { ContextIndicator } from "@/components/ui/context-indicator";
import { PullToRefresh } from "@/components/native/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Dashboard page component that displays financial overview
 * and expense analytics with enhanced widgets and features.
 */
const Dashboard = () => {
  const { isLoading: isMonthDataLoading } = useMonthContext();
  const queryClient = useQueryClient();
  
  // Initialize optimized data synchronization
  const { syncInProgress } = useOptimizedDataSync();

  const {
    expenses,
    allExpenses,
    isExpensesLoading,
    isLoading,
    isNewUser,
    monthlyIncome,
    monthlyExpenses,
    totalBalance,
    walletBalance,
    savingsRate,
    chartType,
    setChartType,
    expenseToEdit,
    setExpenseToEdit,
    showAddExpense,
    setShowAddExpense,
    formatPercentage,
    setMonthlyIncome
  } = useDashboardData();

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
  }, [queryClient]);

  // Ensure any lingering modal overlays are cleared when arriving here
  useEffect(() => {
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' } as any));
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = '';
    } catch {}
  }, []);

  // Reduced notification triggers - only for established users with significant data
  const shouldSetupNotifications = !isNewUser && !isLoading && !isExpensesLoading && 
    expenses.length > 10 && !syncInProgress; // Require more data before notifications

  // Always call hooks - but pass the condition as a parameter
  useNotificationTriggers({
    monthlyExpenses,
    monthlyIncome,
    walletBalance,
    expenses,
    previousMonthExpenses: 0,
    enabled: shouldSetupNotifications,
  });

  useMonthCarryover({ enabled: shouldSetupNotifications });
  useAnalyticsNotifications({ 
    expenses: expenses.length >= 20 ? expenses : [],
    enabled: shouldSetupNotifications
  });

  if (isLoading || isMonthDataLoading || syncInProgress) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pb-24 md:pb-8">
          <div className="px-3 md:px-6 pt-4 pb-2">
            <ContextIndicator />
          </div>
          <EnhancedDashboardContent
              isNewUser={isNewUser}
              isLoading={isLoading}
              totalBalance={totalBalance}
              monthlyExpenses={monthlyExpenses}
              monthlyIncome={monthlyIncome}
              setMonthlyIncome={setMonthlyIncome}
              savingsRate={savingsRate}
              formatPercentage={formatPercentage}
              expenses={expenses}
              allExpenses={allExpenses}
              isExpensesLoading={isExpensesLoading}
              expenseToEdit={expenseToEdit}
              setExpenseToEdit={setExpenseToEdit}
              showAddExpense={showAddExpense}
              setShowAddExpense={setShowAddExpense}
              chartType={chartType}
              setChartType={setChartType}
              walletBalance={walletBalance}
            />
        </div>
      </PullToRefresh>
    </>
  );
};

export default Dashboard;
