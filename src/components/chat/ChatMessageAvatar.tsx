
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageAvatarProps {
  userId: string;
  className?: string;
}

const ChatMessageAvatar: React.FC<ChatMessageAvatarProps> = ({ userId, className }) => {
  // Generate a consistent color based on user ID
  const getColorClass = () => {
    const colors = [
      'bg-emerald-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-amber-500', 
      'bg-pink-500',
      'bg-cyan-500',
      'bg-lime-500',
      'bg-rose-500'
    ];
    // Simple hash function to get a consistent color for a user
    const hash = userId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return colors[hash % colors.length];
  };

  return (
    <Avatar className={`ring-2 ring-background ${className}`}>
      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} />
      <AvatarFallback className={`${getColorClass()} text-white`}>
        {userId.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export default ChatMessageAvatar;
