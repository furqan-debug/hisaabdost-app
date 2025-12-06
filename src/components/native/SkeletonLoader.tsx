
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
}) => {
  const baseClasses = 'bg-muted/60 animate-shimmer bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 bg-[length:200%_100%]';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(baseClasses, variantClasses[variant], className)}
      style={{ width, height }}
    />
  );
};

interface ListSkeletonProps {
  count?: number;
  itemHeight?: number;
  showAvatar?: boolean;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  itemHeight = 72,
  showAvatar = true,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center p-4 bg-card rounded-xl"
          style={{ minHeight: itemHeight }}
        >
          {showAvatar && (
            <Skeleton 
              variant="circular" 
              className="w-10 h-10 flex-shrink-0 mr-3" 
            />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton className="w-3/4 h-4" />
            <Skeleton className="w-1/2 h-3" />
          </div>
          <Skeleton className="w-16 h-5 ml-3" />
        </motion.div>
      ))}
    </div>
  );
};

interface CardSkeletonProps {
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('bg-card rounded-xl p-4 space-y-3', className)}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="w-24 h-5" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton className="w-full h-8" />
      <div className="flex gap-2">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-16 h-6" />
      </div>
    </motion.div>
  );
};

interface ChartSkeletonProps {
  className?: string;
  type?: 'bar' | 'line' | 'pie';
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ 
  className,
  type = 'bar' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('bg-card rounded-xl p-4', className)}
    >
      <Skeleton className="w-32 h-5 mb-4" />
      
      {type === 'bar' && (
        <div className="flex items-end justify-around h-40 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton 
              key={i}
              variant="rounded"
              className="w-8"
              height={`${30 + Math.random() * 70}%`}
            />
          ))}
        </div>
      )}
      
      {type === 'pie' && (
        <div className="flex items-center justify-center h-40">
          <Skeleton variant="circular" className="w-32 h-32" />
        </div>
      )}
      
      {type === 'line' && (
        <div className="h-40 flex items-center justify-center">
          <Skeleton variant="rounded" className="w-full h-24" />
        </div>
      )}
    </motion.div>
  );
};
