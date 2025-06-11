
import { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export const useChatSendMessage = (roomId: string, userId: string | undefined) => {
  const [sending, setSending] = useState(false);

  const sendMessage = async (content: string, parentId?: string, attachments?: any[]) => {
    if (!userId) {
      toast.error('User ID required');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          user_id: userId,
          content,
          type: 'text',
          parent_id: parentId,
          organization_id: '' // Will be set by trigger
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Message sent');
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    } finally {
      setSending(false);
    }
  };

  return {
    sendMessage,
    sending
  };
};
