
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Plus, Save } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  CoreDialog,
  CoreDialogContent,
  CoreDialogHeader,
  CoreDialogBody,
  CoreDialogFooter,
  CoreDialogTitle,
  CoreDialogDescription
} from '@/components/ui/core-dialog';

interface NewCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  onSubmit: (taskData: any) => Promise<void>;
}

const NewCreateTaskDialog: React.FC<NewCreateTaskDialogProps> = ({
  open,
  onOpenChange,
  editingTask,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(),
    priority: 'Medium',
    status: 'To Do' as TaskStatus,
    assignedTo: ''
  });

  useEffect(() => {
    if (editingTask && open) {
      setFormData({
        title: editingTask.title || '',
        description: editingTask.description || '',
        deadline: new Date(editingTask.deadline) || new Date(),
        priority: editingTask.priority || 'Medium',
        status: editingTask.status || 'To Do',
        assignedTo: editingTask.userId || ''
      });
    } else if (open) {
      setFormData({
        title: '',
        description: '',
        deadline: new Date(),
        priority: 'Medium',
        status: 'To Do' as TaskStatus,
        assignedTo: ''
      });
    }
  }, [editingTask, open]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        deadline: formData.deadline.toISOString()
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <CoreDialog open={open} onOpenChange={onOpenChange}>
      <CoreDialogContent variant="sheet">
        <CoreDialogHeader>
          <CoreDialogTitle>
            {editingTask ? "Edit Task" : "Create New Task"}
          </CoreDialogTitle>
          <CoreDialogDescription>
            {editingTask ? "Update task details" : "Add a new task to your project"}
          </CoreDialogDescription>
        </CoreDialogHeader>

        <CoreDialogBody>
          <div className="space-y-6">
            {/* Task Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Task Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Enter task title..."
                className="h-12 text-base"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your task..."
                className="min-h-[100px] text-base resize-none"
                rows={4}
              />
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData('status', value as TaskStatus)}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 text-base justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5" />
                    {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) => date && updateFormData('deadline', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assignment */}
            <div className="space-y-2">
              <Label htmlFor="assignedTo" className="text-sm font-medium">
                Assign To
              </Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => updateFormData('assignedTo', e.target.value)}
                placeholder="Enter user ID or email..."
                className="h-12 text-base"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to assign to yourself
              </p>
            </div>
          </div>
        </CoreDialogBody>

        <CoreDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-base font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim() || isSubmitting}
            className="flex-1 h-12 text-base font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                {editingTask ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {editingTask ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingTask ? 'Update Task' : 'Create Task'}
              </>
            )}
          </Button>
        </CoreDialogFooter>
      </CoreDialogContent>
    </CoreDialog>
  );
};

export default NewCreateTaskDialog;
