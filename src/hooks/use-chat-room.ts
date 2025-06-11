
import { useState, useEffect } from 'react';
import { User, ChatRoom } from '@/types';
import { supabase } from '@/integrations/supabase/client';

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
      
      // Convert database format to app format
      const convertedRooms: ChatRoom[] = (data || []).map(room => ({
        id: room.id,
        name: room.name,
        created_by: room.created_by,
        created_at: new Date(room.created_at),
        organizationId: room.organization_id
      }));
      
      setRooms(convertedRooms);
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
      
      // Convert database format to app format
      const convertedRoom: ChatRoom = {
        id: data.id,
        name: data.name,
        created_by: data.created_by,
        created_at: new Date(data.created_at),
        organizationId: data.organization_id
      };
      
      setRooms(prev => [...prev, convertedRoom]);
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
