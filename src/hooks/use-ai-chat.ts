
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
        // Even with errors, we'll still check if there's a response message
        if (data && data.response) {
          // If we have a response despite the error, use it
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: data.response,
            sender: 'assistant',
            timestamp: new Date()
          };
          
          console.log("Using fallback response from error handler");
          setMessages(prev => [...prev, assistantMessage]);
          return;
        }
        
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (!data || !data.response) {
        console.error('Invalid response from AI:', data);
        throw new Error('Received invalid response from AI');
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
        content: "I'm sorry, I couldn't process your request right now. The AI service might be temporarily unavailable.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      toast.error('Failed to get AI response. Please try again later.');
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
