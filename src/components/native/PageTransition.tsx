
import React from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { usePlatform } from '@/hooks/usePlatform';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();
  const { isIOS } = usePlatform();

  // iOS: Slide from right with shadow
  // Android: Fade + subtle vertical shift
  const variants = {
    initial: isIOS 
      ? { x: '100%', opacity: 1 } 
      : { opacity: 0, y: 20 },
    animate: isIOS 
      ? { x: 0, opacity: 1 } 
      : { opacity: 1, y: 0 },
    exit: isIOS 
      ? { x: '-30%', opacity: 0.8 } 
      : { opacity: 0, y: -10 },
  };

  const springTransition: Transition = { 
    type: 'spring', 
    stiffness: 300, 
    damping: 30 
  };
  
  const tweenTransition: Transition = { 
    type: 'tween', 
    duration: 0.25, 
    ease: 'easeInOut'
  };

  const transition = isIOS ? springTransition : tweenTransition;

  return (
    <motion.div
      key={location.pathname}
      variants={variants}
      initial="initial"
      animate="animate"
      transition={transition}
      style={{ 
        width: '100%', 
        height: '100%',
      }}
    >
      {children}
    </motion.div>
  );
};
