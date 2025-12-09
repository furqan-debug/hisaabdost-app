import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourTooltip } from './TourTooltip';
import { tourSteps } from './tourSteps';
import { TargetRect } from './types';

interface SpotlightOverlayProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  currentStep,
  onNext,
  onPrev,
  onSkip,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const step = tourSteps[currentStep];
  const padding = 8;

  const updateTargetRect = useCallback(() => {
    if (!step) return;
    
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step]);

  useEffect(() => {
    updateTargetRect();
    
    // Update on resize or scroll
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  if (!step || !targetRect) return null;

  // Calculate tooltip position based on step placement
  const getTooltipPosition = () => {
    const tooltipWidth = 320;
    const tooltipHeight = 240;
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
  const clipPath = `polygon(
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
  )`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`tour-step-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[10000] pointer-events-auto"
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

        {/* Neon border around spotlight */}
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
