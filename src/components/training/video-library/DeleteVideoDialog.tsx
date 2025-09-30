import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useDeleteVideo } from '@/hooks/useVideoLibrary';
import { useToast } from '@/hooks/use-toast';

interface DeleteVideoDialogProps {
  videoId: string;
  videoTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteVideoDialog: React.FC<DeleteVideoDialogProps> = ({
  videoId,
  videoTitle,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const deleteVideo = useDeleteVideo();

  const handleDelete = async () => {
    try {
      await deleteVideo.mutateAsync(videoId);
      toast({
        title: 'Video Deleted',
        description: `"${videoTitle}" has been permanently deleted.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Video
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{videoTitle}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">
            This will permanently remove the video and all associated permissions.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteVideo.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteVideo.isPending}
          >
            {deleteVideo.isPending ? 'Deleting...' : 'Delete Video'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
