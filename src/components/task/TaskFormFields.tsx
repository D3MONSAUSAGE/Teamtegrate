import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskPriority } from '@/types';
import { Loader2, CalendarIcon, Clock } from 'lucide-react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskFormFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  setValue: (name: string, value: any) => void;
  selectedMember: string | undefined;
  setSelectedMember: (value: string | undefined) => void;
  appUsers?: AppUser[];
  isLoadingUsers: boolean;
  projects: any[];
  editingTask?: any;
  currentProjectId?: string;
}

const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  register,
  errors,
  setValue,
  selectedMember,
  setSelectedMember,
  appUsers,
  isLoadingUsers,
  projects,
  editingTask,
  currentProjectId
}) => {
  const [date, setDate] = useState<Date | undefined>(
    editingTask ? new Date(editingTask.deadline) : undefined
  );
  
  const [timeInput, setTimeInput] = useState<string>(
    editingTask ? format(new Date(editingTask.deadline), 'HH:mm') : '12:00'
  );
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, role')
          .order('name');
          
        if (error) {
          console.error('Error loading users:', error);
          return;
        }
        
        if (data) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  const handleDateChange = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    const [hours, minutes] = timeInput.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours || 0, minutes || 0, 0, 0);
    
    setDate(newDate);
    setValue('deadline', newDate.toISOString());
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
    
    if (date) {
      const [hours, minutes] = e.target.value.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours || 0, minutes || 0, 0, 0);
      setValue('deadline', newDate.toISOString());
    }
  };

  const handleUserAssignment = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name);
    } else {
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
        <Input
          id="title"
          placeholder="Task title"
          {...register('title', { required: 'Title is required' })}
        />
        {errors.title && (
          <span className="text-xs text-red-500">{errors.title.message as string}</span>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Task description"
          {...register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectId">Project</Label>
        <Select
          defaultValue={editingTask?.projectId || currentProjectId || ''}
          onValueChange={(value) => setValue('projectId', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select project (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Project</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Select
          value={selectedMember}
          onValueChange={handleUserAssignment}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assign to user (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                <span className="text-sm">Loading users...</span>
              </div>
            ) : users.map(user => (
              <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority">Priority <span className="text-red-500">*</span></Label>
        <Select
          defaultValue={editingTask?.priority || 'Medium'}
          onValueChange={(value) => setValue('priority', value as TaskPriority)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Deadline <span className="text-red-500">*</span></Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full sm:w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Select date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateChange}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            <Input
              type="time"
              value={timeInput}
              onChange={handleTimeChange}
              className="w-[120px]"
            />
          </div>
        </div>
        {errors.deadline && (
          <span className="text-xs text-red-500">{errors.deadline.message as string}</span>
        )}
        <input
          type="hidden"
          {...register('deadline', { required: 'Deadline is required' })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Cost</Label>
        <Input
          id="cost"
          type="number"
          step="0.01"
          min="0"
          placeholder="Task cost (optional)"
          {...register('cost')}
        />
      </div>
    </>
  );
};

export default TaskFormFields;
