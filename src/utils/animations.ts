export const buttonVariants = {
  initial: { scale: 1 },
  active: { 
    scale: 0.95,
    transition: { duration: 0.2 }
  },
  hover: { 
    scale: 1.03,
    transition: { duration: 0.2 }
  }
};

export const headerAnimations = {
  container: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  title: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.2, duration: 0.4 }
  },
  badge: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { delay: 0.3, duration: 0.3 }
  }
};
