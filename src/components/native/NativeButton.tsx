
import React from 'react';
import { motion } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { lightImpact } from '@/utils/haptics';
import { buttonPressVariants } from '@/utils/nativeAnimations';
import { cn } from '@/lib/utils';

interface NativeButtonProps extends ButtonProps {
  haptic?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
}

export const NativeButton = React.forwardRef<HTMLButtonElement, NativeButtonProps>(
  ({ className, haptic = true, hapticIntensity = 'light', onClick, children, ...props }, ref) => {
    
    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (haptic) {
        await lightImpact();
      }
      onClick?.(e);
    };

    return (
      <motion.div
        whileTap={buttonPressVariants.tap}
        whileHover={buttonPressVariants.hover}
        style={{ display: 'inline-block', width: props.size === 'icon' ? 'auto' : '100%' }}
      >
        <Button
          ref={ref}
          className={cn(
            // Ensure minimum touch target size
            'min-h-[44px] min-w-[44px]',
            className
          )}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

NativeButton.displayName = 'NativeButton';
