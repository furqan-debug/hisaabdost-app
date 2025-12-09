import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourCard } from './TourCard';
import { tourSteps } from './tourSteps';
import { TargetRect } from './types';

interface CinematicSpotlightProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onOpenMoreSheet?: () => void;
  onCloseMoreSheet?: () => void;
}

// Consistent z-index hierarchy
const Z_INDEX = {
  overlay: 9990,
  spotlight: 9991,
  border: 9992,
  card: 9995,
};

export const CinematicSpotlight: React.FC<CinematicSpotlightProps> = ({
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
  const cardRef = useRef<HTMLDivElement>(null);
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
      
      const element = document.getElementById(step.targetId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (step.action === 'highlight-multiple' && step.actionPayload?.multipleTargets) {
      const rects = step.actionPayload.multipleTargets
        .map(id => getElementRect(id))
        .filter((r): r is TargetRect => r !== null);
      setMultipleRects(rects);
    } else {
      setMultipleRects([]);
    }
  }, [step, getElementRect]);

  useEffect(() => {
    if (!step) return;

    if (waitIntervalRef.current) {
      clearInterval(waitIntervalRef.current);
      waitIntervalRef.current = null;
    }

    if (step.action === 'click' && step.actionPayload?.triggerId) {
      const trigger = document.getElementById(step.actionPayload.triggerId);
      if (trigger) {
        setTimeout(() => {
          trigger.click();
          if (onOpenMoreSheet) onOpenMoreSheet();
        }, 300);
      }
    }

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
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  useEffect(() => {
    return () => {
      if (step?.id === 'family-management' && onCloseMoreSheet) {
        onCloseMoreSheet();
      }
    };
  }, [step?.id, onCloseMoreSheet]);

  if (!step || (!targetRect && !isWaitingForElement)) return null;

  const getTooltipPosition = () => {
    if (!targetRect) return { top: window.innerHeight / 2, left: window.innerWidth / 2 - 150 };
    
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    const cardHeight = cardRef.current?.offsetHeight || 260;
    const gap = 16;
    const safeArea = { top: 16, bottom: 16, left: 16, right: 16 };
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let actualPlacement = step.position;

    // Calculate preferred position
    switch (step.position) {
      case 'bottom':
        top = targetRect.top + targetRect.height + gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        // Fallback to top if not enough space below
        if (top + cardHeight > viewportHeight - safeArea.bottom) {
          top = targetRect.top - cardHeight - gap;
          actualPlacement = 'top';
        }
        break;
      case 'top':
        top = targetRect.top - cardHeight - gap;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        // Fallback to bottom if not enough space above
        if (top < safeArea.top) {
          top = targetRect.top + targetRect.height + gap;
          actualPlacement = 'bottom';
        }
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        left = targetRect.left - tooltipWidth - gap;
        // Fallback to right if not enough space on left
        if (left < safeArea.left) {
          left = targetRect.left + targetRect.width + gap;
          actualPlacement = 'right';
        }
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - cardHeight / 2;
        left = targetRect.left + targetRect.width + gap;
        // Fallback to left if not enough space on right
        if (left + tooltipWidth > viewportWidth - safeArea.right) {
          left = targetRect.left - tooltipWidth - gap;
          actualPlacement = 'left';
        }
        break;
    }

    // Final boundary checks
    left = Math.max(safeArea.left, Math.min(left, viewportWidth - tooltipWidth - safeArea.right));
    top = Math.max(safeArea.top, Math.min(top, viewportHeight - cardHeight - safeArea.bottom));

    return { top, left, placement: actualPlacement };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`cinematic-tour-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 overflow-hidden pointer-events-auto"
        style={{ zIndex: Z_INDEX.overlay }}
        onClick={onSkip}
      >
        {/* Simple dark overlay with spotlight cutout */}
        {targetRect && (
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{
              clipPath: `polygon(
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
              )`,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            style={{
              background: 'hsl(var(--background) / 0.9)',
              zIndex: Z_INDEX.overlay,
            }}
          />
        )}

        {/* Spotlight border */}
        {targetRect && (
          <motion.div
            className="absolute rounded-xl pointer-events-none"
            style={{ zIndex: Z_INDEX.border }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          >
            {/* Border */}
            <div 
              className="absolute inset-0 rounded-xl border-2 border-primary"
              style={{
                boxShadow: '0 0 20px hsl(var(--primary) / 0.3), inset 0 0 20px hsl(var(--primary) / 0.1)',
              }}
            />
          </motion.div>
        )}

        {/* Multiple element highlights */}
        {multipleRects.map((rect, index) => (
          <motion.div
            key={`multi-${index}`}
            className="absolute rounded-lg pointer-events-none border-2 border-primary/60"
            style={{ zIndex: Z_INDEX.border }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
          />
        ))}

        {/* Tour Card */}
        <div 
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
          style={{ zIndex: Z_INDEX.card }}
        >
          <TourCard
            step={step}
            currentStep={currentStep}
            totalSteps={tourSteps.length}
            onNext={onNext}
            onPrev={onPrev}
            onSkip={onSkip}
            position={tooltipPosition}
            placement={tooltipPosition.placement || step.position}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
