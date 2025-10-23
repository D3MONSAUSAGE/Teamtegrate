import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOffboarding } from '@/hooks/hr/useOffboarding';
import { OffboardingFormData, terminationTypeLabels } from '@/types/offboarding';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const offboardingSchema = z.object({
  termination_date: z.string().min(1, 'Termination date is required'),
  last_day_worked: z.string().optional(),
  termination_type: z.enum(['voluntary', 'involuntary', 'layoff', 'retirement']),
  termination_reason: z.string().min(10, 'Please provide a detailed reason (minimum 10 characters)'),
  eligible_for_rehire: z.boolean().default(true),
  offboarding_notes: z.string().optional(),
  revoke_access_immediately: z.boolean().default(false),
});

interface OffboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const OffboardingDialog: React.FC<OffboardingDialogProps> = ({
  open,
  onOpenChange,
  userId,
  userName,
}) => {
  const { initiateOffboarding } = useOffboarding();

  const form = useForm<OffboardingFormData>({
    resolver: zodResolver(offboardingSchema),
    defaultValues: {
      termination_date: new Date().toISOString().split('T')[0],
      termination_type: 'voluntary',
      eligible_for_rehire: true,
      revoke_access_immediately: false,
    },
  });

  const onSubmit = async (data: OffboardingFormData) => {
    await initiateOffboarding.mutateAsync({ userId, data });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Initiate Employee Offboarding</DialogTitle>
          <DialogDescription>
            Start the offboarding process for {userName}. This will create a structured workflow
            to ensure all termination tasks are completed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Starting this process will mark the employee as terminated. Their historical data
                will be preserved for compliance and reporting purposes.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="termination_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Termination Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_day_worked"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Day Worked</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Leave empty if same as termination date</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="termination_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Termination Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select termination type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(terminationTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="termination_reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Termination Reason *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed reason for termination..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This information is confidential and used for HR records only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="offboarding_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Offboarding Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the offboarding process..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eligible_for_rehire"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Eligible for Rehire</FormLabel>
                    <FormDescription>
                      Check this if the employee would be considered for rehire in the future
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="revoke_access_immediately"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-destructive/50 p-4 bg-destructive/5">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-destructive">Revoke Access Immediately</FormLabel>
                    <FormDescription>
                      If checked, the employee's platform access will be revoked right away.
                      Otherwise, access remains until their last day worked.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={initiateOffboarding.isPending}>
                {initiateOffboarding.isPending ? 'Processing...' : 'Start Offboarding'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default OffboardingDialog;
