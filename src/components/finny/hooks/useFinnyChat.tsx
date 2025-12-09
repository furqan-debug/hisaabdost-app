
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/hooks/use-currency';
import { useFamilyContext } from '@/hooks/useFamilyContext';
import { formatCurrency } from '@/utils/formatters';
import { validateCategory } from '../utils/categoryUtils';
import { CurrencyCode } from '@/utils/currencyUtils';

export const useFinnyChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<number>(Date.now());
  const [isInitialized, setIsInitialized] = useState(true); // Start initialized for instant open
  const [user, setUser] = useState<any>(null);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD'); // Default fallback
  
  // Get family context
  const { activeFamilyId } = useFamilyContext();
  
  // Get user authentication with error handling
  const auth = useAuth();
  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
    }
  }, [auth?.user]);
  
  // Get currency code with proper error handling
  const currency = useCurrency();
  useEffect(() => {
    if (currency?.currencyCode) {
      setCurrencyCode(currency.currencyCode);
      console.log("Currency updated in useFinnyChat:", currency.currencyCode);
    }
  }, [currency?.currencyCode]);

  // Initialize only when needed
  useEffect(() => {
    if (!isInitialized && isOpen) {
      setIsInitialized(true);
    }
  }, [isOpen, isInitialized]);

  // Handle queued messages
  useEffect(() => {
    if (queuedMessage && isOpen) {
      const timer = setTimeout(() => {
        const input = document.querySelector('input[placeholder="Message Finny..."]') as HTMLInputElement;
        const sendButton = input?.parentElement?.querySelector('button[type="submit"]') as HTMLButtonElement;
        
        if (input && sendButton) {
          input.value = queuedMessage;
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
          setTimeout(() => {
            sendButton.click();
            setQueuedMessage(null);
          }, 100);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [queuedMessage, isOpen]);

  const openChat = () => {
    console.log("Opening Finny chat, user auth status:", user ? "authenticated" : "not authenticated", "currency:", currencyCode);
    setIsOpen(true);
  };
  
  const closeChat = () => setIsOpen(false);
  const toggleChat = () => setIsOpen((prev) => !prev);

  const resetChat = () => {
    // Force re-render the chat component by changing key
    setChatKey(Date.now());
    
    // Clear any queued message
    setQueuedMessage(null);
    
    toast.success("Finny chat reset successfully");
  };

  return {
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
    activeFamilyId,
    resetChat,
    setIsOpen
  };
};
