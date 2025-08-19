
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskFormValues } from '@/types/forms';
import { TaskPriority } from '@/types';

interface TaskFormFieldsEnhancedProps {
  form: UseFormReturn<TaskFormValues>;
  projects: Array<{ id: string; title: string }>;
  teamMembers: Array<{ id: string; name: string; email: string }>;
  showProjectField?: boolean;
  showAssignmentFields?: boolean;
}

const TaskFormFieldsEnhanced: React.FC<TaskFormFieldsEnhancedProps> = ({
  form,
  projects,
  teamMembers,
  showProjectField = true,
  showAssignmentFields = true
}) => {
  const { register, setValue, watch, formState: { errors } } = form;
  const deadline = watch('deadline');

  const priorities: { value: TaskPriority; label: string }[] = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Enter task title"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div>
        <Label>Priority *</Label>
        <Select
          value={watch('priority')}
          onValueChange={(value: TaskPriority) => setValue('priority', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            {priorities.map((priority) => (
              <SelectItem key={priority.value} value={priority.value}>
                {priority.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>
        )}
      </div>

      <div>
        <Label>Deadline *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deadline && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deadline ? format(new Date(deadline), "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deadline ? new Date(deadline) : undefined}
              onSelect={(date) => setValue('deadline', date || new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.deadline && (
          <p className="text-sm text-destructive mt-1">{errors.deadline.message}</p>
        )}
      </div>

      {showProjectField && (
        <div>
          <Label>Project</Label>
          <Select
            value={watch('projectId') || ''}
            onValueChange={(value) => setValue('projectId', value === 'none' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showAssignmentFields && (
        <div>
          <Label>Assign To</Label>
          <Select
            value={watch('assignedToId') || ''}
             onValueChange={(value) => {
               const member = teamMembers.find(m => m.id === value);
               setValue('assignedToId', value === 'unassigned' ? undefined : value);
               setValue('assignedToName', value === 'unassigned' ? undefined : member?.name);
             }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team member (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          {...register('cost', { 
            valueAsNumber: true,
            min: { value: 0, message: 'Cost must be positive' }
          })}
          placeholder="Enter cost (optional)"
        />
        {errors.cost && (
          <p className="text-sm text-destructive mt-1">{errors.cost.message}</p>
        )}
      </div>
    </div>
  );
};

export default TaskFormFieldsEnhanced;
