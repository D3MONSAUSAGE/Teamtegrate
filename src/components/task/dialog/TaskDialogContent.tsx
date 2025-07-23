
import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task, User, Project } from '@/types';
import TaskFormTabs from '../form/TaskFormTabs';
import UnifiedTaskAssignment from '../assignment/UnifiedTaskAssignment';

interface TaskDialogContentProps {
  editingTask?: Task;
  currentProjectId?: string;
  projects: Project[];
  users: User[];
  loadingUsers: boolean;
  selectedUsers: User[];
  onSelectionChange: (users: User[]) => void;
  deadlineDate?: Date;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  isSubmitting: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  form: any;
}

const TaskDialogContent: React.FC<TaskDialogContentProps> = ({
  editingTask,
  currentProjectId,
  projects,
  users,
  loadingUsers,
  selectedUsers,
  onSelectionChange,
  deadlineDate,
  timeInput,
  onDateChange,
  onTimeChange,
  isSubmitting,
  onSubmit,
  onCancel,
  form
}) => {
  return (
    <DialogContent className="w-full max-w-sm sm:max-w-md lg:max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto scrollbar-hide">
      <DialogHeader>
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 lg:space-y-6">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 lg:mb-6">
            <TabsTrigger value="details" className="mobile-touch-target">Task Details</TabsTrigger>
            <TabsTrigger value="assignment" className="mobile-touch-target">Assignment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 mt-0">
            <TaskFormTabs
              register={form.register}
              errors={form.formState.errors}
              setValue={form.setValue}
              projects={projects}
              editingTask={editingTask}
              currentProjectId={currentProjectId}
              selectedMember={undefined}
              setSelectedMember={() => {}}
              deadlineDate={deadlineDate}
              timeInput={timeInput}
              onDateChange={onDateChange}
              onTimeChange={onTimeChange}
              multiAssignMode={false}
              selectedMembers={[]}
              onMembersChange={() => {}}
              users={[]}
              loadingUsers={false}
              handleUserAssignment={() => {}}
            />
          </TabsContent>
          
          <TabsContent value="assignment" className="mt-0">
            <UnifiedTaskAssignment
              selectedUsers={selectedUsers}
              onSelectionChange={onSelectionChange}
              availableUsers={users}
              isLoading={loadingUsers}
              disabled={isSubmitting}
            />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="mobile-touch-target"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mobile-touch-target"
          >
            {isSubmitting 
              ? (editingTask ? 'Updating...' : 'Creating...') 
              : (editingTask ? 'Update Task' : 'Create Task')
            }
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export default TaskDialogContent;
