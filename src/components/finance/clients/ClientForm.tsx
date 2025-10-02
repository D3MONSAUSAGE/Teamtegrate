import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceClients } from '@/hooks/useInvoiceClients';
import { InvoiceClient } from '@/types/invoices';

interface ClientFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

type ClientFormData = Omit<InvoiceClient, 'id' | 'organization_id' | 'created_by' | 'created_at' | 'updated_at'>;

export const ClientForm: React.FC<ClientFormProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const { createClient } = useInvoiceClients();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormData>({
    defaultValues: {
      country: 'US',
      is_active: true
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      await createClient(data);
      toast({
        title: 'Success',
        description: 'Client created successfully'
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create client',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Client Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Client name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_id">Tax ID</Label>
              <Input
                id="tax_id"
                {...register('tax_id')}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                {...register('address')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                {...register('state')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...register('country', { required: 'Country is required' })}
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
