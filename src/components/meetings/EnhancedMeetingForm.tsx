import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Video, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import MeetingDateTimeSection from './MeetingDateTimeSection';
import { TimezoneIndicator } from './TimezoneIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserTimezone } from '@/hooks/useUserTimezone';

const meetingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_date: z.date(),
  start_time: z.string(),
  end_date: z.date(),
  end_time: z.string(),
  location: z.string().optional(),
});

type MeetingFormData = z.infer<typeof meetingSchema>;

interface EnhancedMeetingFormProps {
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  googleCalendarConnected?: boolean;
}

const EnhancedMeetingForm: React.FC<EnhancedMeetingFormProps> = ({
  onSubmit,
  isLoading = false,
  googleCalendarConnected = false,
}) => {
  const { user } = useAuth();
  const { userTimezone } = useUserTimezone();
  const [startTimeInput, setStartTimeInput] = useState('09:00');
  const [endTimeInput, setEndTimeInput] = useState('10:00');

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      description: '',
      start_date: new Date(),
      end_date: new Date(),
      location: '',
    },
  });

  const handleSubmit = async (data: MeetingFormData) => {
    try {
      // Combine date and time
      const startDateTime = new Date(data.start_date);
      const [startHour, startMinute] = data.start_time.split(':').map(Number);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(data.end_date);
      const [endHour, endMinute] = data.end_time.split(':').map(Number);
      endDateTime.setHours(endHour, endMinute, 0, 0);

      const meetingData = {
        title: data.title,
        description: data.description,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        location: data.location,
        organizer_id: user?.id,
        organization_id: user?.organizationId,
        status: 'pending' as const,
      };

      // Create meeting
      const { data: meeting, error: meetingError } = await supabase
        .from('meeting_requests')
        .insert(meetingData)
        .select()
        .single();

      if (meetingError) {
        throw meetingError;
      }

      // Meeting will automatically sync via database trigger if user has Google Calendar connected
      toast.success('Meeting created successfully!');

      await onSubmit(meeting);
      form.reset();
      
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast.error('Failed to create meeting');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Meeting
        </CardTitle>
        <CardDescription>
          Create a new meeting and optionally sync with Google Calendar
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Meeting Title
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meeting title" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Meeting agenda or description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Meeting Time</span>
                <TimezoneIndicator showLabel={true} />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <MeetingDateTimeSection
                  label="Start"
                  date={form.watch('start_date')}
                  onDateChange={(date) => form.setValue('start_date', date || new Date())}
                  timeInput={startTimeInput}
                  onTimeChange={(time) => {
                    setStartTimeInput(time);
                    form.setValue('start_time', time);
                  }}
                  required
                />

                <MeetingDateTimeSection
                  label="End"
                  date={form.watch('end_date')}
                  onDateChange={(date) => form.setValue('end_date', date || new Date())}
                  timeInput={endTimeInput}
                  onTimeChange={(time) => {
                    setEndTimeInput(time);
                    form.setValue('end_time', time);
                  }}
                  required
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {googleCalendarConnected && (
              <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
                <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Auto-sync enabled</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    <Video className="h-3 w-3 mr-1" />
                    Google Meet
                  </Badge>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  This meeting will automatically sync to your Google Calendar with a Google Meet link.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule Meeting
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EnhancedMeetingForm;