import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TourStep } from './types';

interface TourTooltipProps {
  step: TourStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  position: { top: number; left: number };
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export const TourTooltip: React.FC<TourTooltipProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  position,
  placement,
}) => {
  const Icon = step.icon;
  const isLastStep = currentStep === totalSteps - 1;

  // Calculate transform origin based on placement
  const getTransformStyle = () => {
    switch (placement) {
      case 'top':
        return { transformOrigin: 'bottom center' };
      case 'bottom':
        return { transformOrigin: 'top center' };
      case 'left':
        return { transformOrigin: 'right center' };
      case 'right':
        return { transformOrigin: 'left center' };
      default:
        return {};
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: placement === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10001,
        ...getTransformStyle(),
      }}
      className="w-[280px] sm:w-[320px]"
    >
      <div className="relative rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Neon glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-primary/20 to-transparent opacity-50 blur-sm pointer-events-none" />
        
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative p-5">
          {/* Icon and Title */}
          <div className="flex items-center gap-3 mb-3">
            {Icon && (
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-foreground pr-6">
              {step.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep 
                    ? 'w-6 bg-primary' 
                    : i < currentStep 
                      ? 'w-1.5 bg-primary/50' 
                      : 'w-1.5 bg-muted-foreground/30'
                }`}
                initial={false}
                animate={{ 
                  scale: i === currentStep ? 1 : 0.9,
                }}
              />
            ))}
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

            <Button
              size="sm"
              onClick={onNext}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 shadow-lg shadow-primary/25"
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
