
import { Transition, Variants } from 'framer-motion';
import { getPlatformInfo } from '@/hooks/usePlatform';

// Platform-specific spring configurations
export const getSpringConfig = (): Transition => {
  const { isIOS } = getPlatformInfo();
  
  if (isIOS) {
    // iOS: Slightly softer, more fluid springs
    return {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 1,
    };
  }
  
  // Android: Snappier, more responsive springs
  return {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  };
};

// Page transition configurations
export const getPageTransition = (): { initial: object; animate: object; exit: object; transition: Transition } => {
  const { isIOS } = getPlatformInfo();
  
  if (isIOS) {
    // iOS: Slide from right with shadow
    return {
      initial: { x: '100%', opacity: 1 },
      animate: { x: 0, opacity: 1 },
      exit: { x: '-30%', opacity: 0.8 },
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    };
  }
  
  // Android: Fade + subtle vertical shift
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: {
      type: 'tween',
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1], // Material Design easing
    },
  };
};

// Sheet/drawer animation configurations
export const getSheetTransition = (): Transition => {
  const { isIOS } = getPlatformInfo();
  
  if (isIOS) {
    return {
      type: 'spring',
      stiffness: 350,
      damping: 30,
    };
  }
  
  return {
    type: 'spring',
    stiffness: 400,
    damping: 28,
  };
};

// Fade in animation variants
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

// Scale animation variants
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: getSpringConfig()
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

// List item stagger animation
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  }
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 30,
    }
  }
};

// Button press animation
export const buttonPressVariants = {
  tap: { scale: 0.97 },
  hover: { scale: 1.02 },
};

// Pull to refresh animation
export const pullToRefreshVariants: Variants = {
  idle: { rotate: 0 },
  pulling: { rotate: 180 },
  refreshing: { 
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear'
    }
  }
};
