
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatParticipant } from '@/types/chat';

export function usePermissions(roomId: string | null) {
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'member' | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchParticipants = async () => {
    if (!roomId || !user) {
      console.log('usePermissions: Missing roomId or user');
      return;
    }

    try {
      setLoading(true);
      console.log('usePermissions: Fetching participants for room:', roomId);
      
      const { data, error } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('room_id', roomId);

      if (error) {
        console.error('usePermissions: Error fetching participants:', error);
        throw error;
      }
      
      console.log('usePermissions: Successfully fetched participants:', data);
      
      // Cast the data to match our ChatParticipant type
      const typedParticipants: ChatParticipant[] = (data || []).map(participant => ({
        ...participant,
        role: participant.role as 'admin' | 'moderator' | 'member'
      }));
      
      setParticipants(typedParticipants);
      
      // Find current user's role - first check participants, then check if user is room creator
      const currentUserParticipant = typedParticipants.find(p => p.user_id === user.id);
      if (currentUserParticipant) {
        setUserRole(currentUserParticipant.role);
      } else {
        // Check if user is the room creator
        const { data: roomData } = await supabase
          .from('chat_rooms')
          .select('created_by')
          .eq('id', roomId)
          .single();
        
        if (roomData?.created_by === user.id) {
          setUserRole('admin');
        } else {
          setUserRole(null);
        }
      }
    } catch (err) {
      console.error('usePermissions: Failed to fetch participants:', err);
      setParticipants([]);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (userId: string, role: 'admin' | 'moderator' | 'member' = 'member') => {
    if (!roomId || !user) {
      console.error('usePermissions: Missing roomId or user for addParticipant');
      return;
    }

    try {
      console.log('usePermissions: Adding participant:', { userId, role, roomId });
      
      const { data, error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          role
        })
        .select()
        .single();

      if (error) {
        console.error('usePermissions: Error adding participant:', error);
        throw error;
      }
      
      const typedParticipant: ChatParticipant = {
        ...data,
        role: data.role as 'admin' | 'moderator' | 'member'
      };
      
      setParticipants(prev => [...prev, typedParticipant]);
      console.log('usePermissions: Successfully added participant:', typedParticipant);
      return typedParticipant;
    } catch (err) {
      console.error('usePermissions: Failed to add participant:', err);
      throw err;
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!roomId) {
      console.error('usePermissions: Missing roomId for removeParticipant');
      return;
    }

    try {
      console.log('usePermissions: Removing participant:', { userId, roomId });
      
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('usePermissions: Error removing participant:', error);
        throw error;
      }
      
      setParticipants(prev => prev.filter(p => p.user_id !== userId));
      console.log('usePermissions: Successfully removed participant:', userId);
    } catch (err) {
      console.error('usePermissions: Failed to remove participant:', err);
      throw err;
    }
  };

  const canManageRoom = userRole === 'admin';
  const canModerate = userRole === 'admin' || userRole === 'moderator';
  const isParticipant = userRole !== null;

  useEffect(() => {
    if (roomId && user) {
      fetchParticipants();
    } else {
      setParticipants([]);
      setUserRole(null);
    }
  }, [roomId, user]);

  return {
    participants,
    userRole,
    loading,
    canManageRoom,
    canModerate,
    isParticipant,
    addParticipant,
    removeParticipant,
    fetchParticipants
  };
}
