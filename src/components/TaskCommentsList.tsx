
import React, { useState } from 'react';
import { Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, Trash2, X, Check } from 'lucide-react';
import { updateComment, deleteComment } from '@/utils/comments';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export interface TaskCommentsListProps {
  taskComments: Comment[];
  className?: string;
  onCommentDeleted?: () => void;
  onCommentUpdated?: () => void;
}

const TaskCommentsList: React.FC<TaskCommentsListProps> = ({ 
  taskComments, 
  className,
  onCommentDeleted,
  onCommentUpdated 
}) => {
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  if (!taskComments || taskComments.length === 0) {
    return <div className={`text-sm text-muted-foreground ${className}`}>No comments yet.</div>;
  }

  const handleEditClick = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.text);
  };

  const handleUpdate = async (id: string) => {
    const success = await updateComment(id, editContent);
    if (success) {
      setEditingId(null);
      onCommentUpdated?.();
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteComment(id);
    if (success) {
      setDeleteDialogOpen(false);
      onCommentDeleted?.();
    }
  };

  const openDeleteDialog = (id: string) => {
    setCommentToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {taskComments.map((comment) => (
          <div key={comment.id} className="bg-muted/50 p-3 rounded-md">
            <div className="flex justify-between items-start mb-1">
              <div className="font-medium text-sm">{comment.userName}</div>
              <div className="text-xs text-muted-foreground">
                {comment.createdAt instanceof Date 
                  ? comment.createdAt.toLocaleDateString() 
                  : new Date(comment.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            {editingId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    <Check className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm group relative">
                {comment.text}
                {user?.id === comment.userId && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditClick(comment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => openDeleteDialog(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => commentToDelete && handleDelete(commentToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaskCommentsList;
