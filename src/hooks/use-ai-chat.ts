
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      console.log("Sending message to AI:", content);
      
      const { data, error } = await supabase.functions.invoke('chat-with-ai', {
        body: { message: content.trim() }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data || !data.response) {
        console.error('Invalid response from AI:', data);
        throw new Error('Received invalid response from AI');
      }

      // Check if this is a quota exceeded error
      if (data.error === 'quota_exceeded') {
        toast.error('OpenAI API quota exceeded', { 
          description: 'The administrator needs to check the billing details on the OpenAI account.',
          duration: 6000
        });
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'assistant',
        timestamp: new Date()
      };

      console.log("Received AI response:", data.response.substring(0, 50) + "...");
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create a fallback assistant message when API fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I couldn't process your request right now. The AI service might be temporarily unavailable or the account needs to check billing status.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      toast.error('Failed to get AI response', { description: 'Please try again later or contact the administrator.' });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  return {
    messages,
    isProcessing,
    sendMessage
  };
};
