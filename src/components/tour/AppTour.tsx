import React from 'react';
import { createPortal } from 'react-dom';
import { SpotlightOverlay } from './SpotlightOverlay';
import { useAppTour } from '@/hooks/useAppTour';
import { tourSteps } from './tourSteps';

export const AppTour: React.FC = () => {
  const { showTour, currentStep, nextStep, prevStep, skipTour } = useAppTour();

  if (!showTour) return null;

  const handleNext = () => {
    nextStep(tourSteps.length);
  };

  return createPortal(
    <SpotlightOverlay
      currentStep={currentStep}
      onNext={handleNext}
      onPrev={prevStep}
      onSkip={skipTour}
    />,
    document.body
  );
};
