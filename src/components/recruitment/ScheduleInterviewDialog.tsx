import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useRecruitmentInterviews } from '@/hooks/recruitment/useRecruitmentInterviews';
import { useAuth } from '@/contexts/AuthContext';
import type { InterviewType } from '@/types/recruitment';

const formSchema = z.object({
  interview_type: z.enum(['phone', 'in_person', 'video', 'technical', 'panel']),
  scheduled_date: z.string().min(1, 'Date is required'),
  duration_minutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  location: z.string().optional(),
  phone_number: z.string().optional(),
});

interface ScheduleInterviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
}

export function ScheduleInterviewDialog({
  open,
  onOpenChange,
  candidateId,
}: ScheduleInterviewDialogProps) {
  const { user } = useAuth();
  const { scheduleInterview, isScheduling } = useRecruitmentInterviews();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration_minutes: 60,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.organizationId) return;

    scheduleInterview(
      {
        candidate_id: candidateId,
        interviewer_id: user.id,
        interview_type: values.interview_type as InterviewType,
        scheduled_date: values.scheduled_date,
        duration_minutes: values.duration_minutes,
        location: values.location,
        phone_number: values.phone_number,
        status: 'scheduled',
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="interview_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="panel">Panel</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Office, Meeting Room, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="For phone/video interviews" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isScheduling}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isScheduling}>
                {isScheduling ? 'Scheduling...' : 'Schedule'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
