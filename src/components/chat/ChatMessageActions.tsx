
import React, { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatMessageActionsProps {
  message: {
    id: string;
    content: string;
    user_id: string;
    created_at?: string;
  };
  isCurrentUser: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  children: React.ReactNode;
}

const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
  message,
  isCurrentUser,
  onEdit,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', message.id);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      const newContent = prompt('Edit message:', message.content);
      if (newContent && newContent.trim() !== '') {
        onEdit(message.id, newContent.trim());
      }
    }
  };

  if (!isCurrentUser) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {children}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {message.created_at ? new Date(message.created_at).toLocaleString() : 'No timestamp'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {children}
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {message.created_at ? new Date(message.created_at).toLocaleString() : 'No timestamp'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleEdit}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default ChatMessageActions;
