
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarIcon, 
  Clock, 
  User, 
  Flag,
  Plus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import MobileDialogWrapper from './MobileDialogWrapper';

interface ModernCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  onSubmit: (taskData: any) => Promise<void>;
}

const ModernCreateTaskDialog: React.FC<ModernCreateTaskDialogProps> = ({
  open,
  onOpenChange,
  editingTask,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(),
    priority: 'Medium',
    status: 'To Do' as TaskStatus,
    assignedTo: ''
  });

  const steps = [
    { id: 'basic', title: 'Basic Info', icon: Plus },
    { id: 'details', title: 'Details', icon: Flag },
    { id: 'assignment', title: 'Assignment', icon: User },
    { id: 'review', title: 'Review', icon: CheckCircle2 }
  ];

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
    setCurrentStep(0);
  }, [editingTask, open]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

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

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title.trim().length > 0;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return formData.title.trim().length > 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Create New Task</h3>
              <p className="text-muted-foreground">Let's start with the basics</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-base font-medium">Task Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Enter task title..."
                  className="h-12 text-base mt-2"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe your task..."
                  className="min-h-[100px] text-base mt-2 resize-none"
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold">Task Details</h3>
              <p className="text-muted-foreground">Set priority and deadline</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value) => updateFormData('priority', value)}>
                  <SelectTrigger className="h-12 text-base mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="High">High Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 text-base mt-2 justify-start text-left font-normal",
                        !formData.deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={(date) => date && updateFormData('deadline', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-base font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData('status', value as TaskStatus)}>
                  <SelectTrigger className="h-12 text-base mt-2">
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Task Assignment</h3>
              <p className="text-muted-foreground">Who will work on this task?</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="assignedTo" className="text-base font-medium">Assign To</Label>
                <Input
                  id="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => updateFormData('assignedTo', e.target.value)}
                  placeholder="Enter user ID or email..."
                  className="h-12 text-base mt-2"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Leave empty to assign to yourself
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold">Review & Create</h3>
              <p className="text-muted-foreground">Check your task details</p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <h4 className="font-semibold text-lg mb-2">{formData.title}</h4>
                {formData.description && (
                  <p className="text-muted-foreground text-sm mb-3">{formData.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {formData.priority} Priority
                  </span>
                  <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                    {formData.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  Due {format(formData.deadline, "PPP")}
                </div>
                {formData.assignedTo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <User className="h-4 w-4" />
                    Assigned to {formData.assignedTo}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileDialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={editingTask ? "Edit Task" : "Create Task"}
      subtitle={`Step ${currentStep + 1} of ${steps.length}`}
      variant="bottom-sheet"
      className="flex flex-col"
    >
      {/* Progress Indicator */}
      <div className="px-6 py-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                  index <= currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted text-muted-foreground"
                )}
              >
                <StepIcon className="h-4 w-4" />
              </div>
            );
          })}
        </div>
        <div className="flex">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "flex-1 h-1 mx-1 rounded-full transition-all",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <ScrollArea className="flex-1 px-6">
        <div className="py-6">
          {renderStep()}
        </div>
      </ScrollArea>

      {/* Navigation Buttons */}
      <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1 h-12 text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 h-12 text-base"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="flex-1 h-12 text-base bg-gradient-to-r from-primary to-emerald-500 hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  {editingTask ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {editingTask ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </MobileDialogWrapper>
  );
};

export default ModernCreateTaskDialog;
