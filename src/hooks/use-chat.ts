
import { useEffect, useReducer, useState } from "react";
import { useChatMessages } from "./use-chat/useChatMessages";
import { useChatSending } from "./use-chat/useChatSending";
import { useChatSubscription } from "./use-chat/useChatSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define typing indicator state
interface TypingState {
  [userId: string]: {
    isTyping: boolean;
    name: string | null;
    lastTyped: number;
  };
}

// Action types for the typing reducer
type TypingAction = 
  | { type: 'SET_TYPING'; userId: string; name: string | null } 
  | { type: 'SET_NOT_TYPING'; userId: string }
  | { type: 'CLEANUP' };

// Typing state reducer
function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case 'SET_TYPING':
      return {
        ...state,
        [action.userId]: {
          isTyping: true,
          name: action.name,
          lastTyped: Date.now()
        }
      };
    case 'SET_NOT_TYPING':
      if (!state[action.userId]) return state;
      return {
        ...state,
        [action.userId]: {
          ...state[action.userId],
          isTyping: false
        }
      };
    case 'CLEANUP':
      const now = Date.now();
      const newState = { ...state };
      
      // Remove typing indicators older than 5 seconds
      Object.keys(newState).forEach(userId => {
        if (now - newState[userId].lastTyped > 5000) {
          delete newState[userId];
        }
      });
      
      return newState;
    default:
      return state;
  }
}

export const useChat = (roomId: string, userId: string | undefined) => {
  const { messages, fetchAndSetMessages, setMessages, isLoading, hasMoreMessages, fetchMoreMessages } = useChatMessages(roomId);
  const {
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    replyTo,
    setReplyTo,
    isSending,
    sendMessage,
  } = useChatSending(roomId, userId);

  const [typingState, dispatchTyping] = useReducer(typingReducer, {});
  const [isTyping, setIsTyping] = useState(false);
  
  const subscribeToMessages = useChatSubscription(roomId, userId, fetchAndSetMessages);
  
  // Handle user typing status
  useEffect(() => {
    if (!userId || !roomId) return;
    
    let typingTimeout: ReturnType<typeof setTimeout>;
    let cleanupInterval: ReturnType<typeof setInterval>;

    const handleUserTyping = async () => {
      if (!isTyping) {
        setIsTyping(true);
        try {
          await supabase.channel(`typing:${roomId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping: true }
          });
        } catch (error) {
          console.error('Error sending typing indicator:', error);
        }
      }
      
      // Clear previous timeout and set a new one
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(async () => {
        setIsTyping(false);
        try {
          await supabase.channel(`typing:${roomId}`).send({
            type: 'broadcast',
            event: 'typing',
            payload: { userId, isTyping: false }
          });
        } catch (error) {
          console.error('Error sending typing stopped indicator:', error);
        }
      }, 2000);
    };
    
    // Setup typing interval cleanup
    cleanupInterval = setInterval(() => {
      dispatchTyping({ type: 'CLEANUP' });
    }, 2000);
    
    // Watch for changes in the message input
    if (newMessage) {
      handleUserTyping();
    }
    
    return () => {
      clearTimeout(typingTimeout);
      clearInterval(cleanupInterval);
    };
  }, [newMessage, roomId, userId, isTyping]);
  
  // Subscribe to typing indicators from other users
  useEffect(() => {
    if (!roomId || !userId) return;
    
    const typingChannel = supabase.channel(`typing:${roomId}`);
    
    typingChannel
      .on('broadcast', { event: 'typing' }, async ({ payload }) => {
        if (payload.userId === userId) return; // Ignore own typing events
        
        // Get user name from supabase if not already in state
        let userName = typingState[payload.userId]?.name;
        
        if (!userName && payload.isTyping) {
          try {
            const { data } = await supabase
              .from('users')
              .select('name')
              .eq('id', payload.userId)
              .single();
            
            userName = data?.name || 'Someone';
          } catch (error) {
            console.error('Error fetching user name for typing indicator:', error);
            userName = 'Someone';
          }
        }
        
        if (payload.isTyping) {
          dispatchTyping({ 
            type: 'SET_TYPING', 
            userId: payload.userId,
            name: userName 
          });
        } else {
          dispatchTyping({ 
            type: 'SET_NOT_TYPING', 
            userId: payload.userId 
          });
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [roomId, userId, typingState]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe();
    };
  }, [roomId, userId, subscribeToMessages]);

  // Get active typers (currently typing)
  const activeTypers = Object.values(typingState)
    .filter(status => status.isTyping)
    .map(status => status.name);

  return {
    messages,
    newMessage,
    setNewMessage,
    fileUploads,
    setFileUploads,
    sendMessage,
    replyTo,
    setReplyTo,
    isSending,
    typingUsers: activeTypers,
    isLoading,
    hasMoreMessages,
    loadMoreMessages: fetchMoreMessages
  };
};
