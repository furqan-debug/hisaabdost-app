
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { useAllCategories } from "@/hooks/useAllCategories";
import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/use-currency";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from "lucide-react";
import { format, parseISO, startOfWeek, startOfMonth, startOfQuarter, eachWeekOfInterval, eachMonthOfInterval, eachQuarterOfInterval, endOfWeek, endOfMonth, endOfQuarter, subWeeks, subMonths, subQuarters } from "date-fns";

interface TrendsCardProps {
  expenses: any[];
}

type ViewType = 'weekly' | 'monthly' | 'quarterly';

const TrendsCardComponent = ({ expenses }: TrendsCardProps) => {
  const { categories } = useAllCategories();
  const { currencyCode } = useCurrency();
  const isMobile = useIsMobile();
  const [viewType, setViewType] = useState<ViewType>('monthly');

  // Process data based on view type
  const chartData = useMemo(() => {
    if (!expenses.length) return [];

    const groupedData: Record<string, number> = {};
    const now = new Date();

    // Determine periods based on view type
    let periods: Date[] = [];
    let formatKey: string = '';
    let formatLabel: string = '';

    switch (viewType) {
      case 'weekly':
        const last8Weeks = subWeeks(now, 7);
        periods = eachWeekOfInterval({
          start: last8Weeks,
          end: now
        });
        formatKey = 'yyyy-MM-dd';
        formatLabel = isMobile ? 'MMM dd' : 'MMM dd, yyyy';
        break;
      case 'quarterly':
        const last4Quarters = subQuarters(now, 3);
        periods = eachQuarterOfInterval({
          start: last4Quarters,
          end: now
        });
        formatKey = 'yyyy-QQQ';
        formatLabel = 'QQQ yyyy';
        break;
      default:
        // monthly
        const last6Months = subMonths(now, 5);
        periods = eachMonthOfInterval({
          start: last6Months,
          end: now
        });
        formatKey = 'yyyy-MM';
        formatLabel = isMobile ? 'MMM yy' : 'MMM yyyy';
    }

    // Initialize periods with zero
    periods.forEach(period => {
      const key = format(period, formatKey);
      groupedData[key] = 0;
    });

    // Group expenses by period
    expenses.forEach(expense => {
      const expenseDate = parseISO(expense.date);
      let key: string;

      switch (viewType) {
        case 'weekly':
          const weekStart = startOfWeek(expenseDate);
          key = format(weekStart, 'yyyy-MM-dd');
          break;
        case 'quarterly':
          const quarterStart = startOfQuarter(expenseDate);
          key = format(quarterStart, 'yyyy-QQQ');
          break;
        default:
          const monthStart = startOfMonth(expenseDate);
          key = format(monthStart, 'yyyy-MM');
      }

      if (groupedData.hasOwnProperty(key)) {
        groupedData[key] += Number(expense.amount);
      }
    });

    // Convert to chart format
    return Object.entries(groupedData).map(([key, amount]) => {
      let date: Date;
      let label: string;

      try {
        switch (viewType) {
          case 'weekly':
            date = parseISO(key);
            label = format(date, formatLabel);
            break;
          case 'quarterly':
            const [qYear, quarter] = key.split('-');
            const quarterNum = quarter.replace('Q', '');
            const monthStart = (parseInt(quarterNum) - 1) * 3;
            date = new Date(parseInt(qYear), monthStart, 1);
            label = format(date, formatLabel);
            break;
          default:
            const [mYear, month] = key.split('-');
            date = new Date(parseInt(mYear), parseInt(month) - 1, 1);
            label = format(date, formatLabel);
        }
      } catch (error) {
        console.warn('Date parsing failed for key:', key, error);
        label = key;
      }

      return {
        period: key,
        label,
        amount,
        color: amount > 0 ? amount > 1000 ? '#ef4444' : amount > 500 ? '#f97316' : '#22c55e' : '#94a3b8'
      };
    }).sort((a, b) => a.period.localeCompare(b.period));
  }, [expenses, viewType, isMobile]);

  // Calculate trend and insights
  const insights = useMemo(() => {
    if (chartData.length < 2) return null;

    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    const change = current.amount - previous.amount;
    const percentChange = previous.amount > 0 ? change / previous.amount * 100 : 0;

    // Get top category for current period
    const currentPeriodExpenses = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      const currentPeriodStart = viewType === 'weekly' 
        ? startOfWeek(new Date()) 
        : viewType === 'quarterly' 
          ? startOfQuarter(new Date()) 
          : startOfMonth(new Date());
      return expenseDate >= currentPeriodStart;
    });

    const categoryTotals = currentPeriodExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + Number(expense.amount);
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => Number(b) - Number(a))[0];

    // Generate smart insight
    let insight = "";
    if (Math.abs(percentChange) > 5) {
      const direction = change > 0 ? "more" : "less";
      const period = viewType === 'weekly' ? 'week' : viewType === 'quarterly' ? 'quarter' : 'month';
      if (topCategory && Number(topCategory[1]) > 0) {
        insight = `You spent ${Math.abs(percentChange).toFixed(0)}% ${direction} than last ${period}, mostly on ${topCategory[0]}!`;
      } else {
        insight = `Your spending ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(0)}% compared to last ${period}.`;
      }
    } else {
      insight = `Your spending has been relatively stable this ${viewType.replace('ly', '')}.`;
    }

    return {
      change,
      percentChange,
      insight,
      trend: change > 50 ? 'up' : change < -50 ? 'down' : 'stable',
      topCategory: topCategory?.[0] || null
    };
  }, [chartData, expenses, viewType]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="h-full border-0 shadow-lg bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <span className="text-2xl">📈</span>
              Trends
            </CardTitle>
            {insights && (
              <div className={`flex items-center gap-1 text-sm ${
                insights.trend === 'up' ? 'text-red-500' : 
                insights.trend === 'down' ? 'text-green-500' : 
                'text-muted-foreground'
              }`}>
                {insights.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {insights.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                {insights.percentChange !== 0 && (
                  <span className="font-medium">
                    {insights.percentChange > 0 ? '+' : ''}{insights.percentChange.toFixed(0)}%
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* View Toggle */}
          <div className="flex gap-1 mt-3">
            {(['weekly', 'monthly', 'quarterly'] as ViewType[]).map(type => (
              <Button
                key={type}
                variant={viewType === type ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewType(type)}
                className="h-8 px-3 text-xs"
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          {expenses.length > 0 ? (
            <div className="space-y-5">
              {/* Smart Insights */}
              {insights && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl flex-shrink-0">💡</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {insights.insight}
                      </p>
                      {insights.topCategory && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">Top category:</span>
                          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {insights.topCategory}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Chart Container - Responsive Design */}
              <div className="w-full">
                <div 
                  className={`w-full ${
                    isMobile ? 'h-[280px]' : 'h-[320px]'
                  }`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 20,
                        right: isMobile ? 10 : 20,
                        left: isMobile ? 10 : 20,
                        bottom: isMobile ? 60 : 80
                      }}
                      barCategoryGap={isMobile ? "20%" : "25%"}
                      maxBarSize={isMobile ? 28 : 50}
                    >
                      <CartesianGrid 
                        strokeDasharray="3 3" 
                        vertical={false} 
                        opacity={0.2} 
                        className="stroke-muted" 
                      />
                      <XAxis
                        dataKey="label"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: isMobile ? 9 : 11,
                          fill: 'hsl(var(--muted-foreground))',
                          textAnchor: 'end'
                        }}
                        interval={0}
                        angle={isMobile ? -45 : -35}
                        height={isMobile ? 60 : 80}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: isMobile ? 9 : 11,
                          fill: 'hsl(var(--muted-foreground))'
                        }}
                        tickFormatter={value => {
                          if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                          return value.toString();
                        }}
                        width={isMobile ? 35 : 50}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.[0]) return null;
                          const data = payload[0].payload;
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              className="rounded-xl border bg-background/95 backdrop-blur-sm shadow-xl p-3 min-w-[120px]"
                            >
                              <div className="text-center space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {label}
                                </div>
                                <div className="text-lg font-bold text-primary">
                                  {formatCurrency(data.amount, currencyCode)}
                                </div>
                                {data.amount > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {data.amount > 1000 ? 'High spending' : 
                                     data.amount > 500 ? 'Moderate spending' : 
                                     'Low spending'}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        }}
                        cursor={{
                          fill: 'hsl(var(--muted))',
                          opacity: 0.1
                        }}
                      />
                      <Bar
                        dataKey="amount"
                        radius={[4, 4, 0, 0]}
                        label={({ value, x, y, width }) => {
                          if (value === 0 || isMobile) return null;
                          return (
                            <text
                              x={x + width / 2}
                              y={y - 6}
                              fill="hsl(var(--muted-foreground))"
                              textAnchor="middle"
                              fontSize="9"
                              fontWeight="600"
                              className="drop-shadow-sm"
                            >
                              {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                            </text>
                          );
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📈</div>
              <p className="text-muted-foreground">Add expenses to see trends</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const TrendsCard = React.memo(TrendsCardComponent);
