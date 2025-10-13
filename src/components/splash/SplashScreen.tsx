
"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    
    const contentTimer = setTimeout(() => setShowContent(true), 100);
    const completeTimer = setTimeout(() => {
      document.body.classList.remove('no-scroll');
      onComplete();
    }, 1500); // Reduced from 2000ms

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(completeTimer);
      document.body.classList.remove('no-scroll');
    };
  }, [onComplete]);

  // Simplified animations for better performance
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const logoVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { 
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const textVariants = {
    initial: { y: 20, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { delay: 0.3, duration: 0.4 }
    }
  };

  return (
    <motion.div
      key="splash"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-50 bg-gradient-to-br from-[#F2FCE2] to-[#E5DEFF]"
    >
      {showContent && (
        <>
          <motion.img
            variants={logoVariants}
            initial="initial"
            animate="animate"
            src="/lovable-uploads/c7ab51e7-0804-495b-a69f-879166069459.png"
            alt="Hisaab Dost Logo"
            className="w-24 h-24 mb-6"
          />

          <motion.h1
            variants={textVariants}
            initial="initial"
            animate="animate"
            className="text-4xl font-bold text-[#6E59A5] mb-2"
          >
            Hisaab Dost
          </motion.h1>

          <motion.p
            variants={textVariants}
            initial="initial"
            animate="animate"
            className="text-base font-medium text-[#7E69AB]"
          >
            Master your home budget with ease
          </motion.p>
        </>
      )}
    </motion.div>
  );
};
