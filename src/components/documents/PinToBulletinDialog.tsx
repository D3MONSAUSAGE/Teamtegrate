import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DocumentItem {
  id: string;
  title: string;
  file_path: string;
  file_type: string;
  folder?: string | null;
  created_at: string;
  size_bytes: number;
}

interface PinToBulletinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onPostCreated: () => void;
}

const CATEGORIES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'policy', label: 'Policy' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'training', label: 'Training' },
  { value: 'news', label: 'News' },
  { value: 'event', label: 'Event' },
];

const PinToBulletinDialog: React.FC<PinToBulletinDialogProps> = ({
  isOpen,
  onClose,
  document,
  onPostCreated
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('announcement');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  React.useEffect(() => {
    if (document && isOpen) {
      setTitle(document.title);
      setContent(`Check out this document: ${document.title}`);
    }
  }, [document, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !document) return;

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('bulletin_posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          author_id: user.id,
          organization_id: user.organizationId,
          category,
          is_pinned: isPinned,
          document_id: document.id
        });

      if (error) {
        console.error('Error creating bulletin post:', error);
        toast.error('Error creating bulletin post');
        return;
      }

      toast.success('Document pinned to bulletin board!');
      onPostCreated();
      handleClose();
    } catch (err) {
      console.error('Exception creating bulletin post:', err);
      toast.error('Failed to pin document to bulletin board');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setCategory('announcement');
    setIsPinned(false);
    onClose();
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pin Document to Bulletin Board</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Post Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="content">Description *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter post description"
              rows={3}
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="pin"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
            <Label htmlFor="pin">Pin this post</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
              {isSubmitting ? 'Creating...' : 'Pin to Bulletin Board'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PinToBulletinDialog;