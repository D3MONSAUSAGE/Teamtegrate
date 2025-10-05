
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types/chat';
import { toast } from 'sonner';
import { createChatMessageNotification } from '@/contexts/task/operations/assignment/createChatNotification';
import { useEnhancedChatNotifications } from '@/hooks/useEnhancedChatNotifications';
import { useChatSounds } from '@/hooks/useChatSounds';

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const { user } = useAuth();
  const { sendChatNotification } = useEnhancedChatNotifications();
  const { playMessageSound } = useChatSounds();

  const MESSAGES_PER_PAGE = 50;

  const fetchMessages = async (reset = true) => {
    if (!roomId || !user) return;
    
    try {
      if (reset) {
        setLoading(true);
        setMessages([]);
        setOldestMessageId(null);
        setHasMore(true);
      }
      setError(null);
      
      // Fetch latest messages (most recent first, then reverse)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;
      
      // Validate and cast messages with error handling
      const typedMessages: ChatMessage[] = (data || [])
        .filter(msg => msg && msg.id && msg.content)
        .map(msg => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'file' | 'image' | 'system'
        }))
        .reverse(); // Reverse to get chronological order
      
      setMessages(typedMessages);
      
      // Track pagination state
      if (typedMessages.length > 0) {
        setOldestMessageId(typedMessages[0].id);
        setHasMore(typedMessages.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!roomId || !user || !oldestMessageId || loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      setError(null);
      
      // Fetch older messages using cursor-based pagination
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .lt('created_at', (messages.find(m => m.id === oldestMessageId)?.created_at))
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;
      
      const typedMessages: ChatMessage[] = (data || [])
        .filter(msg => msg && msg.id && msg.content)
        .map(msg => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'file' | 'image' | 'system'
        }))
        .reverse();
      
      if (typedMessages.length > 0) {
        // Prepend older messages to the beginning
        setMessages(prev => [...typedMessages, ...prev]);
        setOldestMessageId(typedMessages[0].id);
        setHasMore(typedMessages.length === MESSAGES_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async (content: string, messageType: 'text' | 'file' | 'image' = 'text') => {
    if (!roomId || !user || !content.trim()) return;

    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      room_id: roomId,
      user_id: user.id,
      content: content.trim(),
      message_type: messageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'sending'
    };

    // Optimistically add message to UI
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: content.trim(),
          message_type: messageType
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temporary message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { 
              ...data, 
              message_type: data.message_type as 'text' | 'file' | 'image' | 'system',
              status: 'sent' 
            }
          : msg
      ));

      // Create notifications with fallback for missing organizationId
      // Send FCM notification to other participants
      if (data) {
        try {
          await sendChatNotification(
            roomId,
            user.id,
            content.trim()
          );
        } catch (error) {
          console.error('Error sending FCM chat notification:', error);
        }
      }

      // Legacy: Also create database notification for backward compatibility
      const orgId = user.organizationId || user.id;
      try {
        await createChatMessageNotification(
          roomId,
          user.id,
          user.name || user.email,
          content.trim(),
          orgId
        );
      } catch (notifError) {
        // Non-blocking notification error
      }

      // Play subtle send confirmation sound
      try {
        await playMessageSound();
      } catch (soundError) {
        console.log('Send sound failed (non-critical):', soundError);
      }

      return data;
    } catch (err: any) {
      // Update temp message to failed state
      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, status: 'failed', error: err.message }
          : msg
      ));
      toast.error('Failed to send message');
      throw err;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('Message deleted');
    } catch (err: any) {
      toast.error('Failed to delete message');
      throw err;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ 
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, updated_at: new Date().toISOString() }
          : msg
      ));
      toast.success('Message updated');
    } catch (err: any) {
      toast.error('Failed to update message');
      throw err;
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchMessages(true);
    }
  }, [roomId, user]);

  // Subscribe to real-time updates with pagination awareness
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase
      .channel(`messages_${roomId}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (!payload.new?.id || !payload.new?.content) return;
          
          const newMessage = {
            ...payload.new,
            message_type: payload.new.message_type as 'text' | 'file' | 'image' | 'system'
          } as ChatMessage;
          
          // Deduplicate: check if message already exists (from optimistic update or previous subscription)
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id);
            if (exists) {
              // Replace temp message if this is the real one
              return prev.map(m => 
                m.id.toString().startsWith('temp_') && m.content === newMessage.content
                  ? newMessage
                  : m
              );
            }
            return [...prev, newMessage];
          });
        }
      )
      .on('postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const updatedMessage = {
            ...payload.new,
            message_type: payload.new.message_type as 'text' | 'file' | 'image' | 'system'
          } as ChatMessage;
          
          if (updatedMessage.deleted_at) {
            setMessages(prev => prev.filter(msg => msg.id !== updatedMessage.id));
          } else {
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);

  const retryMessage = async (tempMessageId: string) => {
    const tempMessage = messages.find(m => m.id === tempMessageId);
    if (!tempMessage || tempMessage.status !== 'failed') return;

    // Reset status to sending
    setMessages(prev => prev.map(msg => 
      msg.id === tempMessageId 
        ? { ...msg, status: 'sending', error: undefined }
        : msg
    ));

    try {
      // Only retry if it's a valid message type for sending
      const validType = tempMessage.message_type === 'system' ? 'text' : tempMessage.message_type;
      await sendMessage(tempMessage.content, validType);
      // Remove the failed temp message since sendMessage will add the real one
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
    } catch (error) {
      // sendMessage already handles updating the status to failed
    }
  };

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    sendMessage,
    deleteMessage,
    editMessage,
    fetchMessages,
    loadMoreMessages,
    retryMessage
  };
}
