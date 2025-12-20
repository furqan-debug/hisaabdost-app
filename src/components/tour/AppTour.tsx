import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { TourIntroSequence } from './TourIntroSequence';
import { CinematicSpotlight } from './CinematicSpotlight';
import { TourCompletionCelebration } from './TourCompletionCelebration';
import { useAppTour } from '@/hooks/useAppTour';
import { tourSteps } from './tourSteps';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const AppTour: React.FC = () => {
  const { 
    showTour, 
    tourPhase,
    currentStep, 
    nextStep, 
    prevStep, 
    skipTour, 
    startTour,
    finishCelebration 
  } = useAppTour();
  const { user } = useAuth();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [userName, setUserName] = useState<string | undefined>();

  // Fetch user name for personalized greeting
  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.id) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, display_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          const name = data.display_name || data.full_name;
          if (name) {
            setUserName(name.split(' ')[0]); // First name only
          }
        }
      }
    };
    fetchUserName();
  }, [user?.id]);

  const handleNext = useCallback(() => {
    const currentStepData = tourSteps[currentStep];
    
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

  const handleCelebrationComplete = useCallback(() => {
    finishCelebration();
  }, [finishCelebration]);

  if (!showTour) return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {tourPhase === 'intro' && (
        <TourIntroSequence
          key="intro"
          onStart={startTour}
          onSkip={skipTour}
          userName={userName}
        />
      )}
      
      {tourPhase === 'touring' && (
        <CinematicSpotlight
          key="touring"
          currentStep={currentStep}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onOpenMoreSheet={handleOpenMoreSheet}
          onCloseMoreSheet={handleCloseMoreSheet}
        />
      )}
      
      {tourPhase === 'celebration' && (
        <TourCompletionCelebration
          key="celebration"
          onComplete={handleCelebrationComplete}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};
