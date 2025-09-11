import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCreateVideo, useVideoLibraryCategories } from '@/hooks/useVideoLibrary';
import { extractYouTubeVideoId } from '@/lib/youtube';
import { useToast } from '@/hooks/use-toast';

interface AddVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VideoFormData {
  title: string;
  description: string;
  youtube_url: string;
  category_id: string;
  duration_minutes: number;
  tags: string[];
}

export const AddVideoDialog: React.FC<AddVideoDialogProps> = ({ open, onOpenChange }) => {
  const [currentTag, setCurrentTag] = React.useState('');
  const { data: categories } = useVideoLibraryCategories();
  const createVideo = useCreateVideo();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, watch, setValue, getValues } = useForm<VideoFormData>({
    defaultValues: {
      tags: [],
    }
  });

  const watchedTags = watch('tags') || [];

  const addTag = () => {
    if (currentTag.trim() && !watchedTags.includes(currentTag.trim())) {
      setValue('tags', [...watchedTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: VideoFormData) => {
    try {
      // Validate YouTube URL
      const videoId = extractYouTubeVideoId(data.youtube_url);
      if (!videoId) {
        toast({
          title: 'Invalid YouTube URL',
          description: 'Please enter a valid YouTube video URL',
          variant: 'destructive',
        });
        return;
      }

      await createVideo.mutateAsync({
        title: data.title,
        description: data.description || undefined,
        youtube_url: data.youtube_url,
        category_id: data.category_id || undefined,
        duration_minutes: data.duration_minutes || undefined,
        tags: data.tags,
        thumbnail_url: undefined,
        is_active: true,
      });

      toast({
        title: 'Video Added',
        description: 'The video has been successfully added to the library',
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Training Video</DialogTitle>
          <DialogDescription>
            Add a new training video to your organization's library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter video title..."
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube_url">YouTube URL</Label>
            <Input
              id="youtube_url"
              placeholder="https://www.youtube.com/watch?v=..."
              {...register('youtube_url', { required: 'YouTube URL is required' })}
            />
            {errors.youtube_url && (
              <p className="text-sm text-destructive">{errors.youtube_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this video teaches..."
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select onValueChange={(value) => setValue('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                placeholder="15"
                {...register('duration_minutes', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {watchedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {watchedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createVideo.isPending}>
              {createVideo.isPending ? 'Adding...' : 'Add Video'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};