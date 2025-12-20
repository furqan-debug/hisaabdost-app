import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMonthContext } from "@/hooks/use-month-context";
import { useCurrency } from "@/hooks/use-currency";
import { OnboardingTooltip } from "@/components/OnboardingTooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "./stats/StatCard";
import { EditableIncomeCard } from "./stats/EditableIncomeCard";
import { usePercentageChanges } from "@/hooks/usePercentageChanges";
import { formatCurrency } from "@/utils/formatters";
import { WalletBalanceCard } from "./wallet/WalletBalanceCard";
import { PercentageChange } from "./stats/PercentageChange";
interface StatCardsProps {
  totalBalance: number;
  monthlyExpenses: number;
  monthlyIncome: number;
  setMonthlyIncome: (income: number) => void;
  savingsRate: number;
  formatPercentage: (value: number) => string;
  isNewUser: boolean;
  isLoading?: boolean;
  walletBalance: number;
}
export const StatCards = ({
  totalBalance,
  monthlyExpenses,
  monthlyIncome,
  setMonthlyIncome,
  savingsRate,
  formatPercentage,
  isNewUser,
  isLoading = false,
  walletBalance
}: StatCardsProps) => {
  const isMobile = useIsMobile();
  const {
    currencyCode,
    version
  } = useCurrency();
  const {
    selectedMonth
  } = useMonthContext();

  // Get percentage changes from the hook
  const percentageChanges = usePercentageChanges(monthlyExpenses, monthlyIncome, savingsRate);
  if (isLoading) {
    return <div className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-5">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[120px]" />)}
      </div>;
  }
  return <div key={`stat-cards-${version}`} className="grid gap-3 grid-cols-2 md:grid-cols-4 mb-5 px-0 mx-[4px]">
      <div id="tour-wallet-card">
        <OnboardingTooltip content="Track your wallet balance including income and added funds" defaultOpen={isNewUser}>
          <WalletBalanceCard walletBalance={walletBalance} />
        </OnboardingTooltip>
      </div>
      
      <div id="tour-expenses-card">
        <StatCard title="Monthly Expenses" value={formatCurrency(monthlyExpenses, currencyCode)} subtext={<PercentageChange value={percentageChanges.expenses} inverse={true} />} infoTooltip="This shows the total amount you've spent this month across all categories and payment methods. It includes all your recorded expenses like groceries, dining, transportation, utilities, and other purchases. The percentage change compares this month's spending to the previous month, helping you track if you're spending more or less than usual." cardType="expenses" />
      </div>

      <EditableIncomeCard monthlyIncome={monthlyIncome} setMonthlyIncome={setMonthlyIncome} percentageChange={percentageChanges.income} formatCurrency={formatCurrency} currencyCode={currencyCode} className="" infoTooltip="This represents your total monthly income before taxes and deductions. It's used to calculate your savings rate and budget planning. Click the 'Edit Income' button to update this amount when your salary changes or you receive additional income sources. This figure helps determine your financial capacity and spending limits." />

      <div id="tour-savings-card">
        <StatCard title="Savings Rate" value={formatPercentage(savingsRate)} subtext={<PercentageChange value={percentageChanges.savings} />} infoTooltip="Your savings rate shows what percentage of your income you're saving each month. It's calculated as (Monthly Income - Monthly Expenses) ÷ Monthly Income × 100. A higher savings rate indicates better financial health and progress toward your financial goals. Financial experts typically recommend a savings rate of 10-20% or more for long-term financial stability." cardType="savings" />
      </div>
    </div>;
};