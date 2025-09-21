import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useInventory } from '@/contexts/inventory';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface InventoryCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string | null;
}

export const InventoryCategoryDialog: React.FC<InventoryCategoryDialogProps> = ({
  open,
  onOpenChange,
  categoryId
}) => {
  const { createCategory, updateCategory, categories, loading } = useInventory();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (categoryId && open) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        form.reset({
          name: category.name,
          description: category.description || '',
        });
      }
    } else if (open) {
      form.reset();
    }
  }, [categoryId, open, categories, form]);

  const onSubmit = async (values: CategoryFormData) => {
    try {
      const categoryData = {
        name: values.name,
        description: values.description || '',
        is_active: true,
      };
      
      if (categoryId) {
        await updateCategory(categoryId, categoryData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(categoryData);
        toast.success('Category created successfully');
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            {categoryId ? 'Edit Category' : 'Create New Category'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter category description (optional)" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : categoryId ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};