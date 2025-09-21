import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useInventory } from '@/contexts/inventory';
import { InventoryItem } from '@/contexts/inventory/types';
import { useTeamContext } from '@/hooks/useTeamContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  unit_cost: z.coerce.number().min(0, 'Cost must be 0 or greater'),
  minimum_threshold: z.coerce.number().min(0, 'Minimum threshold must be 0 or greater'),
  maximum_threshold: z.coerce.number().min(0, 'Maximum threshold must be 0 or greater'),
  current_stock: z.coerce.number().min(0, 'Current stock must be 0 or greater'),
  location: z.string().optional(),
  team_id: z.string().optional(),
  description: z.string().optional(),
});

type InventoryItemFormData = z.infer<typeof inventoryItemSchema>;

interface InventoryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId?: string | null;
}

const CATEGORIES = [
  'Raw Materials',
  'Finished Goods',
  'Work in Progress',
  'Supplies',
  'Equipment',
  'Other'
];

const UNITS_OF_MEASURE = [
  'Each',
  'Box',
  'Case',
  'Lbs',
  'Kg',
  'Gallons',
  'Liters',
  'Yards',
  'Meters',
  'Square Feet',
  'Square Meters'
];

export const InventoryItemDialog: React.FC<InventoryItemDialogProps> = ({
  open,
  onOpenChange,
  itemId
}) => {
  const { createItem, updateItem, getItemById, loading } = useInventory();
  const teamContext = useTeamContext();
  
  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unit_of_measure: '',
      unit_cost: 0,
      minimum_threshold: 0,
      maximum_threshold: 100,
      current_stock: 0,
      location: '',
      team_id: 'none',
      description: '',
    },
  });

  const isEditing = !!itemId;

  // Load item for editing
  useEffect(() => {
    if (isEditing && itemId && open) {
      const loadItem = async () => {
        try {
          const item = await getItemById(itemId);
          if (item) {
            form.reset({
              name: item.name,
              sku: item.sku || '',
              category: item.category || '',
              unit_of_measure: item.unit_of_measure,
              unit_cost: item.unit_cost || 0,
              minimum_threshold: item.minimum_threshold || 0,
              maximum_threshold: item.maximum_threshold || 100,
              current_stock: item.current_stock,
              location: item.location || '',
              team_id: item.team_id || 'none',
              description: item.description || '',
            });
          }
        } catch (error) {
          console.error('Failed to load item:', error);
          toast.error('Failed to load item details');
        }
      };
      loadItem();
    } else if (!isEditing && open) {
      form.reset({
        name: '',
        sku: '',
        category: '',
        unit_of_measure: '',
        unit_cost: 0,
        minimum_threshold: 0,
        maximum_threshold: 100,
        current_stock: 0,
        location: '',
        team_id: teamContext?.selectedTeam?.id || 'none',
        description: '',
      });
    }
  }, [itemId, isEditing, open, form, getItemById, teamContext?.selectedTeam?.id]);

  const onSubmit = async (data: InventoryItemFormData) => {
    try {
      const itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'> = {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unit_of_measure: data.unit_of_measure,
        unit_cost: data.unit_cost,
        minimum_threshold: data.minimum_threshold,
        maximum_threshold: data.maximum_threshold,
        current_stock: data.current_stock,
        location: data.location,
        team_id: data.team_id === 'none' ? '' : data.team_id,
        description: data.description,
        organization_id: '', // This will be set by the API
        created_by: '', // This will be set by the API  
        is_active: true,
        is_template: false,
        sort_order: 0,
      };

      if (isEditing && itemId) {
        await updateItem(itemId, itemData);
        toast.success('Item updated successfully');
      } else {
        await createItem(itemData);
        toast.success('Item created successfully');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save item:', error);
      toast.error('Failed to save item');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_of_measure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS_OF_MEASURE.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="current_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Stock</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minimum_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maximum_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" placeholder="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Storage location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {teamContext?.userTeams && teamContext.userTeams.length > 0 && (
              <FormField
                control={form.control}
                name="team_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Team</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No team assigned</SelectItem>
                        {teamContext.userTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Item description (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};