import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const APP_TOUR_KEY = 'hasCompletedAppTour';

type TourPhase = 'idle' | 'intro' | 'touring' | 'celebration';

interface AppTourContextType {
  showTour: boolean;
  tourPhase: TourPhase;
  currentStep: number;
  nextStep: (totalSteps: number) => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
  startTour: () => void;
  showCelebration: () => void;
  finishCelebration: () => void;
}

const AppTourContext = createContext<AppTourContextType | null>(null);

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  const [showTour, setShowTour] = useState(false);
  const [tourPhase, setTourPhase] = useState<TourPhase>('idle');
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasCompleted = localStorage.getItem(APP_TOUR_KEY);
    if (!hasCompleted) {
      const timer = setTimeout(() => {
        setShowTour(true);
        setTourPhase('intro');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setTourPhase('touring');
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback((totalSteps: number) => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setTourPhase('celebration');
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
    setTourPhase('idle');
    setCurrentStep(0);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(APP_TOUR_KEY, 'true');
    setShowTour(false);
    setTourPhase('idle');
    setCurrentStep(0);
  }, []);

  const showCelebration = useCallback(() => {
    setTourPhase('celebration');
  }, []);

  const finishCelebration = useCallback(() => {
    localStorage.setItem(APP_TOUR_KEY, 'true');
    setShowTour(false);
    setTourPhase('idle');
    setCurrentStep(0);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(APP_TOUR_KEY);
    setCurrentStep(0);
    setTimeout(() => {
      setShowTour(true);
      setTourPhase('intro');
    }, 500);
  }, []);

  return (
    <AppTourContext.Provider value={{
      showTour,
      tourPhase,
      currentStep,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      resetTour,
      startTour,
      showCelebration,
      finishCelebration,
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
