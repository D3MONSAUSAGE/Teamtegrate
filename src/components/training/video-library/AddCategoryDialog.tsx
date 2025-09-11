import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { useCreateCategory } from '@/hooks/useVideoLibrary';
import { useToast } from '@/hooks/use-toast';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

const predefinedColors = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#84cc16', // Lime
];

export const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({ open, onOpenChange }) => {
  const createCategory = useCreateCategory();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CategoryFormData>({
    defaultValues: {
      color: predefinedColors[0],
    }
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: CategoryFormData) => {
    try {
      await createCategory.mutateAsync({
        name: data.name,
        description: data.description || undefined,
        color: data.color,
        is_active: true,
      });

      toast({
        title: 'Category Created',
        description: 'The category has been successfully created',
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Video Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your training videos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g. Safety Procedures"
              {...register('name', { required: 'Category name is required' })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what types of videos belong in this category..."
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex space-x-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-ring' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
                className="w-12 h-8 p-1"
              />
              <span className="text-sm text-muted-foreground">or choose custom color</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};