
import { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SendMessageParams {
  roomId: string;
  content: string;
  type?: 'text' | 'file' | 'image';
  parentId?: string;
}

export const useChatSendMessage = (user: User | null) => {
  const [sending, setSending] = useState(false);

  const sendMessage = async ({ roomId, content, type = 'text', parentId }: SendMessageParams) => {
    if (!user?.organizationId) {
      toast.error('User organization required');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([{
          room_id: roomId,
          user_id: user.id,
          content,
          type,
          parent_id: parentId,
          organization_id: user.organizationId
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
