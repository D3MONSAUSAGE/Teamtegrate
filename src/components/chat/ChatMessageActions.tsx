
import React, { useState } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatMessageActionsProps {
  message: {
    id: string;
    content: string;
    user_id: string;
  };
  isCurrentUser: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  children: React.ReactNode;
}

const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
  message,
  isCurrentUser,
  onEdit,
  children
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="w-full p-2 border rounded resize-none"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleEdit}>Save</Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      {children}
      {isCurrentUser && (
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default ChatMessageActions;
