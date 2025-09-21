import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInventory } from '@/contexts/inventory';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

const unitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  abbreviation: z.string().min(1, 'Abbreviation is required'),
  unit_type: z.enum(['count', 'weight', 'volume', 'length', 'area'], {
    required_error: 'Unit type is required',
  }),
});

type UnitFormData = z.infer<typeof unitSchema>;

interface InventoryUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId?: string | null;
}

const UNIT_TYPES = [
  { value: 'count', label: 'Count (pieces, items, box, bag, case)' },
  { value: 'weight', label: 'Weight (pounds, ounces, kg)' },
  { value: 'volume', label: 'Volume (gallons, liters, cups)' },
  { value: 'length', label: 'Length (feet, meters, inches)' },
  { value: 'area', label: 'Area (sq ft, sq meters)' },
] as const;

export const InventoryUnitDialog: React.FC<InventoryUnitDialogProps> = ({
  open,
  onOpenChange,
  unitId
}) => {
  const { createUnit, updateUnit, units, loading } = useInventory();

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: '',
      abbreviation: '',
      unit_type: 'count',
    },
  });

  useEffect(() => {
    if (unitId && open) {
      const unit = units.find(u => u.id === unitId);
      if (unit) {
        form.reset({
          name: unit.name,
          abbreviation: unit.abbreviation,
          unit_type: unit.unit_type,
        });
      }
    } else if (open) {
      form.reset();
    }
  }, [unitId, open, units, form]);

  const onSubmit = async (values: UnitFormData) => {
    try {
      const unitData = {
        name: values.name,
        abbreviation: values.abbreviation,
        unit_type: values.unit_type,
        is_active: true,
      };
      
      if (unitId) {
        await updateUnit(unitId, unitData);
        toast.success('Unit updated successfully');
      } else {
        await createUnit(unitData);
        toast.success('Unit created successfully');
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving unit:', error);
      toast.error('Failed to save unit');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {unitId ? 'Edit Unit' : 'Create New Unit'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Unit Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Box, Pieces, Pounds, Gallons" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Abbreviation *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., box, pcs, lbs, gal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNIT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {loading ? 'Saving...' : unitId ? 'Update Unit' : 'Create Unit'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};