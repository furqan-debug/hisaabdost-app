
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";
import { motion } from "framer-motion";
import { CurrencyCode } from "@/utils/currencyUtils";

interface ComparisonItemProps {
  category: string;
  currentAmount: number;
  lastAmount: number;
  percentageChange: number;
  ratio: number;
  color: string;
  index: number;
  currencyCode: CurrencyCode;
}

export function ComparisonItem({
  category,
  currentAmount,
  lastAmount,
  percentageChange,
  ratio,
  color,
  index,
  currencyCode
}: ComparisonItemProps) {
  const isIncrease = percentageChange > 0;
  const isUnchanged = Math.abs(percentageChange) < 0.1;

  const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.3
      }
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2.5"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-[15px]">{category}</span>
        </div>
        <div className={cn(
          "flex items-center gap-1 font-bold text-[14px]",
          isIncrease ? "text-red-500 dark:text-red-400" : 
          isUnchanged ? "text-gray-500 dark:text-gray-400" : 
          "text-green-500 dark:text-green-400"
        )}>
          {isIncrease ? (
            <TrendingUpIcon className="w-3.5 h-3.5" />
          ) : isUnchanged ? (
            <MinusIcon className="w-3.5 h-3.5" />
          ) : (
            <TrendingDownIcon className="w-3.5 h-3.5" />
          )}
          <span>
            {isIncrease ? "+" : ""}{Math.abs(percentageChange).toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm mb-2 gap-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {formatCurrency(currentAmount, currencyCode)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Previous</div>
          <div className="font-medium text-gray-800 dark:text-gray-200">
            {formatCurrency(lastAmount, currencyCode)}
          </div>
        </div>
      </div>
      
      <div className="h-3 bg-[#e9ecef] dark:bg-[#222] rounded-full overflow-hidden relative">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            isIncrease ? "bg-red-400 dark:bg-red-500" : 
            isUnchanged ? "bg-gray-400 dark:bg-gray-500" :
            "bg-green-400 dark:bg-green-500"
          )}
          style={{ width: `${ratio}%`, maxWidth: '100%' }}
        />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white/40 dark:bg-black/40" style={{ left: '100%' }} />
      </div>
    </motion.div>
  );
}
