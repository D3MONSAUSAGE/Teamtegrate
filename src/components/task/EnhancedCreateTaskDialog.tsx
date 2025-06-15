import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import TimeSelector from "@/components/ui/time-selector";
import { 
  CalendarIcon, 
  Clock, 
  Users, 
  DollarSign, 
  AlertCircle, 
  X,
  Plus,
  Target,
  Briefcase
} from 'lucide-react';
import { format } from "date-fns";
import { Task, User, Project, TaskPriority } from '@/types';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';

interface EnhancedCreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
  projects: Project[];
  users: User[];
  loadingUsers: boolean;
  onSubmit: (data: any, selectedUsers: User[]) => Promise<void>;
}

const EnhancedCreateTaskDialog: React.FC<EnhancedCreateTaskDialogProps> = ({
  open,
  onOpenChange,
  editingTask,
  currentProjectId,
  onTaskComplete,
  projects,
  users,
  loadingUsers,
  onSubmit
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<Date | undefined>(undefined);
  const [timeInput, setTimeInput] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium' as TaskPriority,
      projectId: currentProjectId || 'none',
      cost: ''
    }
  });

  // Initialize form data when editing
  useEffect(() => {
    if (editingTask && open) {
      form.setValue('title', editingTask.title);
      form.setValue('description', editingTask.description);
      form.setValue('priority', editingTask.priority);
      form.setValue('projectId', editingTask.projectId || 'none');
      form.setValue('cost', editingTask.cost?.toString() || '');
      
      setDeadlineDate(new Date(editingTask.deadline));
      setTimeInput(format(new Date(editingTask.deadline), 'HH:mm'));
      
      // Set assigned users
      if (editingTask.assignedToIds && editingTask.assignedToIds.length > 0) {
        const assignedUsers = users.filter(user => 
          editingTask.assignedToIds?.includes(user.id)
        );
        setSelectedUsers(assignedUsers);
      }
    } else if (!editingTask && open) {
      // Reset form for new task
      form.reset();
      setSelectedUsers([]);
      setDeadlineDate(undefined);
      setTimeInput('09:00');
      setUserSearchQuery('');
    }
  }, [editingTask, open, users, form, currentProjectId]);

  const handleSubmit = async (data: any) => {
    if (!deadlineDate) {
      toast.error('Please select a deadline');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const [hours, minutes] = timeInput.split(':');
      const finalDeadline = new Date(deadlineDate);
      finalDeadline.setHours(parseInt(hours), parseInt(minutes));

      const taskData = {
        ...data,
        deadline: finalDeadline,
        cost: data.cost ? parseFloat(data.cost) : 0,
        projectId: data.projectId === 'none' ? undefined : data.projectId
      };

      await onSubmit(taskData, selectedUsers);
      onTaskComplete?.();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setUserSearchQuery('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const filteredUsers = users.filter(user => 
    !selectedUsers.find(u => u.id === user.id) &&
    (user.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
     user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const quickDatePresets = [
    { label: 'Today', date: new Date() },
    { label: 'Tomorrow', date: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { label: 'Next Week', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-muted/5 to-background">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            {editingTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Task Details Card */}
          <Card className="border-2 border-primary/10 shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Briefcase className="h-5 w-5" />
                Task Details
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a clear, descriptive task title..."
                  className="text-base h-12 border-2 focus:border-primary"
                  {...form.register('title', { required: "Title is required" })}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about the task..."
                  className="min-h-[120px] border-2 focus:border-primary resize-none"
                  {...form.register('description')}
                />
              </div>

              {/* Priority and Project Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Priority</Label>
                  <Select 
                    defaultValue="Medium"
                    onValueChange={(value) => form.setValue('priority', value as TaskPriority)}
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          High Priority
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Project</Label>
                  <Select 
                    defaultValue={currentProjectId || "none"}
                    onValueChange={(value) => form.setValue('projectId', value)}
                    disabled={!!currentProjectId}
                  >
                    <SelectTrigger className="h-12 border-2 focus:border-primary">
                      <SelectValue />
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
              </div>

              {/* Deadline and Cost Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Deadline <span className="text-red-500">*</span>
                  </Label>
                  <div className="space-y-3">
                    {/* Quick Presets */}
                    <div className="flex gap-2">
                      {quickDatePresets.map((preset) => (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeadlineDate(preset.date)}
                          className="text-xs"
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Date and Time Picker */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left h-12 border-2 focus:border-primary"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {deadlineDate ? format(deadlineDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-background border-2" align="start">
                            <Calendar
                              mode="single"
                              selected={deadlineDate}
                              onSelect={setDeadlineDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <TimeSelector
                          value={timeInput}
                          onChange={setTimeInput}
                          placeholder="Select time"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost" className="text-base font-medium">Cost (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10 h-12 border-2 focus:border-primary"
                      {...form.register('cost')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Assignment Card */}
          <Card className="border-2 border-emerald-500/10 shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold text-emerald-600">
                  <Users className="h-5 w-5" />
                  Team Assignment
                </div>
                <Badge variant="secondary" className="text-xs">
                  {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} assigned
                </Badge>
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assigned Team Members</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {user.name || user.email}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUser(user.id)}
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Team Members */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Add Team Members</Label>
                <Input
                  placeholder="Search team members..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="border-2 focus:border-emerald-500"
                />
                
                {userSearchQuery && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg bg-background">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.slice(0, 5).map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => addUser(user)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name?.charAt(0) || user.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left">
                            <div className="font-medium">{user.name || user.email}</div>
                            {user.name && (
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted-foreground">
                        No team members found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 bg-gradient-to-r from-primary to-emerald-500 hover:shadow-lg transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  {editingTask ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingTask ? 'Update Task' : 'Create Task'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateTaskDialog;
