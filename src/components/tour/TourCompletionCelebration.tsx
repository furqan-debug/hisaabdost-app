import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FinnyGuide } from './FinnyGuide';
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
    '#4ECDC4',
  ];

  useEffect(() => {
    // Generate confetti - reduced count for performance
    const newConfetti: Confetti[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(newConfetti);

    // Show content after confetti
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-background overflow-hidden"
      style={{ zIndex: 9999 }}
    >
      {/* Confetti */}
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${piece.x}%`,
            top: -10,
            backgroundColor: piece.color,
          }}
          animate={{
            y: [0, window.innerHeight + 20],
            rotate: [piece.rotation, piece.rotation + 540],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2.5,
            delay: piece.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={showContent ? { scale: 1, opacity: 1 } : {}}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative z-10 flex flex-col items-center px-6 text-center max-w-sm"
      >
        {/* Trophy */}
        <motion.div
          className="relative"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Trophy className="w-10 h-10 text-white" />
          </div>
        </motion.div>

        {/* Finny celebration */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5"
        >
          <FinnyGuide size="md" expression="excited" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-5"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Tour Complete!</h1>
            <PartyPopper className="w-5 h-5 text-primary transform scale-x-[-1]" />
          </div>
          <p className="text-sm text-muted-foreground">
            You're all set to take control of your finances!
          </p>
        </motion.div>

        {/* Achievement badge */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 300 }}
          className="mt-4 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
        >
          <div className="flex items-center gap-1.5 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Quick Learner Badge</span>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 flex flex-col gap-2 w-full"
        >
          {onAddExpense && (
            <motion.button
              onClick={onAddExpense}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Add Your First Expense
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}

          <motion.button
            onClick={onComplete}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            whileTap={{ scale: 0.98 }}
          >
            Start Exploring
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
