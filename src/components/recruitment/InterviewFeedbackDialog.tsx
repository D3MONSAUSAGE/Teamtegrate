import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { FeedbackRecommendation } from '@/types/recruitment';

const formSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  recommendation: z.enum(['proceed', 'reject', 'unsure']),
  cultural_fit_score: z.coerce.number().min(1).max(5).optional(),
  technical_skills_score: z.coerce.number().min(1).max(5).optional(),
  communication_score: z.coerce.number().min(1).max(5).optional(),
  strengths: z.string().optional(),
  concerns: z.string().optional(),
  private_notes: z.string().optional(),
});

interface InterviewFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewId: string;
  candidateId: string;
}

export function InterviewFeedbackDialog({
  open,
  onOpenChange,
  interviewId,
  candidateId,
}: InterviewFeedbackDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const submitFeedback = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!user?.organizationId) throw new Error('No organization');

      const { error } = await supabase.from('recruitment_interview_feedback').insert({
        organization_id: user.organizationId,
        interview_id: interviewId,
        candidate_id: candidateId,
        interviewer_id: user.id,
        rating: values.rating,
        recommendation: values.recommendation as FeedbackRecommendation,
        cultural_fit_score: values.cultural_fit_score,
        technical_skills_score: values.technical_skills_score,
        communication_score: values.communication_score,
        strengths: values.strengths ? values.strengths.split('\n') : [],
        concerns: values.concerns ? values.concerns.split('\n') : [],
        private_notes: values.private_notes,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-interviews'] });
      toast.success('Feedback submitted successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    submitFeedback.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Feedback</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating (1-5)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recommendation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recommendation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="proceed">Proceed to Next Stage</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="unsure">Unsure</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cultural_fit_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultural Fit</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="5" placeholder="1-5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="technical_skills_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Technical Skills</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="5" placeholder="1-5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communication_score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="5" placeholder="1-5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="strengths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Strengths (one per line)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Key strengths observed..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concerns"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concerns (one per line)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Any concerns or red flags..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="private_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Private Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Internal notes (not shared with candidate)..." {...field} />
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
                disabled={submitFeedback.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitFeedback.isPending}>
                {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
