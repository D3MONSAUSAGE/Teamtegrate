
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Task } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskDetailsSection } from '@/components/task/form/TaskDetailsSection';
import TaskAssignmentSection from '@/components/task/form/TaskAssignmentSection';
import { useTaskFormWithTime } from '@/hooks/useTaskFormWithTime';
import { useUsers } from '@/hooks/useUsers';

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
  const { users, isLoading: loadingUsers } = useUsers();
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);
  
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

  // Initialize selected members when editing
  React.useEffect(() => {
    if (editingTask && editingTask.assignedToIds) {
      setSelectedMembers(editingTask.assignedToIds);
    } else if (editingTask && editingTask.assignedToId) {
      setSelectedMembers([editingTask.assignedToId]);
    } else {
      setSelectedMembers([]);
    }
  }, [editingTask]);

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedMembers([]);
  };

  const handleUserAssignment = (userId: string) => {
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
    const selectedUserNames = memberIds
      .map(id => users.find(user => user.id === id))
      .filter(Boolean)
      .map(user => user!.name || user!.email);
    
    setValue('assignedToIds', memberIds);
    setValue('assignedToNames', selectedUserNames);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isMobile ? 'w-[95%] p-4' : 'sm:max-w-[600px]'} max-h-[90vh] overflow-y-auto`}
      >
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
            
            <TabsContent value="assignment" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Single Assignment</h3>
                  <TaskAssignmentSection 
                    selectedMember={selectedMember || "unassigned"}
                    onAssign={handleUserAssignment}
                    users={users}
                    isLoading={loadingUsers}
                  />
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Multiple Assignment</h3>
                  <TaskAssignmentSection 
                    selectedMembers={selectedMembers}
                    onMembersChange={handleMembersChange}
                    users={users}
                    isLoading={loadingUsers}
                    multiSelect={true}
                    selectedMember=""
                    onAssign={() => {}}
                  />
                </div>
              </div>
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
