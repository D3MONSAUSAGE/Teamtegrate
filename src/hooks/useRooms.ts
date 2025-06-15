
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
      console.log('useRooms: No user, skipping fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('useRooms: Fetching rooms for user:', user.id);
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('useRooms: Error fetching rooms:', error);
        throw error;
      }

      console.log('useRooms: Successfully fetched rooms:', data);
      setRooms(data || []);
      setError(null);
    } catch (err: any) {
      console.error('useRooms: Fetch error:', err);
      setError(err.message);
      toast.error('Failed to load chat rooms');
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (name: string, description?: string, isPublic = false) => {
    if (!user?.id || !user?.organizationId) {
      console.error('useRooms: Missing user or organization info:', { userId: user?.id, orgId: user?.organizationId });
      toast.error('Unable to create room: User not properly authenticated');
      return;
    }

    try {
      console.log('useRooms: Creating room:', { name, description, isPublic, userId: user.id, orgId: user.organizationId });
      
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          description,
          created_by: user.id,
          organization_id: user.organizationId,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) {
        console.error('useRooms: Error creating room:', error);
        throw error;
      }
      
      console.log('useRooms: Successfully created room:', data);
      setRooms(prev => [data, ...prev]);
      toast.success('Room created successfully');
      return data;
    } catch (err: any) {
      console.error('useRooms: Create room error:', err);
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
      console.log('useRooms: Deleting room:', roomId);
      
      const { error } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId);

      if (error) {
        console.error('useRooms: Error deleting room:', error);
        throw error;
      }
      
      setRooms(prev => prev.filter(room => room.id !== roomId));
      toast.success('Room deleted successfully');
    } catch (err: any) {
      console.error('useRooms: Delete room error:', err);
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

    console.log('useRooms: Setting up real-time subscription');
    const channel = supabase
      .channel('chat_rooms_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chat_rooms' },
        (payload) => {
          console.log('useRooms: Real-time update received:', payload);
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      console.log('useRooms: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    rooms,
    loading,
    error,
    fetchRooms,
    createRoom,
    deleteRoom
  };
}
