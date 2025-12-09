import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface FinnyGuideProps {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  expression?: 'happy' | 'excited' | 'thinking' | 'waving';
}

export const FinnyGuide: React.FC<FinnyGuideProps> = ({ 
  size = 'md',
  animate = true,
  expression = 'happy'
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]}`}
      animate={animate ? {
        y: [0, -8, 0],
      } : {}}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/60 to-primary/20 blur-xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Main body */}
      <motion.div
        className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-2xl shadow-primary/30 flex items-center justify-center border-2 border-primary-foreground/20"
        animate={expression === 'excited' ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 0.5,
          repeat: expression === 'excited' ? Infinity : 0,
        }}
      >
        {/* Face */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Eyes */}
          <div className="flex gap-2 mb-1">
            <motion.div 
              className="w-2 h-2 rounded-full bg-primary-foreground"
              animate={expression === 'waving' ? {
                scaleY: [1, 0.2, 1],
              } : {}}
              transition={{ duration: 0.3, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.div 
              className="w-2 h-2 rounded-full bg-primary-foreground"
              animate={expression === 'waving' ? {
                scaleY: [1, 0.2, 1],
              } : {}}
              transition={{ duration: 0.3, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
            />
          </div>
          
          {/* Mouth */}
          <motion.div 
            className="w-4 h-2 border-b-2 border-primary-foreground rounded-b-full"
            animate={expression === 'happy' || expression === 'excited' ? {} : {}}
          />
        </div>

        {/* Sparkle icon overlay */}
        <motion.div
          className="absolute -top-1 -right-1"
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Sparkles className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-8 h-8'} text-yellow-400 drop-shadow-lg`} />
        </motion.div>
      </motion.div>

      {/* Waving hand for waving expression */}
      {expression === 'waving' && (
        <motion.div
          className="absolute -right-2 top-1/2"
          animate={{
            rotate: [0, 20, -20, 20, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        >
          <span className="text-2xl">👋</span>
        </motion.div>
      )}
    </motion.div>
  );
};
