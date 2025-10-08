import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useRecipeCostCategories, useCreateCostCategory, useUpdateCostCategory, useDeleteCostCategory } from '@/hooks/useRecipeCostCategories';
import { RecipeCostCategory } from '@/contexts/inventory/api/recipeCostCategories';

interface ManageCostCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageCostCategoriesDialog: React.FC<ManageCostCategoriesDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { data: categories = [], isLoading } = useRecipeCostCategories();
  const { mutate: createCategory } = useCreateCostCategory();
  const { mutate: updateCategory } = useUpdateCostCategory();
  const { mutate: deleteCategory } = useDeleteCostCategory();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingId) {
      updateCategory(
        { id: editingId, updates: { name, description } },
        {
          onSuccess: () => {
            setEditingId(null);
            setName('');
            setDescription('');
          },
        }
      );
    } else {
      createCategory(
        { name, description },
        {
          onSuccess: () => {
            setIsAdding(false);
            setName('');
            setDescription('');
          },
        }
      );
    }
  };

  const handleEdit = (category: RecipeCostCategory) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setIsAdding(false);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Cost Categories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add/Edit Form */}
          {(isAdding || editingId) && (
            <div className="p-4 border rounded-lg space-y-3 bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Electricity, Water, Gas, Labor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Description</Label>
                <Textarea
                  id="categoryDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!name.trim()} className="flex-1">
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Add Button */}
          {!isAdding && !editingId && (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add New Category
            </Button>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-muted-foreground">Existing Categories</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories yet. Create your first one above.
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete category "${category.name}"?`)) {
                            deleteCategory(category.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
