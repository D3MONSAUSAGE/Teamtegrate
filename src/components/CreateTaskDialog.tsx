
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDetailsSection } from '@/components/task/form/TaskDetailsSection';
import { TaskAssignmentSection } from '@/components/task/form/TaskAssignmentSection';
import { useTaskFormWithTime } from '@/hooks/useTaskFormWithTime';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask?: Task;
  currentProjectId?: string;
  onTaskComplete?: () => void;
}

const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({ 
  open, 
  onOpenChange, 
  editingTask,
  currentProjectId,
  onTaskComplete
}) => {
  const isEditMode = !!editingTask;
  const isMobile = useIsMobile();
  
  const {
    register,
    errors,
    selectedMember,
    setSelectedMember,
    selectedDate,
    selectedTime,
    handleDateChange,
    handleTimeChange,
    handleFormSubmit,
    setValue
  } = useTaskFormWithTime(editingTask, currentProjectId, onTaskComplete);

  const handleCancel = () => {
    onOpenChange(false);
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
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Task Details</TabsTrigger>
              <TabsTrigger value="assignment">Assignment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <TaskDetailsSection 
                register={register}
                errors={errors}
                editingTask={editingTask}
                currentProjectId={currentProjectId}
                setValue={setValue}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={handleDateChange}
                onTimeChange={handleTimeChange}
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

export default CreateTaskDialog;
