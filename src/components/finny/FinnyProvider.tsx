
import React, { ReactNode, lazy, Suspense } from 'react';
import FinnyButton from './FinnyButton';
import { toast } from 'sonner';
import { FinnyContext, MAX_DAILY_MESSAGES } from './context/FinnyContext';
import { useFinnyChat } from './hooks/useFinnyChat';
import { useMessageLimit } from './hooks/useMessageLimit';
import { useFinnyExpenses } from './hooks/useFinnyExpenses';
import { useFinnyBudgets } from './hooks/useFinnyBudgets';
import { logFinnyInvoked } from '@/utils/appsflyerTracking';

// Lazy load the FinnyChat component
const FinnyChat = lazy(() => import('./FinnyChat'));

export const FinnyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    queuedMessage,
    setQueuedMessage,
    chatKey,
    isInitialized,
    user,
    currencyCode,
    resetChat,
    setIsOpen
  } = useFinnyChat();

  const {
    remainingDailyMessages,
    isMessageLimitReached,
    incrementMessageCount
  } = useMessageLimit(user);
  
  const triggerChat = async (message: string) => {
    try {
      if (!user) {
        toast.error("Please log in to use Finny");
        return;
      }
      
      if (isMessageLimitReached) {
        toast.error(`Daily message limit reached (${MAX_DAILY_MESSAGES} messages). Please try again tomorrow.`);
        return;
      }
      
      // Try to increment the message count first
      const canSend = await incrementMessageCount();
      if (!canSend) {
        toast.error("Unable to send message. Please try again.");
        return;
      }
      
      setQueuedMessage(message);
      setIsOpen(true);
    } catch (error) {
      console.error('Error triggering chat:', error);
      toast.error("Failed to start chat. Please try again.");
    }
  };

  // Use the new specialized hooks
  const { addExpense } = useFinnyExpenses({
    user,
    currencyCode,
    isMessageLimitReached,
    triggerChat
  });

  const { setBudget, deleteBudget } = useFinnyBudgets({
    user,
    currencyCode,
    isMessageLimitReached,
    triggerChat
  });
  
  const askFinny = async (question: string) => {
    try {
      if (isMessageLimitReached) {
        toast.error(`Daily message limit reached (${MAX_DAILY_MESSAGES} messages). Please try again tomorrow.`);
        return;
      }
      
      if (!question || !question.trim()) {
        toast.error("Please provide a question");
        return;
      }
      
      await triggerChat(question.trim());
    } catch (error) {
      console.error('Error asking Finny:', error);
      toast.error("Failed to send question. Please try again.");
    }
  };

  // Enhanced openChat with tracking
  const openChatWithTracking = (source: string = 'unknown') => {
    logFinnyInvoked(source);
    openChat();
  };

  return (
    <FinnyContext.Provider
      value={{
        isOpen,
        openChat: () => openChatWithTracking('context'),
        closeChat,
        toggleChat,
        triggerChat,
        addExpense,
        setBudget,
        deleteBudget,
        askFinny,
        resetChat,
        remainingDailyMessages,
        isMessageLimitReached
      }}
    >
      {children}
      <FinnyButton onClick={() => openChatWithTracking('fab_button')} isOpen={isOpen} />
      {isInitialized && (
        <Suspense fallback={<div className="hidden">Loading Finny...</div>}>
          <FinnyChat key={chatKey} isOpen={isOpen} onClose={closeChat} />
        </Suspense>
      )}
    </FinnyContext.Provider>
  );
};
