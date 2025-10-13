
import { useState, useEffect } from "react";
import { useMonthContext } from "@/hooks/use-month-context";
import { useMonthCarryover } from "@/hooks/useMonthCarryover";
import { useNotificationTriggers } from "@/hooks/useNotificationTriggers";
import { MonthlyIncomeService } from "@/services/monthlyIncomeService";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useDashboardQueries } from "@/hooks/dashboard/useDashboardQueries";
import { useDashboardCalculations } from "@/hooks/dashboard/useDashboardCalculations";
import { useDashboardState } from "@/hooks/dashboard/useDashboardState";
import { useFamilyContext } from "@/hooks/useFamilyContext";

export function useDashboardData(overrideMonth?: Date) {
  const { user } = useAuth();
  const { activeFamilyId, isPersonalMode } = useFamilyContext();
  const { selectedMonth: globalSelectedMonth, getCurrentMonthData, updateMonthData } = useMonthContext();
  
  // Use override month if provided, otherwise use global context
  const selectedMonth = overrideMonth || globalSelectedMonth;
  
  // Initialize month carryover functionality
  useMonthCarryover();
  
  // Get current month's data from context
  const currentMonthKey = format(selectedMonth, 'yyyy-MM');
  const currentMonthData = getCurrentMonthData();
  
  const [monthlyIncome, setMonthlyIncome] = useState<number>(currentMonthData.monthlyIncome || 0);
  
  // Use specialized hooks
  const { expenses, allExpenses, isExpensesLoading, isIncomeLoading, incomeData } = useDashboardQueries(selectedMonth);
  const { monthlyExpenses, totalBalance, walletBalance, totalAdditions, savingsRate, formatPercentage } = useDashboardCalculations({ expenses, monthlyIncome, selectedMonth });
  const { expenseToEdit, setExpenseToEdit, chartType, setChartType, showAddExpense, setShowAddExpense } = useDashboardState();
  
  // Update local income state when data is fetched
  useEffect(() => {
    if (incomeData && !isIncomeLoading) {
      if (import.meta.env.DEV) {
        console.log("Updating monthly income state:", incomeData.monthlyIncome);
      }
      setMonthlyIncome(incomeData.monthlyIncome);
      
      // Also update the month context
      updateMonthData(currentMonthKey, {
        monthlyIncome: incomeData.monthlyIncome
      });
    }
  }, [incomeData, isIncomeLoading, updateMonthData, currentMonthKey]);

  // Setup notification triggers with enhanced alerts
  useNotificationTriggers({
    budgets: [],
    monthlyExpenses,
    monthlyIncome,
    walletBalance,
    expenses,
    previousMonthExpenses: 0,
  });

  // Update month data when income or expenses change
  useEffect(() => {
    updateMonthData(currentMonthKey, {
      monthlyIncome,
      monthlyExpenses,
      totalBalance,
      walletBalance,
      savingsRate
    });
  }, [monthlyIncome, monthlyExpenses, totalAdditions, currentMonthKey, updateMonthData]);

  const isNewUser = expenses.length === 0;
  const isLoading = isExpensesLoading || isIncomeLoading;
  
  return {
    expenses,
    allExpenses,
    isExpensesLoading,
    isLoading,
    isNewUser,
    monthlyIncome,
    monthlyExpenses,
    totalBalance,
    walletBalance,
    totalAdditions,
    savingsRate,
    chartType,
    setChartType,
    expenseToEdit,
    setExpenseToEdit,
    showAddExpense,
    setShowAddExpense,
    formatPercentage,
    setMonthlyIncome: async (newIncome: number) => {
      if (user) {
        const success = await MonthlyIncomeService.setMonthlyIncome(user.id, selectedMonth, newIncome, activeFamilyId, isPersonalMode);
        if (success) {
          setMonthlyIncome(newIncome);
        }
      }
    }
  };
}
