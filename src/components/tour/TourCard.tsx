import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TourStep } from './types';
import { FinnyDemoPreview } from './FinnyDemoPreview';
import { FinnyGuide } from './FinnyGuide';

interface TourCardProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  position: { top: number; left: number };
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export const TourCard: React.FC<TourCardProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position,
  placement,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const Icon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;
  const showFinnyDemo = step.action === 'demo' && step.actionPayload?.demoType === 'finny-preview';

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < step.description.length) {
        setDisplayedText(step.description.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [step.description, currentStep]);

  const getSlideDirection = () => {
    switch (placement) {
      case 'top': return { y: 20, x: 0 };
      case 'bottom': return { y: -20, x: 0 };
      case 'left': return { x: 20, y: 0 };
      case 'right': return { x: -20, y: 0 };
      default: return { y: 20, x: 0 };
    }
  };

  const slideDir = getSlideDirection();
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, ...slideDir }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10002,
      }}
      className="w-[300px] sm:w-[340px]"
    >
      {/* Glassmorphism card */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Animated gradient border */}
        <motion.div
          className="absolute -inset-[1px] rounded-3xl"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.3), hsl(var(--primary)))',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '200% 0%'],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Card content */}
        <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl p-5">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 rounded-3xl pointer-events-none" />

          {/* Skip button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header with Finny */}
          <div className="relative flex items-start gap-4 mb-4">
            <FinnyGuide size="sm" expression="happy" />
            
            <div className="flex-1 pt-1">
              {/* Icon and Title */}
              <div className="flex items-center gap-2">
                {Icon && (
                  <motion.div
                    animate={{ 
                      rotate: [0, -10, 10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-primary"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                )}
                <h3 className="text-lg font-semibold text-foreground pr-6">
                  {step.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Description with typewriter */}
          <div className="min-h-[48px] mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
                />
              )}
            </p>
          </div>

          {/* Finny Demo Preview */}
          {showFinnyDemo && <FinnyDemoPreview />}

          {/* Arc progress indicator */}
          <div className="relative flex justify-center mb-4">
            <svg width="120" height="24" viewBox="0 0 120 24">
              {/* Background arc */}
              <path
                d="M 10 20 Q 60 0 110 20"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Progress arc */}
              <motion.path
                d="M 10 20 Q 60 0 110 20"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </svg>
            {/* Step indicator */}
            <div className="absolute top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
              {currentStep + 1} / {totalSteps}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              disabled={currentStep === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="sm"
                onClick={onNext}
                className="relative bg-primary hover:bg-primary/90 text-primary-foreground px-6 shadow-lg shadow-primary/25 overflow-hidden"
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />
                <span className="relative flex items-center">
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                </span>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
