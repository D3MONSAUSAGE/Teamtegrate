import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface BulletinPostFormProps {
  onPostCreated: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'company_policy', label: 'Company Policy' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'training', label: 'Training' },
  { value: 'safety', label: 'Safety' }
];

const BulletinPostForm = ({ onPostCreated, onCancel }: BulletinPostFormProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !title.trim() || !content.trim()) {
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
          category,
          is_pinned: isPinned,
          author_id: user.id,
          organization_id: user.organizationId
        });

      if (error) {
        console.error('Error creating bulletin post:', error);
        toast.error('Error creating post');
        return;
      }

      toast.success('Post created successfully');
      onPostCreated();
    } catch (err) {
      console.error('Exception creating bulletin post:', err);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Post</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
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
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter post content"
              rows={6}
              maxLength={5000}
            />
            <div className="text-sm text-muted-foreground mt-1">
              {content.length}/5000 characters
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="pin-post"
              checked={isPinned}
              onCheckedChange={setIsPinned}
            />
            <Label htmlFor="pin-post">Pin this post to the top</Label>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !title.trim() || !content.trim()}
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BulletinPostForm;