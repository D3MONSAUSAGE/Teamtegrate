
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { useEvents } from '@/hooks/useEvents';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date | null;
}

interface EventFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  open,
  onOpenChange,
  defaultDate
}) => {
  const { createEvent } = useEvents();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventFormData>();

  const onSubmit = async (data: EventFormData) => {
    const eventData = {
      title: data.title,
      description: data.description,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date)
    };

    const success = await createEvent(eventData);
    if (success) {
      reset();
      onOpenChange(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const defaultStartDate = defaultDate ? formatDateForInput(defaultDate) : '';
  const defaultEndDate = defaultDate ? formatDateForInput(new Date(defaultDate.getTime() + 60 * 60 * 1000)) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Event title"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Event description (optional)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="start_date">Start Date & Time</Label>
            <Input
              id="start_date"
              type="datetime-local"
              {...register('start_date', { required: 'Start date is required' })}
              defaultValue={defaultStartDate}
            />
            {errors.start_date && (
              <p className="text-sm text-red-500 mt-1">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="end_date">End Date & Time</Label>
            <Input
              id="end_date"
              type="datetime-local"
              {...register('end_date', { required: 'End date is required' })}
              defaultValue={defaultEndDate}
            />
            {errors.end_date && (
              <p className="text-sm text-red-500 mt-1">{errors.end_date.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Event</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
