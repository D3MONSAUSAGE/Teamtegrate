
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ChatRoom {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  organization_id: string;
}

interface ChatParticipant {
  id: string;
  user_id: string;
  room_id: string;
  added_by: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}

export function useChatRoom(roomId: string | undefined) {
  const { user } = useAuth();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!roomId || !user) {
      setLoading(false);
      return;
    }

    fetchRoomData();
  }, [roomId, user]);

  const fetchRoomData = async () => {
    if (!roomId || !user) return;

    try {
      // Fetch room details
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Error fetching room:', roomError);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      setRoom(roomData);

      // Check if user has access to this room
      const { data: participantData, error: participantError } = await supabase
        .from('chat_room_participants')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single();

      const isParticipant = !participantError && participantData;
      const isCreator = roomData.created_by === user.id;
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';

      setHasAccess(isParticipant || isCreator || isAdmin);

      if (isParticipant || isCreator || isAdmin) {
        // Fetch all participants
        const { data: allParticipants, error: allParticipantsError } = await supabase
          .from('chat_room_participants')
          .select(`
            *,
            users:user_id (
              name,
              email
            )
          `)
          .eq('room_id', roomId);

        if (allParticipantsError) {
          console.error('Error fetching participants:', allParticipantsError);
        } else {
          setParticipants(allParticipants || []);
        }
      }
    } catch (error) {
      console.error('Error in fetchRoomData:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const addSystemMessage = async (content: string) => {
    if (!roomId || !user?.organization_id) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content,
          type: 'system',
          organization_id: user.organization_id
        });

      if (error) {
        console.error('Error adding system message:', error);
      }
    } catch (error) {
      console.error('Error in addSystemMessage:', error);
    }
  };

  const addParticipant = async (userId: string) => {
    if (!roomId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_room_participants')
        .insert({
          room_id: roomId,
          user_id: userId,
          added_by: user.id
        });

      if (error) {
        console.error('Error adding participant:', error);
        toast.error('Failed to add participant');
        return;
      }

      // Add system message
      const { data: addedUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (addedUser) {
        await addSystemMessage(`${addedUser.name} was added to the chat`);
      }

      // Refresh participants
      await fetchRoomData();
      toast.success('Participant added successfully');
    } catch (error) {
      console.error('Error in addParticipant:', error);
      toast.error('Failed to add participant');
    }
  };

  const removeParticipant = async (userId: string) => {
    if (!roomId || !user) return;

    try {
      const { error } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing participant:', error);
        toast.error('Failed to remove participant');
        return;
      }

      // Add system message
      const { data: removedUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      if (removedUser) {
        await addSystemMessage(`${removedUser.name} was removed from the chat`);
      }

      // Refresh participants
      await fetchRoomData();
      toast.success('Participant removed successfully');
    } catch (error) {
      console.error('Error in removeParticipant:', error);
      toast.error('Failed to remove participant');
    }
  };

  return {
    room,
    participants,
    loading,
    hasAccess,
    addParticipant,
    removeParticipant,
    refetch: fetchRoomData
  };
}
