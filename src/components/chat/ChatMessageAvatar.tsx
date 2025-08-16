
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessageAvatarProps {
  userId: string;
  className?: string;
}

const ChatMessageAvatar: React.FC<ChatMessageAvatarProps> = ({ userId, className }) => {
  const { data: user, error, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.warn('Failed to fetch user for avatar:', userId, error);
          return { name: 'Unknown User', avatar_url: null };
        }
        return data;
      } catch (err) {
        console.warn('Error in avatar query:', err);
        return { name: 'Unknown User', avatar_url: null };
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    initialData: { name: 'Loading...', avatar_url: null }
  });

  const initials = user?.name && user.name !== 'Loading...' 
    ? user.name.substring(0, 2).toUpperCase() 
    : userId.substring(0, 2).toUpperCase();

  if (error) {
    console.warn('Avatar error for user:', userId, error);
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.avatar_url || undefined} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default ChatMessageAvatar;
