
import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import ChatMessageAvatar from './ChatMessageAvatar';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatParticipantsProps {
  roomId: string;
}

const ChatParticipants: React.FC<ChatParticipantsProps> = ({ roomId }) => {
  const { data: participants } = useQuery({
    queryKey: ['chat-participants', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name')
        .eq('id', roomId);
        
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Users className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="font-medium">Participants</h4>
        </div>
        <ScrollArea className="h-[300px] p-4">
          <div className="space-y-4">
            {participants?.map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <ChatMessageAvatar userId={user.id} className="h-8 w-8" />
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default ChatParticipants;
