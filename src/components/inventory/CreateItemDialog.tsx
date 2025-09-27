import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InventoryCategory, InventoryUnit } from '@/contexts/inventory/types';
import { SKUGeneratorButton, SKUValidationIndicator } from './SKUGeneratorButton';
import { validateSKUUniqueness } from '@/utils/skuGenerator';
import { toast } from 'sonner';
import { TeamInventorySelector } from './TeamInventorySelector';
import { VendorSelector } from './VendorSelector';
import { VendorDialog } from './dialogs/VendorDialog';
import { ImageUpload } from './ImageUpload';
import { useInventory } from '@/contexts/inventory';
import { vendorsApi } from '@/contexts/inventory/api';

interface CreateItemDialogProps {
  open: boolean;
  onClose: () => void;
  onItemCreated: (item: any) => void;
  categories: InventoryCategory[];
  units: InventoryUnit[];
  prefilledBarcode?: string;
}

export const CreateItemDialog: React.FC<CreateItemDialogProps> = ({
  open,
  onClose,
  onItemCreated,
  categories,
  units,
  prefilledBarcode
}) => {
  const { vendors, refreshVendors } = useInventory();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: prefilledBarcode || '',
    description: '',
    category_id: '',
    base_unit_id: '',
    current_stock: 0,
    reorder_point: 0,
    reorder_quantity: 0,
    unit_cost: 0,
    sale_price: 0,
    team_id: null as string | null,
    vendor_id: null as string | null,
    image_url: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);

  React.useEffect(() => {
    if (prefilledBarcode) {
      setFormData(prev => ({ ...prev, barcode: prefilledBarcode }));
    }
  }, [prefilledBarcode]);

  const handleCreateVendor = async (vendorData: any) => {
    try {
      const newVendor = await vendorsApi.create(vendorData);
      await refreshVendors();
      setFormData(prev => ({ ...prev, vendor_id: newVendor.id }));
      toast.success(`Vendor "${newVendor.name}" created and selected`);
    } catch (error) {
      console.error('Failed to create vendor:', error);
      toast.error('Failed to create vendor');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    // Validate SKU uniqueness before submission if SKU is provided
    if (formData.sku && formData.sku.trim() !== '') {
      try {
        const skuValidation = await validateSKUUniqueness(formData.sku);
        if (!skuValidation.isUnique) {
          toast.error(skuValidation.message || 'SKU is already in use');
          return;
        }
      } catch (error) {
        console.error('❌ SKU validation error:', error);
        toast.error('Failed to validate SKU. Please try again.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Pass the data back to parent for API call
      console.log('📋 CreateItemDialog submitting form data:', formData);
      onItemCreated(formData);
      onClose();
        setFormData({
          name: '',
          sku: '',
          barcode: '',
          description: '',
          category_id: '',
          base_unit_id: '',
          current_stock: 0,
          reorder_point: 0,
          reorder_quantity: 0,
          unit_cost: 0,
          sale_price: 0,
          team_id: null,
          vendor_id: null,
          image_url: null,
        });
    } catch (error) {
      console.error('❌ CreateItemDialog error:', error);
      toast.error('Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter item name"
              required
            />
          </div>

          <div>
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              placeholder="Enter or scan barcode"
              readOnly={!!prefilledBarcode}
            />
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <div className="flex gap-2">
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                placeholder="Enter SKU or generate one"
              />
              <SKUGeneratorButton
                categoryId={formData.category_id}
                categories={categories}
                currentSKU={formData.sku}
                onSKUGenerated={(sku) => setFormData(prev => ({ ...prev, sku }))}
                disabled={isSubmitting}
              />
            </div>
            <SKUValidationIndicator
              sku={formData.sku}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="unit">Base Unit</Label>
            <Select value={formData.base_unit_id} onValueChange={(value) => setFormData(prev => ({ ...prev, base_unit_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map(unit => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Current Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData(prev => ({ ...prev, current_stock: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="cost">Unit Cost</Label>
              <Input
                id="cost"
                type="number"
                value={formData.unit_cost}
                onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sale_price">Sale Price (optional)</Label>
            <Input
              id="sale_price"
              type="number"
              value={formData.sale_price}
              onChange={(e) => setFormData(prev => ({ ...prev, sale_price: parseFloat(e.target.value) || 0 }))}
              min="0"
              step="0.01"
              placeholder="Enter sale price for profit calculation"
            />
          </div>

          <ImageUpload
            value={formData.image_url || undefined}
            onChange={(imageUrl) => setFormData(prev => ({ ...prev, image_url: imageUrl }))}
            disabled={isSubmitting}
          />

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <TeamInventorySelector
            value={formData.team_id}
            onChange={(teamId) => setFormData(prev => ({ ...prev, team_id: teamId }))}
            disabled={isSubmitting}
          />

          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <VendorSelector
              vendors={vendors}
              value={formData.vendor_id || undefined}
              onValueChange={(vendorId) => setFormData(prev => ({ ...prev, vendor_id: vendorId || null }))}
              onAddVendor={() => setIsVendorDialogOpen(true)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Creating...' : 'Create Item'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <VendorDialog
        open={isVendorDialogOpen}
        onOpenChange={setIsVendorDialogOpen}
        onSave={handleCreateVendor}
      />
    </Dialog>
  );
};