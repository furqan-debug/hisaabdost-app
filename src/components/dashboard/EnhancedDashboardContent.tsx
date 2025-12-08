import React from "react";
import { DashboardMainContent } from "@/components/dashboard/sections/DashboardMainContent";
import { DashboardExpenseSheet } from "@/components/dashboard/sections/DashboardExpenseSheet";
import { AddExpenseButton } from "@/components/dashboard/AddExpenseButton";
import { useDashboardActions } from "@/hooks/dashboard/useDashboardActions";
interface EnhancedDashboardContentProps {
  isNewUser: boolean;
  isLoading: boolean;
  totalBalance: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  setMonthlyIncome: (income: number) => void;
  savingsRate: number;
  formatPercentage: (value: number) => string;
  expenses: any[];
  allExpenses: any[];
  isExpensesLoading: boolean;
  expenseToEdit?: any;
  setExpenseToEdit: (expense?: any) => void;
  showAddExpense: boolean;
  setShowAddExpense: (show: boolean) => void;
  chartType: 'pie' | 'bar' | 'line';
  setChartType: (type: 'pie' | 'bar' | 'line') => void;
  walletBalance: number;
}
export const EnhancedDashboardContent = ({
  isNewUser,
  isLoading,
  totalBalance,
  monthlyExpenses,
  monthlyIncome,
  setMonthlyIncome,
  savingsRate,
  formatPercentage,
  expenses,
  allExpenses,
  isExpensesLoading,
  expenseToEdit,
  setExpenseToEdit,
  showAddExpense,
  setShowAddExpense,
  chartType,
  setChartType,
  walletBalance
}: EnhancedDashboardContentProps) => {
  const {
    captureMode,
    setCaptureMode,
    selectedFile,
    setSelectedFile,
    fileInputRef,
    cameraInputRef,
    handleFileChange,
    handleAddExpense,
    handleUploadReceipt,
    handleTakePhoto,
    handleAddBudget
  } = useDashboardActions();
  const handleExpenseAction = (action: string) => {
    setCaptureMode(action as 'manual' | 'upload' | 'camera');
    setShowAddExpense(true);
  };
  const handleExpenseAdded = () => {
    console.log('Dashboard: Expense added - React Query will handle refresh automatically');
  };
  return <div className="space-y-4 pb-6">
      {/* Hidden file inputs using ReceiptFileInput for consistency with expenses page */}
      <div className="hidden">
        <input
          type="file"
          ref={fileInputRef}
          id="dashboard-receipt-upload"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={cameraInputRef}
          id="dashboard-camera-capture"
          accept="image/*;capture=camera"
          capture="environment"
          onChange={handleFileChange}
        />
      </div>
      
      {/* Hidden AddExpenseButton component that listens for events */}
      <div className="hidden">
        <AddExpenseButton isNewUser={isNewUser} expenseToEdit={expenseToEdit} showAddExpense={showAddExpense} setExpenseToEdit={setExpenseToEdit} setShowAddExpense={setShowAddExpense} onAddExpense={handleExpenseAdded} />
      </div>

      <DashboardMainContent isNewUser={isNewUser} totalBalance={totalBalance} monthlyExpenses={monthlyExpenses} monthlyIncome={monthlyIncome} setMonthlyIncome={setMonthlyIncome} savingsRate={savingsRate} formatPercentage={formatPercentage} walletBalance={walletBalance} expenses={expenses} allExpenses={allExpenses} isExpensesLoading={isExpensesLoading} setShowAddExpense={setShowAddExpense} onAddExpense={() => {
      handleAddExpense();
      setShowAddExpense(true);
    }} onUploadReceipt={() => {
      handleUploadReceipt(); // This dispatches event, no need to manually open sheet
    }} onTakePhoto={() => {
      handleTakePhoto(); // This dispatches event, no need to manually open sheet
    }} onAddBudget={handleAddBudget} />

      <DashboardExpenseSheet showAddExpense={showAddExpense} setShowAddExpense={setShowAddExpense} expenseToEdit={expenseToEdit} setExpenseToEdit={setExpenseToEdit} captureMode={captureMode} setCaptureMode={setCaptureMode} selectedFile={selectedFile} setSelectedFile={setSelectedFile} onExpenseAdded={handleExpenseAdded} />
    </div>;
};