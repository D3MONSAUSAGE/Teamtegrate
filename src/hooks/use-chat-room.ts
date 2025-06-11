
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface ChatRoom {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
  organizationId: string;
}

export const useChatRoom = (user: User | null) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = async () => {
    if (!user?.organizationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('organization_id', user.organizationId);

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (name: string) => {
    if (!user?.organizationId) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([{
          name,
          created_by: user.id,
          organization_id: user.organizationId
        }])
        .select()
        .single();

      if (error) throw error;
      setRooms(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  return {
    rooms,
    loading,
    createRoom,
    refetch: fetchRooms
  };
};
