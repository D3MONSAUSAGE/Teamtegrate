
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChatParticipant } from '@/types/chat';

export function usePermissions(roomId: string | null) {
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'moderator' | 'member' | null>(null);
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{is_public: boolean, created_by: string} | null>(null);
  const { user } = useAuth();

  // Early optimistic access for public rooms
  const hasOptimisticAccess = roomInfo?.is_public || roomInfo?.created_by === user?.id;

  const fetchParticipants = async () => {
    if (!roomId) {
      console.log('usePermissions: Missing roomId');
      return;
    }

    if (!user) {
      console.log('usePermissions: No user available yet, will retry when user loads');
      return;
    }

    try {
      setLoading(true);
      console.log('usePermissions: Fetching participants for room:', roomId, 'user:', user.id);
      
      // Fetch room info and participants in parallel for faster loading
      const [participantsResult, roomResult] = await Promise.all([
        supabase
          .from('chat_participants')
          .select('*')
          .eq('room_id', roomId),
        supabase
          .from('chat_rooms')
          .select('created_by, is_public')
          .eq('id', roomId)
          .single()
      ]);

      if (participantsResult.error) {
        console.error('usePermissions: Error fetching participants:', participantsResult.error);
        throw participantsResult.error;
      }
      
      if (roomResult.error) {
        console.error('usePermissions: Error fetching room info:', roomResult.error);
        throw roomResult.error;
      }
      
      console.log('usePermissions: Successfully fetched participants:', participantsResult.data);
      console.log('usePermissions: Successfully fetched room info:', roomResult.data);
      
      // Set room info for optimistic access
      setRoomInfo(roomResult.data);
      
      // Cast the data to match our ChatParticipant type
      const typedParticipants: ChatParticipant[] = (participantsResult.data || []).map(participant => ({
        ...participant,
        role: participant.role as 'admin' | 'moderator' | 'member'
      }));
      
      setParticipants(typedParticipants);
      
      // Find current user's role - first check participants, then check if user is room creator
      const currentUserParticipant = typedParticipants.find(p => p.user_id === user.id);
      console.log('usePermissions: Current user participant:', currentUserParticipant);
      
      if (currentUserParticipant) {
        console.log('usePermissions: User found as participant with role:', currentUserParticipant.role);
        setUserRole(currentUserParticipant.role);
      } else if (roomResult.data?.created_by === user.id) {
        console.log('usePermissions: User is room creator, setting as admin');
        setUserRole('admin');
      } else if (roomResult.data?.is_public) {
        console.log('usePermissions: Public room, auto-adding user as member');
        // For public rooms, automatically add the user as a member in background
        try {
          const newParticipant = await addParticipant(user.id, 'member');
          if (newParticipant) {
            setUserRole('member');
          }
        } catch (addError) {
          console.error('usePermissions: Failed to auto-add user to public room:', addError);
          // Still set as member for optimistic access to public rooms
          setUserRole('member');
        }
      } else {
        console.log('usePermissions: User has no access to this private room');
        setUserRole(null);
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
  // Optimistic participant access for public rooms while loading
  const isParticipant = userRole !== null || (loading && hasOptimisticAccess);

  useEffect(() => {
    console.log('usePermissions: Effect triggered - roomId:', !!roomId, 'user:', !!user);
    
    if (roomId && user) {
      fetchParticipants();
    } else {
      console.log('usePermissions: Clearing participants - missing roomId or user');
      setParticipants([]);
      setUserRole(null);
    }
  }, [roomId, user?.id]); // Depend on user.id specifically to avoid unnecessary re-runs

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
