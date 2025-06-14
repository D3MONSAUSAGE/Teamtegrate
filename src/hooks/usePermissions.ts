
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
    if (!roomId || !user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;
      
      // Cast the data to match our ChatParticipant type
      const typedParticipants: ChatParticipant[] = (data || []).map(participant => ({
        ...participant,
        role: participant.role as 'admin' | 'moderator' | 'member'
      }));
      
      setParticipants(typedParticipants);
      
      // Find current user's role
      const currentUserParticipant = typedParticipants.find(p => p.user_id === user.id);
      setUserRole(currentUserParticipant?.role || null);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = async (userId: string, role: 'admin' | 'moderator' | 'member' = 'member') => {
    if (!roomId) return;

    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          role
        })
        .select()
        .single();

      if (error) throw error;
      
      const typedParticipant: ChatParticipant = {
        ...data,
        role: data.role as 'admin' | 'moderator' | 'member'
      };
      
      setParticipants(prev => [...prev, typedParticipant]);
      return typedParticipant;
    } catch (err) {
      console.error('Failed to add participant:', err);
      throw err;
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!roomId) return;

    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) throw error;
      
      setParticipants(prev => prev.filter(p => p.user_id !== userId));
    } catch (err) {
      console.error('Failed to remove participant:', err);
      throw err;
    }
  };

  const canManageRoom = userRole === 'admin';
  const canModerate = userRole === 'admin' || userRole === 'moderator';
  const isParticipant = userRole !== null;

  useEffect(() => {
    fetchParticipants();
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
