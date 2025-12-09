import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourTooltip } from './TourTooltip';
import { tourSteps } from './tourSteps';
import { TargetRect } from './types';

interface SpotlightOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onOpenMoreSheet?: () => void;
  onCloseMoreSheet?: () => void;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onOpenMoreSheet,
  onCloseMoreSheet,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [multipleRects, setMultipleRects] = useState<TargetRect[]>([]);
  const [isWaitingForElement, setIsWaitingForElement] = useState(false);
  const waitIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const step = tourSteps[currentStep];
  const padding = 8;

  const getElementRect = useCallback((elementId: string): TargetRect | null => {
    const element = document.getElementById(elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };
    }
    return null;
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    
    const rect = getElementRect(step.targetId);
    if (rect) {
      setTargetRect(rect);
      setIsWaitingForElement(false);
      
      // Scroll element into view if needed
      const element = document.getElementById(step.targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Handle multiple targets for highlight-multiple action
    if (step.action === 'highlight-multiple' && step.actionPayload?.multipleTargets) {
      const rects = step.actionPayload.multipleTargets
        .map(id => getElementRect(id))
        .filter((r): r is TargetRect => r !== null);
      setMultipleRects(rects);
    } else {
      setMultipleRects([]);
    }
  }, [step, getElementRect]);

  // Handle actions when step changes
  useEffect(() => {
    if (!step) return;

    // Clear any existing wait interval
    if (waitIntervalRef.current) {
      clearInterval(waitIntervalRef.current);
      waitIntervalRef.current = null;
    }

    // Handle click action - trigger click on element
    if (step.action === 'click' && step.actionPayload?.triggerId) {
      const trigger = document.getElementById(step.actionPayload.triggerId);
      if (trigger) {
        // Small delay to ensure overlay is visible first
        setTimeout(() => {
          trigger.click();
          if (onOpenMoreSheet) onOpenMoreSheet();
        }, 300);
      }
    }

    // Handle waitForElement - poll until element appears
    if (step.waitForElement) {
      setIsWaitingForElement(true);
      waitIntervalRef.current = setInterval(() => {
        const element = document.getElementById(step.targetId);
        if (element) {
          updateTargetRect();
          if (waitIntervalRef.current) {
            clearInterval(waitIntervalRef.current);
            waitIntervalRef.current = null;
          }
        }
      }, 100);
    } else {
      updateTargetRect();
    }

    return () => {
      if (waitIntervalRef.current) {
        clearInterval(waitIntervalRef.current);
      }
    };
  }, [step, updateTargetRect, onOpenMoreSheet]);

  useEffect(() => {
    // Update on resize or scroll
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  // Close more sheet when leaving family step
  useEffect(() => {
    return () => {
      if (step?.id === 'family-management' && onCloseMoreSheet) {
        onCloseMoreSheet();
      }
    };
  }, [step?.id, onCloseMoreSheet]);

  if (!step || (!targetRect && !isWaitingForElement)) return null;

  // Calculate tooltip position based on step placement
  const getTooltipPosition = () => {
    if (!targetRect) return { top: window.innerHeight / 2, left: window.innerWidth / 2 - 160 };
    
    const tooltipWidth = 320;
    const tooltipHeight = 280;
    const gap = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = targetRect.top + targetRect.height + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = targetRect.top - tooltipHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
        left = targetRect.left + targetRect.width + gap;
        break;
    }

    // Keep tooltip within viewport bounds
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 16));

    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();

  // Create clip path for spotlight effect
  const clipPath = targetRect ? `polygon(
    0% 0%, 
    0% 100%, 
    ${targetRect.left}px 100%, 
    ${targetRect.left}px ${targetRect.top}px, 
    ${targetRect.left + targetRect.width}px ${targetRect.top}px, 
    ${targetRect.left + targetRect.width}px ${targetRect.top + targetRect.height}px, 
    ${targetRect.left}px ${targetRect.top + targetRect.height}px, 
    ${targetRect.left}px 100%, 
    100% 100%, 
    100% 0%
  )` : 'none';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`tour-step-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[10001] pointer-events-auto"
        onClick={onSkip}
      >
        {/* Dark overlay with spotlight cutout */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-[2px]"
          style={{ clipPath }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Neon border around main spotlight */}
        {targetRect && (
          <motion.div
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 0 2px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
                '0 0 0 2px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.6), 0 0 60px hsl(var(--primary) / 0.3)',
                '0 0 0 2px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.4), 0 0 40px hsl(var(--primary) / 0.2)',
              ],
            }}
            transition={{ 
              duration: 0.4,
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            }}
          />
        )}

        {/* Multiple element highlights for Quick Actions */}
        {multipleRects.map((rect, index) => (
          <motion.div
            key={`multi-highlight-${index}`}
            className="absolute rounded-lg pointer-events-none border-2 border-primary/60"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: [
                '0 0 10px hsl(var(--primary) / 0.3)',
                '0 0 20px hsl(var(--primary) / 0.5)',
                '0 0 10px hsl(var(--primary) / 0.3)',
              ],
            }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.3,
              boxShadow: {
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: index * 0.2,
              }
            }}
          />
        ))}

        {/* Tooltip */}
        <div onClick={(e) => e.stopPropagation()}>
          <TourTooltip
            step={step}
            currentStep={currentStep}
            totalSteps={tourSteps.length}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
            position={tooltipPosition}
            placement={step.position}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
