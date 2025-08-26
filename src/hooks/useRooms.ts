
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom } from '@/types/chat';
import { toast } from 'sonner';

export function useRooms() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRooms = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setRooms(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (name: string, description?: string, isPublic = false) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    // Fallback for missing organizationId
    const orgId = user.organizationId || user.id;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          created_by: user.id,
          organization_id: orgId,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;
      
      setRooms(prev => [data, ...prev]);
      toast.success('Room created successfully');
      return data;
    } catch (err: any) {
      toast.error(`Failed to create room: ${err.message}`);
      throw err;
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      
      setRooms(prev => prev.filter(room => room.id !== roomId));
      toast.success('Room deleted successfully');
    } catch (err: any) {
      toast.error(`Failed to delete room: ${err.message}`);
      throw err;
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_rooms' },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRooms]);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    deleteRoom
  };
}
