import { useState, useEffect, useCallback } from 'react';

const APP_TOUR_KEY = 'hasCompletedAppTour';

export function useAppTour() {
  const [showTour, setShowTour] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has completed the tour
    const hasCompleted = localStorage.getItem(APP_TOUR_KEY);
    if (!hasCompleted) {
      // Small delay to let the dashboard render first
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const nextStep = useCallback((totalSteps: number) => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    localStorage.setItem(APP_TOUR_KEY, 'true');
    setShowTour(false);
    setCurrentStep(0);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(APP_TOUR_KEY, 'true');
    setShowTour(false);
    setCurrentStep(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(APP_TOUR_KEY);
    setCurrentStep(0);
    setShowTour(true);
  }, []);

  return {
    showTour,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    resetTour,
  };
}
