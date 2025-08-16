
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types/chat';
import { toast } from 'sonner';
import { createChatMessageNotification } from '@/contexts/task/operations/assignment/createChatNotification';

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!roomId || !user) {
      console.log('fetchMessages: Missing roomId or user', { roomId, user: !!user });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('fetchMessages: Starting fetch for room', roomId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('fetchMessages: Database error', error);
        throw error;
      }
      
      console.log('fetchMessages: Fetched data', { count: data?.length, data });
      
      // Cast the data to match our ChatMessage type
      const typedMessages: ChatMessage[] = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'file' | 'image' | 'system'
      }));
      
      console.log('fetchMessages: About to set messages', { 
        totalFetched: typedMessages.length, 
        currentCount: messages.length,
        messages: typedMessages.map(m => ({ id: m.id, content: m.content.substring(0, 50) }))
      });
      
      setMessages(typedMessages);
      console.log('fetchMessages: Set messages complete', typedMessages.length);
    } catch (err: any) {
      console.error('fetchMessages: Error', err);
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string, messageType: 'text' | 'file' | 'image' = 'text') => {
    if (!roomId || !user || !content.trim()) {
      console.log('sendMessage: Missing required data', { roomId, user: !!user, content });
      return;
    }

    try {
      console.log('sendMessage: Sending message', { roomId, userId: user.id, content: content.trim() });
      
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

      if (error) {
        console.error('sendMessage: Database error', error);
        throw error;
      }

      console.log('sendMessage: Message sent successfully', data);

      // Create notifications for other room participants
      if (user.organizationId) {
        try {
          await createChatMessageNotification(
            roomId,
            user.id,
            user.name || user.email,
            content.trim(),
            user.organizationId
          );
        } catch (notifError) {
          console.error('sendMessage: Notification error (non-blocking)', notifError);
        }
      }

      return data;
    } catch (err: any) {
      console.error('sendMessage: Error', err);
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
      setMessages([]);
      fetchMessages();
    }
  }, [roomId, user]);

  // Subscribe to real-time updates
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
          const newMessage = {
            ...payload.new,
            message_type: payload.new.message_type as 'text' | 'file' | 'image' | 'system'
          } as ChatMessage;
          console.log('Real-time INSERT: Adding new message', { newMessage, currentCount: messages.length });
          setMessages(prev => {
            console.log('Real-time INSERT: Previous messages count', prev.length);
            const updated = [...prev, newMessage];
            console.log('Real-time INSERT: Updated messages count', updated.length);
            return updated;
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
            console.log('Real-time UPDATE: Deleting message', { messageId: updatedMessage.id });
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== updatedMessage.id);
              console.log('Real-time UPDATE: After delete, count', filtered.length);
              return filtered;
            });
          } else {
            console.log('Real-time UPDATE: Updating message', { messageId: updatedMessage.id });
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
    error,
    sendMessage,
    deleteMessage,
    editMessage,
    fetchMessages
  };
}
