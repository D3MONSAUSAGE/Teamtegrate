import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTaskForm } from '@/hooks/useTaskForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDetailsSection } from '@/components/task/form/TaskDetailsSection';
import { TaskAssignmentSection } from '@/components/task/form/TaskAssignmentSection';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from 'date-fns';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId 
}) => {
  const { user } = useAuth();
  const { addTask, updateTask, projects } = useTask();
  const isEditMode = !!editingTask;
  const isMobile = useIsMobile();
  
  // Add time state
  const [timeInput, setTimeInput] = useState('12:00');
  
  // Make sure to destructure properly and provide default value
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    watch = () => '' // Provide a default function in case watch is undefined
  } = useTaskForm(editingTask, currentProjectId);

  // Set initial time if editing a task with a deadline
  useEffect(() => {
    if (editingTask?.deadline) {
      const date = new Date(editingTask.deadline);
      setTimeInput(format(date, 'HH:mm'));
    }
  }, [editingTask]);

  const onSubmit = (data: any) => {
    // Parse the date and set the time
    let deadlineDate: Date | undefined;
    
    if (data.deadline) {
      // Create a deadline with the time component
      deadlineDate = new Date(data.deadline);
      
      if (timeInput) {
        const [hours, minutes] = timeInput.split(':').map(Number);
        deadlineDate.setHours(hours, minutes);
      }
      
      console.log('Setting deadline with time:', deadlineDate);
    }

    if (isEditMode && editingTask) {
      updateTask(editingTask.id, {
        ...data,
        deadline: deadlineDate,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName
      });
    } else {
      addTask({
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: deadlineDate,
        status: 'To Do',
        userId: user?.id || '',
        projectId: data.projectId === "none" ? undefined : data.projectId,
        assignedToId: selectedMember === "unassigned" ? undefined : selectedMember,
        assignedToName: data.assignedToName,
        cost: data.cost || 0
      });
    }
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
    setTimeInput('12:00');
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
    setSelectedMember(undefined);
    setTimeInput('12:00');
  };

  // Custom deadline component that includes time
  const DeadlineWithTime = () => {
    // Use a string instead of directly using watch to avoid function call issues
    const deadlineValue = typeof watch === 'function' ? watch('deadline') : '';
    
    return (
      <div className="space-y-1">
        <Label htmlFor="deadline">Deadline</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id="deadline"
            type="date"
            {...register("deadline")}
          />
          <Input
            id="deadlineTime"
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95%] p-4' : 'sm:max-w-[550px]'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditMode ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Task title"
                  {...register("title", { required: "Title is required" })}
                  className="w-full"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="w-full min-h-[100px] rounded-md border border-input p-2"
                  placeholder="Task description"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="priority">Priority</Label>
                  <select 
                    id="priority" 
                    className="w-full h-9 rounded-md border border-input px-3"
                    defaultValue={editingTask?.priority || "Medium"}
                    {...register("priority")}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <DeadlineWithTime />
              </div>

              <div className="space-y-1">
                <Label htmlFor="projectId">Project</Label>
                <select 
                  id="projectId"
                  className="w-full h-9 rounded-md border border-input px-3"
                  defaultValue={currentProjectId || editingTask?.projectId || "none"}
                  disabled={!!currentProjectId}
                  {...register("projectId")}
                >
                  <option value="none">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="Enter cost (optional)"
                  {...register('cost')}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="assignment">
              <TaskAssignmentSection 
                register={register}
                selectedMember={selectedMember}
                setSelectedMember={setSelectedMember}
                setValue={setValue}
              />
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              {isEditMode ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
