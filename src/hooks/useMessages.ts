
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types/chat';
import { toast } from 'sonner';
import { createChatMessageNotification } from '@/contexts/task/operations/assignment/createChatNotification';

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oldestMessageId, setOldestMessageId] = useState<string | null>(null);
  const { user } = useAuth();

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

      // Create notifications with fallback for missing organizationId
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

      return data;
    } catch (err: any) {
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
          
          // Always add new messages to the end (most recent)
          setMessages(prev => [...prev, newMessage]);
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
    loadMoreMessages
  };
}
