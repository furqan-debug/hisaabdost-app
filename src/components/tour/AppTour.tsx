import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SpotlightOverlay } from './SpotlightOverlay';
import { useAppTour } from '@/hooks/useAppTour';
import { tourSteps } from './tourSteps';

export const AppTour: React.FC = () => {
  const { showTour, currentStep, nextStep, prevStep, skipTour, completeTour } = useAppTour();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  const handleNext = useCallback(() => {
    const currentStepData = tourSteps[currentStep];
    
    // Close more sheet when leaving family step
    if (currentStepData?.id === 'family-management') {
      setMoreSheetOpen(false);
    }
    
    nextStep(tourSteps.length);
  }, [currentStep, nextStep]);

  const handleSkip = useCallback(() => {
    setMoreSheetOpen(false);
    skipTour();
  }, [skipTour]);

  const handlePrev = useCallback(() => {
    const currentStepData = tourSteps[currentStep];
    
    // Close more sheet when going back from family step
    if (currentStepData?.id === 'family-management') {
      setMoreSheetOpen(false);
    }
    
    prevStep();
  }, [currentStep, prevStep]);

  const handleOpenMoreSheet = useCallback(() => {
    setMoreSheetOpen(true);
  }, []);

  const handleCloseMoreSheet = useCallback(() => {
    setMoreSheetOpen(false);
  }, []);

  if (!showTour) return null;

  return createPortal(
    <SpotlightOverlay
      currentStep={currentStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSkip={handleSkip}
      onOpenMoreSheet={handleOpenMoreSheet}
      onCloseMoreSheet={handleCloseMoreSheet}
    />,
    document.body
  );
};
