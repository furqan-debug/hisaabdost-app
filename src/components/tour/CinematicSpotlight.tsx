import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourCard } from './TourCard';
import { tourSteps } from './tourSteps';
import { TargetRect } from './types';
import { ParticleField } from './ParticleField';

interface CinematicSpotlightProps {
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onOpenMoreSheet?: () => void;
  onCloseMoreSheet?: () => void;
}

export const CinematicSpotlight: React.FC<CinematicSpotlightProps> = ({
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onOpenMoreSheet,
  onCloseMoreSheet,
}) => {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [prevRect, setPrevRect] = useState<TargetRect | null>(null);
  const [multipleRects, setMultipleRects] = useState<TargetRect[]>([]);
  const [isWaitingForElement, setIsWaitingForElement] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const waitIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const step = tourSteps[currentStep];
  const padding = 12;

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
      setPrevRect(targetRect);
      setTargetRect(rect);
      setIsWaitingForElement(false);
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 400);
      
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
  }, [step, getElementRect, targetRect]);

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
    if (!targetRect) return { top: window.innerHeight / 2, left: window.innerWidth / 2 - 160 };
    
    const tooltipWidth = 340;
    const tooltipHeight = 320;
    const gap = 20;
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

    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, viewportHeight - tooltipHeight - 16));

    return { top, left };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`cinematic-tour-${currentStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[10001] pointer-events-auto"
        onClick={onSkip}
      >
        {/* Aurora gradient overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.15) 0%, transparent 40%),
              radial-gradient(ellipse at 70% 80%, hsl(var(--primary) / 0.1) 0%, transparent 40%),
              linear-gradient(to bottom, hsl(var(--background) / 0.95), hsl(var(--background) / 0.98))
            `,
          }}
          animate={{
            opacity: [0.9, 1, 0.9],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Ambient particles */}
        <ParticleField count={15} />

        {/* Dark overlay with morphing spotlight cutout */}
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
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            style={{
              background: 'linear-gradient(135deg, hsl(var(--background) / 0.85) 0%, hsl(var(--background) / 0.9) 100%)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}

        {/* Spotlight glow ring */}
        {targetRect && (
          <motion.div
            className="absolute rounded-2xl pointer-events-none"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            {/* Animated border */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.5), hsl(var(--primary)))',
                backgroundSize: '200% 100%',
                padding: '2px',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '200% 0%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <div className="w-full h-full rounded-2xl bg-transparent" />
            </motion.div>

            {/* Glow effect */}
            <motion.div
              className="absolute -inset-2 rounded-3xl opacity-50"
              style={{
                background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.4) 0%, transparent 70%)',
              }}
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Ripple effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary/40"
              animate={{
                scale: [1, 1.15],
                opacity: [0.6, 0],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
          </motion.div>
        )}

        {/* Multiple element highlights */}
        {multipleRects.map((rect, index) => (
          <motion.div
            key={`multi-${index}`}
            className="absolute rounded-xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            }}
            transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-primary/60"
              animate={{
                boxShadow: [
                  '0 0 15px hsl(var(--primary) / 0.3)',
                  '0 0 25px hsl(var(--primary) / 0.5)',
                  '0 0 15px hsl(var(--primary) / 0.3)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
            />
          </motion.div>
        ))}

        {/* Tour Card */}
        <div onClick={(e) => e.stopPropagation()}>
          <TourCard
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
