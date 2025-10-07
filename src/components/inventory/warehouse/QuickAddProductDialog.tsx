import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { useInventory } from '@/contexts/inventory';
import { toast } from 'sonner';

interface QuickAddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onProductCreated?: () => void;
}

export const QuickAddProductDialog: React.FC<QuickAddProductDialogProps> = ({
  open,
  onOpenChange,
  warehouseId,
  onProductCreated
}) => {
  const { createItem, refreshItems } = useInventory();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    unitCost: '',
    initialQuantity: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      setLoading(true);

      // Create the product in master inventory
      const newItem = await createItem({
        name: formData.name.trim(),
        sku: formData.sku.trim() || undefined,
        barcode: formData.barcode.trim() || undefined,
        unit_cost: formData.unitCost ? parseFloat(formData.unitCost) : 0,
        base_unit_id: null, // User can set this later
        category_id: null, // User can set this later
        current_stock: 0, // Start with zero, user will receive inventory
        is_active: true,
        is_template: false,
        sort_order: 0
      });

      if (!newItem) {
        throw new Error('Failed to create product');
      }

      toast.success(`Product "${formData.name}" created successfully`);

      // Refresh inventory items
      await refreshItems();

      // Reset form
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        unitCost: '',
        initialQuantity: ''
      });

      // Call callback
      onProductCreated?.();
      onOpenChange(false);

      // Show next step
      toast.info('Now you can receive this product into the warehouse using "Receive Inventory"');
    } catch (error: any) {
      console.error('Failed to create product:', error);
      toast.error(error?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Add Product
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Pepino"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-sku">SKU (Optional)</Label>
            <Input
              id="product-sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g., PEP-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-barcode">Barcode (Optional)</Label>
            <Input
              id="product-barcode"
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="e.g., 123456789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-cost">Unit Cost (Optional)</Label>
            <Input
              id="product-cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
              placeholder="e.g., 2.50"
            />
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Next Steps:</p>
            <p className="text-xs">After creating the product, use "Receive Inventory" to add stock to this warehouse.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
