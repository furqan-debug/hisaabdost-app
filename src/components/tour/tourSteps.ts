import { TourStep } from './types';
import { Wallet, TrendingDown, PiggyBank, Sparkles, Compass, Zap, MessageCircle, MoreHorizontal, Users } from 'lucide-react';

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
    id: 'quick-actions',
    targetId: 'tour-quick-actions',
    title: 'Quick Actions',
    description: 'Add expenses, upload receipts, take photos, or set budgets in just one tap!',
    position: 'top',
    icon: Zap,
    action: 'highlight-multiple',
    actionPayload: {
      multipleTargets: ['tour-quick-action-expense', 'tour-quick-action-receipt', 'tour-quick-action-camera', 'tour-quick-action-budget']
    }
  },
  {
    id: 'finny-demo',
    targetId: 'tour-finny-fab',
    title: 'Finny AI in Action',
    description: 'Your personal finance assistant! Ask anything about your spending habits and get instant insights.',
    position: 'top',
    icon: MessageCircle,
    action: 'demo',
    actionPayload: {
      demoType: 'finny-preview'
    }
  },
  {
    id: 'more-menu',
    targetId: 'tour-more-sheet-content',
    title: 'Explore More Features',
    description: 'Access Analytics, Goals, Loans, and Family Management from here.',
    position: 'top',
    icon: MoreHorizontal,
    action: 'click',
    actionPayload: {
      triggerId: 'tour-more-button'
    },
    waitForElement: true,
  },
  {
    id: 'family-management',
    targetId: 'tour-family-button',
    title: 'Family Management',
    description: 'Invite family members to share expenses and track finances together. Growing your family group is easy!',
    position: 'bottom',
    icon: Users,
    waitForElement: true,
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
