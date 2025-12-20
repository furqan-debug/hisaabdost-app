import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useCurrency } from '@/hooks/use-currency';
import { formatCurrency } from '@/utils/formatters';
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from 'date-fns';
interface SpendingTrendsWidgetProps {
  expenses: Array<{
    id: string;
    amount: number;
    date: string;
    category: string;
    description: string;
  }>;
  isLoading?: boolean;
}
const SpendingTrendsWidgetComponent = ({
  expenses,
  isLoading
}: SpendingTrendsWidgetProps) => {
  const {
    currencyCode
  } = useCurrency();

  // Process real expense data for actual months with expenses only
  const trendsData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by month
    const monthlyTotals = expenses.reduce((acc, expense) => {
      const expenseDate = parseISO(expense.date);
      const monthKey = format(expenseDate, 'yyyy-MM');
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: format(expenseDate, 'MMM'),
          amount: 0,
          date: monthKey
        };
      }
      acc[monthKey].amount += expense.amount;
      return acc;
    }, {} as Record<string, {
      month: string;
      amount: number;
      date: string;
    }>);

    // Convert to array and sort by date
    return Object.values(monthlyTotals).sort((a, b) => a.date.localeCompare(b.date)).slice(-6); // Show only last 6 months with actual data
  }, [expenses]);
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading trends...</div>
          </div>
        </CardContent>
      </Card>;
  }

  // Don't show trends if user has less than 2 months of data
  if (trendsData.length < 2) {
    return <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spending Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mb-2">📈</div>
              <div className="text-sm">Need more data for trends</div>
              <div className="text-xs">Add expenses for at least 2 months to see spending trends</div>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  const getTrend = () => {
    if (trendsData.length < 2) return {
      direction: 'neutral',
      percentage: 0
    };
    const current = trendsData[trendsData.length - 1]?.amount || 0;
    const previous = trendsData[trendsData.length - 2]?.amount || 0;
    if (previous === 0) return {
      direction: 'neutral',
      percentage: 0
    };
    const percentage = (current - previous) / previous * 100;
    return {
      direction: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'neutral',
      percentage: Math.abs(percentage)
    };
  };
  const trend = getTrend();
  const getTrendIcon = () => {
    switch (trend.direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };
  const getTrendColor = () => {
    switch (trend.direction) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  const getTrendText = () => {
    switch (trend.direction) {
      case 'up':
        return `${trend.percentage.toFixed(1)}% increase`;
      case 'down':
        return `${trend.percentage.toFixed(1)}% decrease`;
      default:
        return 'Stable spending';
    }
  };
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Spending Trends</CardTitle>
        <div className={`flex items-center gap-2 ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="text-sm font-medium">{getTrendText()}</span>
        </div>
      </CardHeader>
      <CardContent className="px-[3px] mx-[4px] my-[4px] py-[2px]">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{
              fontSize: 12
            }} />
              <YAxis className="text-xs" tick={{
              fontSize: 12
            }} tickFormatter={value => formatCurrency(value, currencyCode)} />
              <Tooltip formatter={(value: number) => [formatCurrency(value, currencyCode), 'Spent']} labelFormatter={label => `Month: ${label}`} contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }} />
              <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} dot={{
              fill: 'hsl(var(--primary))',
              strokeWidth: 2,
              r: 4
            }} activeDot={{
              r: 6,
              stroke: 'hsl(var(--primary))',
              strokeWidth: 2
            }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>;
};

export const SpendingTrendsWidget = React.memo(SpendingTrendsWidgetComponent);