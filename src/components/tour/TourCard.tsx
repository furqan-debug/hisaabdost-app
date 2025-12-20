import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TourStep } from './types';
import { FinnyDemoPreview } from './FinnyDemoPreview';

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
      case 'top': return { y: 10 };
      case 'bottom': return { y: -10 };
      case 'left': return { x: 10 };
      case 'right': return { x: -10 };
      default: return { y: 10 };
    }
  };

  const slideDir = getSlideDirection();
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const cardWidth = Math.min(320, window.innerWidth - 32);

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
        width: cardWidth,
        zIndex: 9995,
      }}
    >
      {/* Card */}
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-xl">
        {/* Card content */}
        <div className="relative p-4">
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3 pr-8">
            {Icon && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            )}
            <h3 className="text-base font-semibold text-foreground leading-tight">
              {step.title}
            </h3>
          </div>

          {/* Description with typewriter */}
          <div className="min-h-[40px] mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {displayedText}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-middle"
                />
              )}
            </p>
          </div>

          {/* Finny Demo Preview */}
          {showFinnyDemo && <FinnyDemoPreview />}

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>Step {currentStep + 1} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrev}
              disabled={currentStep === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30 h-9"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button
              size="sm"
              onClick={onNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 h-9"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
