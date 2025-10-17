import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PaymentType } from '@/types/invoices';

interface PaymentTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Omit<PaymentType, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  paymentType?: PaymentType;
}

export const PaymentTypeDialog: React.FC<PaymentTypeDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  paymentType,
}) => {
  const [formData, setFormData] = useState({
    name: paymentType?.name || '',
    description: paymentType?.description || '',
    is_cash_equivalent: paymentType?.is_cash_equivalent || false,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
      setFormData({ name: '', description: '', is_cash_equivalent: false, is_active: true });
    } catch (error) {
      // Error handled by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {paymentType ? 'Edit Payment Type' : 'Add Payment Type'}
          </DialogTitle>
          <DialogDescription>
            Configure a payment method for your invoices
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Cash, Check, Venmo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Cash Equivalent</Label>
              <div className="text-sm text-muted-foreground">
                Mark if this payment should be counted as cash on hand
              </div>
            </div>
            <Switch
              checked={formData.is_cash_equivalent}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, is_cash_equivalent: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};