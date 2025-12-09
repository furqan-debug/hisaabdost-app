import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

export const FinnyDemoPreview: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="mt-4 rounded-xl bg-background/80 border border-primary/20 p-3 backdrop-blur-sm"
    >
      {/* User question */}
      <div className="flex items-start gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <span className="text-xs">👤</span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground italic">
            "How much did I spend on food this month?"
          </p>
        </div>
      </div>

      {/* Finny response */}
      <div className="flex items-start gap-2">
        <motion.div 
          className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0"
          animate={{ 
            boxShadow: [
              '0 0 0 0 hsl(var(--primary) / 0.2)',
              '0 0 0 4px hsl(var(--primary) / 0)',
            ]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Bot className="w-3.5 h-3.5 text-primary" />
        </motion.div>
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <p className="text-xs text-foreground leading-relaxed">
              <Sparkles className="w-3 h-3 text-primary inline mr-1" />
              You've spent <span className="text-primary font-semibold">₹4,250</span> on food this month, 
              which is <span className="text-green-500 font-medium">15% less</span> than last month!
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
