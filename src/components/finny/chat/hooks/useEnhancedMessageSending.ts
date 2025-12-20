
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFinny } from '../../context/FinnyContext';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  hasAction?: boolean;
}

interface UseEnhancedMessageSendingProps {
  messages: Message[];
  setMessages: (updater: (prev: Message[]) => Message[]) => void;
  saveMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  setInsights: (insights: any) => void;
  currencyCode: string;
  familyId?: string | null;
}

export const useEnhancedMessageSending = ({
  messages,
  setMessages,
  saveMessage,
  setIsLoading,
  setIsTyping,
  setInsights,
  currencyCode,
  familyId
}: UseEnhancedMessageSendingProps) => {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const { isMessageLimitReached } = useFinny();

  const handleSendMessage = async (e?: React.FormEvent, quickAction?: string) => {
    if (e) e.preventDefault();
    
    const messageToSend = quickAction || newMessage.trim();
    if (!messageToSend || !user || isMessageLimitReached) {
      if (isMessageLimitReached) {
        toast.error(`Daily message limit reached (10 messages). Your advanced AI assistant will be available again tomorrow! 🌟`);
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    saveMessage(userMessage);
    
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      console.log('Sending advanced message to AI service:', messageToSend);
      
      // Use Supabase edge function
      const { data, error } = await supabase.functions.invoke('finny-chat', {
        body: {
          message: messageToSend,
          userId: user.id,
          chatHistory: messages.slice(-8),
          currencyCode,
          userName: user.user_metadata?.full_name,
          userAge: user.user_metadata?.age,
          userGender: user.user_metadata?.gender,
          familyId: familyId || null
        }
      });

      if (error) {
        console.error('Error calling Finny edge function:', error);
        throw new Error(`Failed to get response from Finny: ${error.message}`);
      }

      console.log('Advanced AI service response:', data);

      // Extract insights from response
      if (data.insights) {
        setInsights(data.insights);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'I received your message but couldn\'t process it with my full advanced capabilities right now.',
        isUser: false,
        timestamp: new Date(),
        hasAction: !!data.action,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      saveMessage(aiMessage);

      // Enhanced action handling
      if (data.action) {
        console.log('Advanced action performed:', data.action.type);
        
        const triggerAdvancedRefreshEvents = () => {
          let events: string[] = [];
          
          switch (data.action.type) {
            case 'add_expense':
            case 'update_expense':
            case 'delete_expense':
              events = [
                'expense-added',
                'finny-expense-added',
                'expenses-updated',
                'expense-refresh',
                'dashboard-refresh',
                'finny-advanced-action'
              ];
              break;
              
            case 'set_budget':
            case 'update_budget':
              events = [
                'budget-added',
                'budget-updated',
                'budget-refresh',
                'expenses-updated',
                'dashboard-refresh',
                'finny-advanced-action'
              ];
              break;
              
            case 'delete_budget':
              events = [
                'budget-deleted',
                'budget-refresh',
                'expenses-updated',
                'dashboard-refresh',
                'finny-advanced-action'
              ];
              break;
              
            default:
              events = [
                'expense-added',
                'finny-expense-added',
                'expenses-updated',
                'expense-refresh',
                'budget-added',
                'budget-updated',
                'budget-refresh',
                'dashboard-refresh',
                'finny-advanced-action'
              ];
          }
          
          events.forEach(eventName => {
            window.dispatchEvent(new CustomEvent(eventName, { 
              detail: { 
                source: 'finny-advanced-chat', 
                userId: user.id,
                action: data.action.type,
                actionData: data.action,
                timestamp: Date.now(),
                insights: data.insights
              } 
            }));
            console.log(`Dispatched ${eventName} event from Advanced Finny for action: ${data.action.type}`);
          });
        };

        // Multiple refresh triggers for maximum reliability
        triggerAdvancedRefreshEvents();
        setTimeout(triggerAdvancedRefreshEvents, 200);
        setTimeout(triggerAdvancedRefreshEvents, 800);
        setTimeout(triggerAdvancedRefreshEvents, 2000);

        toast.success('✨ Advanced action completed! Your financial data has been updated with intelligent insights.');
      }

    } catch (error) {
      console.error('Error in advanced message handling:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I encountered an issue with my advanced AI systems. Please try again - I\'m working on getting back to full intelligence! 🧠⚡',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
      saveMessage(errorMessage);
      
      toast.error('Advanced AI temporarily unavailable. Please try again!');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return {
    newMessage,
    setNewMessage,
    handleSendMessage
  };
};
