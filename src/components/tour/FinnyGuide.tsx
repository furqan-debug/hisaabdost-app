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
  const sizeConfig = {
    sm: { container: 'w-10 h-10', sparkle: 'w-3 h-3', hand: 'text-lg' },
    md: { container: 'w-16 h-16', sparkle: 'w-4 h-4', hand: 'text-xl' },
    lg: { container: 'w-24 h-24', sparkle: 'w-5 h-5', hand: 'text-2xl' },
  };

  const config = sizeConfig[size];

  return (
    <div className="relative inline-flex">
      <motion.div
        className={`relative ${config.container}`}
        animate={animate ? { y: [0, -4, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Main body */}
        <div className="relative w-full h-full rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-lg shadow-primary/20 flex items-center justify-center border border-primary-foreground/10">
          {/* Face */}
          <div className="flex flex-col items-center justify-center">
            {/* Eyes */}
            <div className="flex gap-1.5 mb-0.5">
              <motion.div 
                className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                animate={expression === 'waving' ? { scaleY: [1, 0.2, 1] } : {}}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
              />
              <motion.div 
                className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                animate={expression === 'waving' ? { scaleY: [1, 0.2, 1] } : {}}
                transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
              />
            </div>
            {/* Mouth */}
            <div className="w-3 h-1.5 border-b-2 border-primary-foreground rounded-b-full" />
          </div>

          {/* Sparkle */}
          <motion.div
            className="absolute -top-0.5 -right-0.5"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className={`${config.sparkle} text-yellow-400`} />
          </motion.div>
        </div>

        {/* Waving hand - positioned outside but contained */}
        {expression === 'waving' && (
          <motion.div
            className="absolute -right-1 top-1/2 -translate-y-1/2"
            animate={{ rotate: [0, 15, -15, 15, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
          >
            <span className={config.hand}>👋</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
