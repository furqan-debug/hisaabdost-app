import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FinnyGuide } from './FinnyGuide';
import { ParticleField } from './ParticleField';
import { Trophy, Sparkles, ArrowRight, PartyPopper } from 'lucide-react';

interface TourCompletionCelebrationProps {
  onComplete: () => void;
  onAddExpense?: () => void;
}

interface Confetti {
  id: number;
  x: number;
  delay: number;
  rotation: number;
  color: string;
}

export const TourCompletionCelebration: React.FC<TourCompletionCelebrationProps> = ({
  onComplete,
  onAddExpense,
}) => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [showContent, setShowContent] = useState(false);

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--primary) / 0.7)',
    '#FFD700',
    '#FF6B6B',
    '#4ECDC4',
    '#A855F7',
  ];

  useEffect(() => {
    // Generate confetti
    const newConfetti: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(newConfetti);

    // Show content after confetti
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10002] flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      {/* Background particles */}
      <ParticleField count={30} />

      {/* Confetti */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: -20,
            backgroundColor: piece.color,
            rotate: piece.rotation,
          }}
          animate={{
            y: [0, window.innerHeight + 50],
            rotate: [piece.rotation, piece.rotation + 720],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={showContent ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 flex flex-col items-center px-6 text-center max-w-md"
      >
        {/* Trophy with glow */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <motion.div
            className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-xl shadow-yellow-500/30">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Finny celebration */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <FinnyGuide size="md" expression="excited" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Tour Complete!</h1>
            <PartyPopper className="w-6 h-6 text-primary transform scale-x-[-1]" />
          </div>
          <p className="text-muted-foreground">
            You're all set to take control of your finances!
          </p>
        </motion.div>

        {/* Achievement badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 300 }}
          className="mt-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/30"
        >
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Quick Learner Badge Earned!</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 flex flex-col gap-3 w-full"
        >
          {onAddExpense && (
            <motion.button
              onClick={onAddExpense}
              className="group relative px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold shadow-xl shadow-primary/30 overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative flex items-center justify-center gap-2">
                Add Your First Expense
                <ArrowRight className="w-5 h-5" />
              </span>
            </motion.button>
          )}

          <motion.button
            onClick={onComplete}
            className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Exploring
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
