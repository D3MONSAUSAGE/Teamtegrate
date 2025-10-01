import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Store, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { teamItemPricingApi } from '@/contexts/inventory/api';
import { InventoryItem } from '@/contexts/inventory/types';
import { Alert, AlertDescription } from '@/components/ui/alert';

const pricingSchema = z.object({
  purchase_price: z.coerce.number().min(0, 'Purchase price must be 0 or greater').optional(),
  sale_price: z.coerce.number().min(0, 'Sale price must be 0 or greater').optional(),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be 0 or greater').optional(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

interface TeamPricingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  teamId: string;
  teamName: string;
  onSaved?: () => void;
}

export const TeamPricingDialog: React.FC<TeamPricingDialogProps> = ({
  open,
  onOpenChange,
  item,
  teamId,
  teamName,
  onSaved,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasTeamPricing, setHasTeamPricing] = useState(false);

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      purchase_price: undefined,
      sale_price: undefined,
      unit_cost: undefined,
    },
  });

  useEffect(() => {
    if (item && teamId && open) {
      loadTeamPricing();
    } else if (!open) {
      form.reset();
      setHasTeamPricing(false);
    }
  }, [item, teamId, open]);

  const loadTeamPricing = async () => {
    if (!item || !teamId) return;

    try {
      const teamPricing = await teamItemPricingApi.getByTeamAndItem(teamId, item.id);
      
      if (teamPricing) {
        setHasTeamPricing(true);
        form.reset({
          purchase_price: teamPricing.purchase_price || undefined,
          sale_price: teamPricing.sale_price || undefined,
          unit_cost: teamPricing.unit_cost || undefined,
        });
      } else {
        setHasTeamPricing(false);
        // Set default values from global pricing
        form.reset({
          purchase_price: item.purchase_price || undefined,
          sale_price: item.sale_price || undefined,
          unit_cost: item.unit_cost || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading team pricing:', error);
      toast.error('Failed to load team pricing');
    }
  };

  const onSubmit = async (values: PricingFormData) => {
    if (isSubmitting || !item || !teamId) return;

    setIsSubmitting(true);

    try {
      await teamItemPricingApi.upsert({
        team_id: teamId,
        item_id: item.id,
        purchase_price: values.purchase_price || null,
        sale_price: values.sale_price || null,
        unit_cost: values.unit_cost || null,
      });

      toast.success(`Team pricing updated for ${teamName}`);
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving team pricing:', error);
      toast.error('Failed to save team pricing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertToGlobal = async () => {
    if (!item || !teamId || !hasTeamPricing) return;

    try {
      await teamItemPricingApi.delete(teamId, item.id);
      toast.success('Reverted to global pricing');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error reverting to global pricing:', error);
      toast.error('Failed to revert to global pricing');
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Team Pricing - {teamName}
          </DialogTitle>
          <DialogDescription>
            Set location-specific pricing for <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {hasTeamPricing ? (
              <>This location has custom pricing. Changes won't affect other locations.</>
            ) : (
              <>Currently using global pricing. Set custom prices for this location only.</>
            )}
          </AlertDescription>
        </Alert>

        {/* Show global pricing for reference */}
        <div className="bg-muted/50 p-3 rounded-md space-y-1">
          <p className="text-sm font-medium">Global Pricing (Default)</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Purchase:</span> ${item.purchase_price?.toFixed(2) || 'N/A'}
            </div>
            <div>
              <span className="text-muted-foreground">Sale:</span> ${item.sale_price?.toFixed(2) || 'N/A'}
            </div>
            <div>
              <span className="text-muted-foreground">Unit Cost:</span> ${item.unit_cost?.toFixed(2) || 'N/A'}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price (per package)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={item.purchase_price?.toString() || '0.00'}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Cost to purchase from supplier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sale_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sale Price</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={item.sale_price?.toString() || '0.00'}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Price charged to customers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit_cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={item.unit_cost?.toString() || '0.00'}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Cost per individual unit
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : hasTeamPricing ? 'Update Pricing' : 'Set Custom Pricing'}
              </Button>
              {hasTeamPricing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRevertToGlobal}
                  disabled={isSubmitting}
                >
                  Revert to Global
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
