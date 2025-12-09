import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinnyGuide } from './FinnyGuide';
import { ParticleField } from './ParticleField';
import { ArrowRight, Sparkles } from 'lucide-react';

interface TourIntroSequenceProps {
  onStart: () => void;
  onSkip: () => void;
  userName?: string;
}

export const TourIntroSequence: React.FC<TourIntroSequenceProps> = ({
  onStart,
  onSkip,
  userName,
}) => {
  const [showText, setShowText] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  
  const greeting = userName ? `Hey ${userName}!` : 'Hey there!';
  const welcomeText = "I'm Finny, your finance buddy. Let me show you around!";
  
  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showText && textIndex < welcomeText.length) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [showText, textIndex, welcomeText.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10002] flex items-center justify-center"
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-background via-primary/10 to-background"
        animate={{
          background: [
            'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--primary) / 0.1) 50%, hsl(var(--background)) 100%)',
            'linear-gradient(225deg, hsl(var(--background)) 0%, hsl(var(--primary) / 0.15) 50%, hsl(var(--background)) 100%)',
            'linear-gradient(315deg, hsl(var(--background)) 0%, hsl(var(--primary) / 0.1) 50%, hsl(var(--background)) 100%)',
            'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--primary) / 0.1) 50%, hsl(var(--background)) 100%)',
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Particle effects */}
      <ParticleField count={40} />

      {/* Aurora effect */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--primary) / 0.3) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-md">
        {/* Finny entrance */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.2,
          }}
        >
          <FinnyGuide size="lg" expression="waving" />
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-3xl font-bold text-foreground"
        >
          {greeting}
        </motion.h1>

        {/* Typewriter text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showText ? 1 : 0 }}
          className="mt-4 h-16"
        >
          <p className="text-lg text-muted-foreground">
            {welcomeText.slice(0, textIndex)}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-5 bg-primary ml-1 align-middle"
            />
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 flex flex-col gap-3 w-full"
        >
          {/* Start Tour button */}
          <motion.button
            onClick={onStart}
            className="group relative px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-lg shadow-xl shadow-primary/30 overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
              }}
            />
            
            <span className="relative flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Start Tour
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.span>
            </span>
          </motion.button>

          {/* Skip button */}
          <motion.button
            onClick={onSkip}
            className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            I'll explore on my own
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};
