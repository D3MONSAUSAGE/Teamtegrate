import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useSalesChannels } from '@/hooks/useSalesChannels';
import type { SalesChannel } from '@/types/salesChannels';

const salesChannelSchema = z.object({
  name: z.string().min(1, 'Channel name is required'),
  description: z.string().optional(),
  commission_type: z.enum(['percentage', 'flat_fee']),
  commission_rate: z.number().min(0).max(1).optional(),
  flat_fee_amount: z.number().min(0).optional(),
  location: z.string().optional(),
}).refine((data) => {
  if (data.commission_type === 'percentage') {
    return data.commission_rate !== undefined && data.commission_rate > 0;
  } else {
    return data.flat_fee_amount !== undefined && data.flat_fee_amount > 0;
  }
}, {
  message: "Commission rate or flat fee amount is required based on commission type",
  path: ["commission_rate"]
});

type FormData = z.infer<typeof salesChannelSchema>;

interface SalesChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel?: SalesChannel | null;
}

export const SalesChannelDialog: React.FC<SalesChannelDialogProps> = ({
  open,
  onOpenChange,
  channel
}) => {
  const { createChannel, updateChannel } = useSalesChannels();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(salesChannelSchema),
    defaultValues: {
      name: '',
      description: '',
      commission_type: 'percentage',
      commission_rate: 0.15, // Default 15%
      flat_fee_amount: 0,
      location: '',
    }
  });

  const commissionType = form.watch('commission_type');

  useEffect(() => {
    if (channel) {
      form.reset({
        name: channel.name,
        description: channel.description || '',
        commission_type: channel.commission_type,
        commission_rate: channel.commission_rate,
        flat_fee_amount: channel.flat_fee_amount || 0,
        location: channel.location || '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        commission_type: 'percentage',
        commission_rate: 0.15,
        flat_fee_amount: 0,
        location: '',
      });
    }
  }, [channel, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const channelData = {
        name: data.name,
        description: data.description,
        commission_type: data.commission_type,
        commission_rate: data.commission_type === 'percentage' ? (data.commission_rate || 0) : 0,
        flat_fee_amount: data.commission_type === 'flat_fee' ? (data.flat_fee_amount || 0) : 0,
        location: data.location,
      };

      let success = false;
      if (channel) {
        success = await updateChannel(channel.id, channelData);
      } else {
        success = await createChannel(channelData);
      }

      if (success) {
        onOpenChange(false);
        form.reset();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {channel ? 'Edit Sales Channel' : 'Add Sales Channel'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., DoorDash, Grubhub, Uber Eats" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this sales channel"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commission Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id="percentage" />
                        <Label htmlFor="percentage">Percentage of Sales</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flat_fee" id="flat_fee" />
                        <Label htmlFor="flat_fee">Flat Fee per Order</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {commissionType === 'percentage' ? (
              <FormField
                control={form.control}
                name="commission_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="100"
                        placeholder="15.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) / 100)}
                        value={field.value ? (field.value * 100).toString() : ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the percentage (e.g., 15 for 15%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="flat_fee_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flat Fee per Order ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="2.50"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        value={field.value?.toString() || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Fixed amount charged per order
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Leave blank for all locations" {...field} />
                  </FormControl>
                  <FormDescription>
                    Restrict this channel to a specific location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (channel ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};