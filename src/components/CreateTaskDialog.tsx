
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useTask } from '@/contexts/task';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskAssignmentSection } from '@/components/task/form/TaskAssignmentSection';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import TaskDeadlineWithTime from '@/components/task/form/TaskDeadlineWithTime';
import { useTaskFormWithTime } from '@/hooks/useTaskFormWithTime';

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
  
  const {
    register,
    handleSubmit,
    errors,
    reset,
    setValue,
    selectedMember,
    setSelectedMember,
    watch,
    timeInput,
    setTimeInput,
    prepareDateWithTime
  } = useTaskFormWithTime(editingTask, currentProjectId);

  const onSubmit = (data: any) => {
    // Get deadline with time component
    const deadlineDate = prepareDateWithTime(data.deadline);

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
  };

  const handleCancel = () => {
    onOpenChange(false);
    reset();
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
              <TaskDetailsTab 
                register={register} 
                errors={errors} 
                projects={projects}
                currentProjectId={currentProjectId}
                editingTask={editingTask}
                timeInput={timeInput}
                setTimeInput={setTimeInput}
                watch={watch}
              />
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

interface TaskDetailsTabProps {
  register: any;
  errors: any;
  projects: any[];
  currentProjectId?: string;
  editingTask?: Task;
  timeInput: string;
  setTimeInput: (time: string) => void;
  watch: any;
}

const TaskDetailsTab: React.FC<TaskDetailsTabProps> = ({
  register,
  errors,
  projects,
  currentProjectId,
  editingTask,
  timeInput,
  setTimeInput,
  watch
}) => {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeInput(e.target.value);
  };

  return (
    <>
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

        <TaskDeadlineWithTime 
          register={register}
          timeInput={timeInput}
          onTimeChange={handleTimeChange}
          watch={watch}
        />
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
    </>
  );
};

export default CreateTaskDialog;
