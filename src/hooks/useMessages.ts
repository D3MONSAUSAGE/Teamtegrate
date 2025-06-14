
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types/chat';
import { toast } from 'sonner';

export function useMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMessages = async () => {
    if (!roomId || !user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Cast the data to match our ChatMessage type
      const typedMessages: ChatMessage[] = (data || []).map(msg => ({
        ...msg,
        message_type: msg.message_type as 'text' | 'file' | 'image' | 'system'
      }));
      
      setMessages(typedMessages);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
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
    error,
    sendMessage,
    deleteMessage,
    editMessage,
    fetchMessages
  };
}
