
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessageAvatarProps {
  userId: string;
  className?: string;
}

const ChatMessageAvatar: React.FC<ChatMessageAvatarProps> = ({ userId, className }) => {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const initials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'U';

  return (
    <Avatar className={className}>
      <AvatarImage src={user?.avatar_url || undefined} />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default ChatMessageAvatar;
