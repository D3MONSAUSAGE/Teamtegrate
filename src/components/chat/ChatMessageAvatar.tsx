
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageAvatarProps {
  userId: string;
  className?: string;
}

const ChatMessageAvatar: React.FC<ChatMessageAvatarProps> = ({ userId, className }) => {
  return (
    <Avatar className={className}>
      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} />
      <AvatarFallback>
        {userId.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default ChatMessageAvatar;
