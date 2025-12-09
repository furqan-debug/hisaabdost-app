import { TourStep } from './types';
import { Wallet, TrendingDown, PiggyBank, Sparkles, Compass } from 'lucide-react';

export const tourSteps: TourStep[] = [
  {
    id: 'wallet',
    targetId: 'tour-wallet-card',
    title: 'Wallet Balance',
    description: 'Track your available funds. This shows your income minus expenses for the month.',
    position: 'bottom',
    icon: Wallet,
  },
  {
    id: 'expenses',
    targetId: 'tour-expenses-card',
    title: 'Monthly Expenses',
    description: 'Monitor your spending. See how much you\'ve spent and compare to last month.',
    position: 'bottom',
    icon: TrendingDown,
  },
  {
    id: 'savings',
    targetId: 'tour-savings-card',
    title: 'Savings Rate',
    description: 'Your financial health indicator. Aim for 20%+ to build wealth over time.',
    position: 'bottom',
    icon: PiggyBank,
  },
  {
    id: 'finny',
    targetId: 'tour-finny-fab',
    title: 'Meet Finny AI',
    description: 'Your personal finance assistant. Tap anytime for insights, tips, or to analyze your spending.',
    position: 'top',
    icon: Sparkles,
  },
  {
    id: 'navigation',
    targetId: 'tour-bottom-nav',
    title: 'Quick Navigation',
    description: 'Access all features: Dashboard, Budget, Goals, Loans, and more from the bottom bar.',
    position: 'top',
    icon: Compass,
  },
];
