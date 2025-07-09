
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Pin, Edit2, Trash2, Save, X, User, Calendar, Tag } from 'lucide-react';
import { EnhancedTaskComment } from '@/types/enhancedComments';
import { formatDistanceToNow } from 'date-fns';

interface ProjectUpdateItemProps {
  comment: EnhancedTaskComment;
  onEdit: (commentId: string, updates: { content?: string; category?: string; is_pinned?: boolean }) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
}

const ProjectUpdateItem: React.FC<ProjectUpdateItemProps> = ({
  comment,
  onEdit,
  onDelete,
  isEditing,
  onEditStart,
  onEditCancel
}) => {
  const [editContent, setEditContent] = useState(comment.text);
  const [editCategory, setEditCategory] = useState(comment.category || 'general');
  const [editPinned, setEditPinned] = useState(comment.isPinned || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, {
        content: editContent.trim(),
        category: editCategory,
        is_pinned: editPinned
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this update?')) {
      await onDelete(comment.id);
    }
  };

  const handlePinnedChange = (checked: boolean | 'indeterminate') => {
    setEditPinned(checked === true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'progress': return 'bg-blue-100 text-blue-800';
      case 'issue': return 'bg-red-100 text-red-800';
      case 'milestone': return 'bg-green-100 text-green-800';
      case 'note': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`p-4 ${comment.isPinned ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="font-medium text-foreground">{comment.userName}</span>
            <Calendar className="h-4 w-4 ml-2" />
            <span>{formatDistanceToNow(comment.createdAt, { addSuffix: true })}</span>
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <span className="text-xs">(edited)</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {comment.isPinned && <Pin className="h-4 w-4 text-yellow-600" />}
          {comment.category && (
            <Badge variant="secondary" className={getCategoryColor(comment.category)}>
              <Tag className="h-3 w-3 mr-1" />
              {comment.category}
            </Badge>
          )}
          
          <div className="flex gap-1">
            {!isEditing && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onEditStart}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
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
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`pin-edit-${comment.id}`}
                checked={editPinned}
                onCheckedChange={handlePinnedChange}
              />
              <label htmlFor={`pin-edit-${comment.id}`} className="text-sm">
                Pin
              </label>
            </div>
          </div>
          
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[100px]"
            disabled={isSubmitting}
          />
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditCancel}
              disabled={isSubmitting}
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveEdit}
              disabled={!editContent.trim() || isSubmitting}
            >
              <Save className="h-3 w-3 mr-1" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {comment.text}
          </p>
        </div>
      )}
    </Card>
  );
};

export default ProjectUpdateItem;
