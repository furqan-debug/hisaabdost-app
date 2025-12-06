
import React from 'react';
import { motion } from 'framer-motion';
import { usePlatform } from '@/hooks/usePlatform';
import { listContainerVariants, listItemVariants } from '@/utils/nativeAnimations';
import { cn } from '@/lib/utils';

interface NativeListProps {
  children: React.ReactNode;
  className?: string;
  grouped?: boolean;
}

interface NativeListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  showChevron?: boolean;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  destructive?: boolean;
}

export const NativeList: React.FC<NativeListProps> = ({
  children,
  className,
  grouped = false,
}) => {
  const { isIOS } = usePlatform();

  return (
    <motion.div
      variants={listContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'w-full',
        grouped && isIOS && 'bg-card rounded-xl overflow-hidden',
        grouped && !isIOS && 'space-y-px',
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NativeListItem: React.FC<NativeListItemProps> = ({
  children,
  className,
  onClick,
  showChevron = false,
  icon,
  trailing,
  destructive = false,
}) => {
  const { isIOS } = usePlatform();

  const content = (
    <>
      {icon && (
        <div className={cn(
          'flex items-center justify-center',
          isIOS ? 'w-7 h-7 rounded-md mr-3' : 'w-10 h-10 rounded-full mr-4',
          destructive ? 'text-destructive' : 'text-primary'
        )}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {children}
      </div>
      {trailing && (
        <div className="ml-3 flex-shrink-0">
          {trailing}
        </div>
      )}
      {showChevron && (
        <svg 
          className={cn(
            'w-4 h-4 flex-shrink-0 ml-2',
            isIOS ? 'text-muted-foreground/50' : 'text-muted-foreground'
          )}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </>
  );

  const itemClasses = cn(
    'flex items-center w-full text-left',
    // Touch target size
    'min-h-[48px]',
    // Padding
    isIOS ? 'px-4 py-3' : 'px-4 py-3',
    // Background and hover
    'bg-card hover:bg-accent/50 active:bg-accent',
    // Border
    isIOS && 'border-b border-border/50 last:border-b-0',
    // Text color
    destructive ? 'text-destructive' : 'text-foreground',
    // Transitions
    'transition-colors duration-150',
    className
  );

  if (onClick) {
    return (
      <motion.button
        variants={listItemVariants}
        whileTap={{ scale: 0.98, backgroundColor: 'hsl(var(--accent))' }}
        onClick={onClick}
        className={itemClasses}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div variants={listItemVariants} className={itemClasses}>
      {content}
    </motion.div>
  );
};
