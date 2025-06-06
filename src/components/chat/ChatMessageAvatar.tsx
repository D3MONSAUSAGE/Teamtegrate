
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
      'bg-gradient-to-br from-emerald-400 to-emerald-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-amber-400 to-amber-600', 
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
      'bg-gradient-to-br from-lime-400 to-lime-600',
      'bg-gradient-to-br from-rose-400 to-rose-600'
    ];
    const hash = userId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    return colors[hash % colors.length];
  };

  const getInitials = () => {
    return userId.slice(0, 2).toUpperCase();
  };

  return (
    <Avatar className={`ring-2 ring-background shadow-sm ${className}`}>
      <AvatarImage 
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`} 
        className="object-cover"
      />
      <AvatarFallback className={`${getColorClass()} text-white font-semibold text-xs`}>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
};

export default ChatMessageAvatar;
