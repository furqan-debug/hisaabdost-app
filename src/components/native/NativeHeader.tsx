
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePlatform } from '@/hooks/usePlatform';
import { lightImpact } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface NativeHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export const NativeHeader: React.FC<NativeHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  className,
  transparent = false,
}) => {
  const { isIOS } = usePlatform();
  const navigate = useNavigate();

  const handleBack = async () => {
    await lightImpact();
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'sticky top-0 z-40 w-full',
        !transparent && 'bg-background/95 backdrop-blur-md border-b border-border/50',
        'safe-top',
        className
      )}
    >
      <div 
        className={cn(
          'flex items-center h-14 px-4',
          isIOS ? 'justify-center' : 'justify-start'
        )}
      >
        {/* Back button - positioned absolutely on iOS for centered title */}
        {showBack && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className={cn(
              'flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2',
              isIOS ? 'absolute left-2' : 'mr-2'
            )}
            aria-label="Go back"
          >
            <ChevronLeft className={cn(
              'h-6 w-6',
              isIOS ? 'text-primary' : 'text-foreground'
            )} />
            {isIOS && <span className="text-primary text-base">Back</span>}
          </motion.button>
        )}

        {/* Title section */}
        <div className={cn(
          'flex flex-col',
          isIOS ? 'items-center' : 'items-start',
          showBack && !isIOS && 'ml-1'
        )}>
          <h1 className={cn(
            'font-semibold text-foreground truncate',
            isIOS ? 'text-[17px]' : 'text-xl'
          )}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right action - positioned absolutely on iOS */}
        {rightAction && (
          <div className={cn(
            'flex items-center min-h-[44px]',
            isIOS ? 'absolute right-2' : 'ml-auto'
          )}>
            {rightAction}
          </div>
        )}
      </div>
    </motion.header>
  );
};
