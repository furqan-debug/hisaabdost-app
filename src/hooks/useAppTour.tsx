import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const APP_TOUR_KEY = 'hasCompletedAppTour';

interface AppTourContextType {
  showTour: boolean;
  currentStep: number;
  nextStep: (totalSteps: number) => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

const AppTourContext = createContext<AppTourContextType | null>(null);

export function AppTourProvider({ children }: { children: React.ReactNode }) {
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
    // Small delay to ensure sheets are closed
    setTimeout(() => {
      setShowTour(true);
    }, 500);
  }, []);

  return (
    <AppTourContext.Provider value={{
      showTour,
      currentStep,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      resetTour,
    }}>
      {children}
    </AppTourContext.Provider>
  );
}

export function useAppTour() {
  const context = useContext(AppTourContext);
  if (!context) {
    throw new Error('useAppTour must be used within an AppTourProvider');
  }
  return context;
}
