import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FinnyGuide } from './FinnyGuide';
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
    const timer = setTimeout(() => setShowText(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showText && textIndex < welcomeText.length) {
      const timer = setTimeout(() => {
        setTextIndex(prev => prev + 1);
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [showText, textIndex, welcomeText.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-background"
      style={{ zIndex: 9999 }}
    >
      {/* Subtle gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm">
        {/* Finny entrance */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            delay: 0.1,
          }}
        >
          <FinnyGuide size="lg" expression="waving" />
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-2xl font-bold text-foreground"
        >
          {greeting}
        </motion.h1>

        {/* Typewriter text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showText ? 1 : 0 }}
          className="mt-3 min-h-[48px]"
        >
          <p className="text-base text-muted-foreground">
            {welcomeText.slice(0, textIndex)}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
            />
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8 flex flex-col gap-3 w-full"
        >
          {/* Start Tour button */}
          <motion.button
            onClick={onStart}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            Start Tour
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          {/* Skip button */}
          <motion.button
            onClick={onSkip}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            whileTap={{ scale: 0.98 }}
          >
            I'll explore on my own
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};
