
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit3, Trash2, Pin, MoreHorizontal, Check, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedTaskComment } from '@/types/enhancedComments';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectUpdateItemProps {
  comment: EnhancedTaskComment;
  onEdit: (commentId: string, updates: { content?: string; category?: string; is_pinned?: boolean }) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isEditing?: boolean;
  onEditStart?: () => void;
  onEditCancel?: () => void;
}

const ProjectUpdateItem: React.FC<ProjectUpdateItemProps> = ({
  comment,
  onEdit,
  onDelete,
  isEditing = false,
  onEditStart,
  onEditCancel
}) => {
  const { user } = useAuth();
  const [editText, setEditText] = useState(comment.text);
  const [editCategory, setEditCategory] = useState(comment.category || 'general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const canEdit = user?.id === comment.userId;
  const isOwn = user?.id === comment.userId;

  const handleSaveEdit = async () => {
    if (!editText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, {
        content: editText.trim(),
        category: editCategory
      });
    } catch (error) {
      console.error('Error saving edit:', error);
    } finally {
      setIsSubmitting(false);
      onEditCancel?.();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this update? This action cannot be undone.')) {
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handlePin = async () => {
    try {
      await onEdit(comment.id, {
        is_pinned: !comment.isPinned
      });
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'progress': return 'bg-green-500/10 text-green-700 border-green-200';
      case 'issue': return 'bg-red-500/10 text-red-700 border-red-200';
      case 'milestone': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'note': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className={`p-4 transition-all duration-200 ${comment.isPinned ? 'ring-2 ring-primary/20 bg-primary/5' : 'hover:shadow-sm'}`}>
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-sm">
            {comment.userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{comment.userName}</span>
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0.5 ${getCategoryColor(comment.category || 'general')}`}
              >
                {comment.category || 'general'}
              </Badge>
              {comment.isPinned && (
                <Pin className="h-3 w-3 text-primary" />
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.updatedAt && comment.updatedAt > comment.createdAt && ' (edited)'}
              </span>
              
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem onClick={onEditStart}>
                      <Edit3 className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePin}>
                      <Pin className="h-3 w-3 mr-2" />
                      {comment.isPinned ? 'Unpin' : 'Pin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="progress">Progress</SelectItem>
                    <SelectItem value="issue">Issue</SelectItem>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[80px] resize-none"
                placeholder="Update your note..."
              />
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSaveEdit}
                  disabled={!editText.trim() || isSubmitting}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onEditCancel}
                  disabled={isSubmitting}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.text}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectUpdateItem;
