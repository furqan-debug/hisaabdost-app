
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';
import { usePlatform } from '@/hooks/usePlatform';
import { lightImpact, notificationWarning } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onAction: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onEdit?: () => void;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
  disabled?: boolean;
}

const ACTION_WIDTH = 80;
const THRESHOLD = 0.4;

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  onEdit,
  leftActions,
  rightActions,
  className,
  disabled = false,
}) => {
  const { isIOS } = usePlatform();
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default right actions if onDelete or onEdit provided
  const defaultRightActions: SwipeAction[] = [];
  if (onEdit) {
    defaultRightActions.push({
      icon: <Edit className="w-5 h-5" />,
      label: 'Edit',
      color: 'text-primary-foreground',
      bgColor: 'bg-primary',
      onAction: onEdit,
    });
  }
  if (onDelete) {
    defaultRightActions.push({
      icon: <Trash2 className="w-5 h-5" />,
      label: 'Delete',
      color: 'text-destructive-foreground',
      bgColor: 'bg-destructive',
      onAction: onDelete,
    });
  }

  const effectiveRightActions = rightActions || defaultRightActions;
  const effectiveLeftActions = leftActions || [];

  const rightActionsWidth = effectiveRightActions.length * ACTION_WIDTH;
  const leftActionsWidth = effectiveLeftActions.length * ACTION_WIDTH;

  // Transform for action reveal
  const rightActionsOpacity = useTransform(x, [-rightActionsWidth, 0], [1, 0]);
  const leftActionsOpacity = useTransform(x, [0, leftActionsWidth], [0, 1]);

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (disabled) return;

    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Swipe right (reveal left actions)
    if (offset > leftActionsWidth * THRESHOLD || velocity > 500) {
      if (effectiveLeftActions.length > 0) {
        await lightImpact();
        animate(x, leftActionsWidth, { type: 'spring', stiffness: 500, damping: 30 });
        return;
      }
    }

    // Swipe left (reveal right actions)
    if (offset < -rightActionsWidth * THRESHOLD || velocity < -500) {
      if (effectiveRightActions.length > 0) {
        await lightImpact();
        animate(x, -rightActionsWidth, { type: 'spring', stiffness: 500, damping: 30 });
        return;
      }
    }

    // Snap back
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
  };

  const handleActionClick = async (action: SwipeAction) => {
    await notificationWarning();
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
    action.onAction();
  };

  const closeSwipe = () => {
    animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
  };

  if (disabled || (effectiveLeftActions.length === 0 && effectiveRightActions.length === 0)) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onClick={() => x.get() !== 0 && closeSwipe()}
    >
      {/* Left actions (revealed when swiping right) */}
      {effectiveLeftActions.length > 0 && (
        <motion.div 
          className="absolute left-0 top-0 bottom-0 flex"
          style={{ opacity: leftActionsOpacity }}
        >
          {effectiveLeftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center h-full',
                action.bgColor,
                action.color
              )}
              style={{ width: ACTION_WIDTH }}
            >
              {action.icon}
              <span className="text-xs mt-1 font-medium">{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Right actions (revealed when swiping left) */}
      {effectiveRightActions.length > 0 && (
        <motion.div 
          className="absolute right-0 top-0 bottom-0 flex"
          style={{ opacity: rightActionsOpacity }}
        >
          {effectiveRightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              className={cn(
                'flex flex-col items-center justify-center h-full',
                action.bgColor,
                action.color,
                isIOS && 'first:rounded-l-lg'
              )}
              style={{ width: ACTION_WIDTH }}
            >
              {action.icon}
              <span className="text-xs mt-1 font-medium">{action.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Main content */}
      <motion.div
        drag="x"
        dragConstraints={{ 
          left: -rightActionsWidth, 
          right: leftActionsWidth 
        }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative bg-card z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};
