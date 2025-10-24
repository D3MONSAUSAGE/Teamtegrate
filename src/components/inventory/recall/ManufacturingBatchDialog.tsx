import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useInventory } from '@/contexts/inventory';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useBatchAutoGeneration } from '@/hooks/useBatchAutoGeneration';

const formSchema = z.object({
  item_id: z.string().min(1, 'Product selection is required'),
  batch_number: z.string().min(1, 'Batch number is required'),
  total_quantity_manufactured: z.coerce.number().positive('Quantity must be positive'),
  manufacturing_date: z.string().min(1, 'Manufacturing date is required'),
  manufacturing_shift: z.string().optional(),
  production_line: z.string().optional(),
  production_notes: z.string().optional(),
});

interface ManufacturingBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultItemId?: string;
}

export const ManufacturingBatchDialog: React.FC<ManufacturingBatchDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  defaultItemId,
}) => {
  const { user } = useAuth();
  const { items } = useInventory();
  const { generateBatchNumber, getCurrentShift } = useBatchAutoGeneration();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [productSearchTerm, setProductSearchTerm] = React.useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_id: '',
      batch_number: '',
      total_quantity_manufactured: 0,
      manufacturing_date: new Date().toISOString().split('T')[0],
      manufacturing_shift: '',
      production_line: '',
      production_notes: '',
    },
  });

  React.useEffect(() => {
    const initializeForm = async () => {
      if (open) {
        // Auto-generate batch number
        const batchNumber = await generateBatchNumber();
        const shift = getCurrentShift();
        
        form.reset({
          item_id: defaultItemId || '',
          batch_number: batchNumber,
          total_quantity_manufactured: 0,
          manufacturing_date: new Date().toISOString().split('T')[0],
          manufacturing_shift: shift,
          production_line: '',
          production_notes: '',
        });
      }
    };

    initializeForm();
  }, [open, defaultItemId, generateBatchNumber, getCurrentShift, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.organizationId) return;
    setIsSubmitting(true);

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: newBatch, error } = await supabase
        .from('manufacturing_batches')
        .insert([{
          organization_id: user.organizationId,
          item_id: values.item_id,
          lot_id: null,
          batch_number: values.batch_number,
          total_quantity_manufactured: values.total_quantity_manufactured,
          quantity_remaining: values.total_quantity_manufactured,
          manufacturing_date: values.manufacturing_date,
          manufacturing_shift: values.manufacturing_shift || null,
          production_line: values.production_line || null,
          production_notes: values.production_notes || null,
          created_by: user.id,
        }])
        .select(`
          *,
          inventory_items (
            id,
            name,
            sku,
            category_id
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Manufacturing batch created successfully!',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create manufacturing batch',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manufacturing Batch</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="batch_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Number * (Auto-generated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="BATCH-2025-001" 
                      {...field}
                      className="bg-muted/50"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Auto-generated, editable if needed</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => {
                const safeItems = Array.isArray(items) 
                  ? items.filter(item => item && item.is_active) 
                  : [];
                
                const filteredItems = productSearchTerm
                  ? safeItems.filter(item =>
                      item.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                      (item.sku && item.sku.toLowerCase().includes(productSearchTerm.toLowerCase()))
                    )
                  : safeItems;

                const selectedItem = safeItems.find(item => item.id === field.value);

                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>Product *</FormLabel>
                    
                    {/* Selected Product Display */}
                    {field.value && selectedItem && (
                      <div className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                        <div>
                          <div className="font-medium">{selectedItem.name}</div>
                          {selectedItem.sku && (
                            <div className="text-xs text-muted-foreground">{selectedItem.sku}</div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            field.onChange('');
                            setProductSearchTerm('');
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    )}

                    {/* Search Input */}
                    {!field.value && (
                      <FormControl>
                        <Input
                          placeholder="Search products by name or SKU..."
                          value={productSearchTerm}
                          onChange={(e) => setProductSearchTerm(e.target.value)}
                          disabled={!Array.isArray(items) || safeItems.length === 0}
                        />
                      </FormControl>
                    )}

                    {/* Dropdown Results */}
                    {!field.value && productSearchTerm && (
                      <div className="max-h-64 overflow-y-auto border rounded-md bg-background">
                        {filteredItems.length > 0 ? (
                          filteredItems
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((item) => (
                              <div
                                key={item.id}
                                className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                                onClick={() => {
                                  field.onChange(item.id);
                                  setProductSearchTerm('');
                                }}
                              >
                                <div className="font-medium">{item.name}</div>
                                {item.sku && (
                                  <div className="text-xs text-muted-foreground">{item.sku}</div>
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="p-3 text-muted-foreground text-center text-sm">
                            No products found matching "{productSearchTerm}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Loading/Empty State */}
                    {!field.value && !productSearchTerm && (
                      <p className="text-xs text-muted-foreground">
                        {!Array.isArray(items) 
                          ? "Loading products..." 
                          : safeItems.length === 0 
                            ? "No active products available"
                            : "Start typing to search for a product"}
                      </p>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="total_quantity_manufactured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Quantity Manufactured *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manufacturing_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manufacturing Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturing_shift"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="production_line"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Line</FormLabel>
                    <FormControl>
                      <Input placeholder="Line A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="production_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any notes about this production run..." 
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
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
