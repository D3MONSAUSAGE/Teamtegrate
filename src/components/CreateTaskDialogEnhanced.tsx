
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Form } from "@/components/ui/form";
import { useTaskFormWithAI } from '@/hooks/useTaskFormWithAI';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUsers } from '@/hooks/useUsers';
import { CheckCircle, Clock, Users, User, Sparkles, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import TaskFormFieldsEnhanced from './task/TaskFormFieldsEnhanced';
import TaskAssignmentSectionEnhanced from './task/form/TaskAssignmentSectionEnhanced';

interface CreateTaskDialogEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
}

const CreateTaskDialogEnhanced: React.FC<CreateTaskDialogEnhancedProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId,
  onTaskComplete
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  const isMobile = useIsMobile();
  const { users, isLoading: loadingUsers } = useUsers();
  const [multiAssignMode, setMultiAssignMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // Use our custom hook for form management
  const {
    form,
    handleSubmit,
    register,
    errors, 
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    deadlineDate,
    timeInput,
    handleDateChange,
    handleTimeChange
  } = useTaskFormWithAI(editingTask, currentProjectId);

  // Initialize multi-assign mode and selected members for editing
  React.useEffect(() => {
    if (editingTask && editingTask.assignedToIds && editingTask.assignedToIds.length > 1) {
      setMultiAssignMode(true);
      setSelectedMembers(editingTask.assignedToIds);
    }
  }, [editingTask]);

  const handleUserAssignment = (userId: string) => {
    console.log('Assigning user:', userId);
    
    if (userId === "unassigned") {
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
      return;
    }
    
    const selectedUser = users.find(user => user.id === userId);
    
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name || selectedUser.email);
    }
  };

  const handleMembersChange = (memberIds: string[]) => {
    setSelectedMembers(memberIds);
    
    // Update form values for multi-assignment
    const selectedUsers = users.filter(user => memberIds.includes(user.id));
    setValue('assignedToIds', memberIds);
    setValue('assignedToNames', selectedUsers.map(user => user.name || user.email));
  };

  const onSubmit = (data: any) => {
    console.log('Form submission data:', data);
    
    const deadlineDate = typeof data.deadline === 'string' 
      ? new Date(data.deadline)
      : data.deadline;

    const taskData = {
      ...data,
      deadline: deadlineDate,
      // Handle single vs multi assignment
      assignedToId: multiAssignMode ? undefined : (selectedMember === "unassigned" ? undefined : selectedMember),
      assignedToName: multiAssignMode ? undefined : data.assignedToName,
      assignedToIds: multiAssignMode ? selectedMembers : undefined,
      assignedToNames: multiAssignMode ? users.filter(u => selectedMembers.includes(u.id)).map(u => u.name || u.email) : undefined
    };

    if (isEditMode && editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: deadlineDate,
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId,
        ...taskData
      });
    }
    
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
    setSelectedMembers([]);
    
    if (onTaskComplete) {
      onTaskComplete();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
    setSelectedMembers([]);
  };

  const getCompletionPercentage = () => {
    const requiredFields = ['title'];
    const optionalFields = ['description', 'priority', 'deadline'];
    
    let completed = 0;
    let total = requiredFields.length + optionalFields.length;
    
    // Check required fields
    if (form.watch('title')?.trim()) completed++;
    
    // Check optional fields
    if (form.watch('description')?.trim()) completed++;
    if (form.watch('priority')) completed++;
    if (deadlineDate) completed++;
    
    return Math.round((completed / total) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "glass-card backdrop-blur-xl border-2 border-border/30 shadow-2xl",
        "bg-gradient-to-br from-background/95 via-background/90 to-background/85",
        isMobile ? 'w-[95%] p-4 max-h-[90vh]' : 'sm:max-w-[600px] max-h-[85vh]',
        "overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300"
      )}>
        <DialogHeader className="space-y-4 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                {isEditMode ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {isEditMode ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200">
              {getCompletionPercentage()}% Complete
            </Badge>
          </div>
          
          {/* Multi-Assignment Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                {multiAssignMode ? <Users className="h-4 w-4 text-blue-600" /> : <User className="h-4 w-4 text-blue-600" />}
              </div>
              <div>
                <Label htmlFor="multi-assign" className="font-medium">
                  Collaborative Task
                </Label>
                <p className="text-xs text-muted-foreground">
                  {multiAssignMode ? 'Assign to multiple team members' : 'Assign to a single team member'}
                </p>
              </div>
            </div>
            <Switch
              id="multi-assign"
              checked={multiAssignMode}
              onCheckedChange={setMultiAssignMode}
            />
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl">
                <TabsTrigger 
                  value="details" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Task Details</span>
                  <span className="sm:hidden">Details</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="assignment"
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all duration-200"
                >
                  {multiAssignMode ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  <span className="hidden sm:inline">Assignment</span>
                  <span className="sm:hidden">Assign</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6 mt-6">
                <TaskFormFieldsEnhanced
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  projects={projects}
                  editingTask={editingTask}
                  currentProjectId={currentProjectId}
                  selectedMember={selectedMember}
                  setSelectedMember={setSelectedMember}
                  date={deadlineDate}
                  timeInput={timeInput}
                  onDateChange={handleDateChange}
                  onTimeChange={handleTimeChange}
                />
              </TabsContent>
              
              <TabsContent value="assignment" className="mt-6">
                <TaskAssignmentSectionEnhanced
                  selectedMember={selectedMember || "unassigned"}
                  selectedMembers={selectedMembers}
                  onAssign={handleUserAssignment}
                  onMembersChange={handleMembersChange}
                  users={users}
                  isLoading={loadingUsers}
                  multiSelect={multiAssignMode}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-3 pt-6 border-t border-border/30">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="hover:bg-muted/50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialogEnhanced;
