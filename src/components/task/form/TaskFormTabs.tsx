import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Task, Project } from '@/types';
import { TaskDetailsWithAISection } from './TaskDetailsWithAISection';
import EnhancedTaskAssignmentSection from './EnhancedTaskAssignmentSection';

interface TaskFormTabsProps {
  register: any;
  errors: any;
  setValue: any;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  selectedMember?: string;
  setSelectedMember: (member: string | undefined) => void;
  deadlineDate?: Date;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  multiAssignMode: boolean;
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: any[];
  loadingUsers: boolean;
  handleUserAssignment: (userId: string) => void;
}

const TaskFormTabs: React.FC<TaskFormTabsProps> = ({
  register,
  errors,
  setValue,
  projects,
  editingTask,
  currentProjectId,
  selectedMember,
  setSelectedMember,
  deadlineDate,
  timeInput,
  onDateChange,
  onTimeChange,
  multiAssignMode,
  selectedMembers,
  onMembersChange,
  users,
  loadingUsers,
  handleUserAssignment
}) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Task Details
        </TabsTrigger>
        <TabsTrigger value="assignment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
          Assignment
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4 mt-0">
        <TaskDetailsWithAISection
          register={register}
          errors={errors}
          setValue={setValue}
          projects={projects}
          editingTask={editingTask}
          currentProjectId={currentProjectId}
          date={deadlineDate}
          timeInput={timeInput}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
        />
      </TabsContent>
      
      <TabsContent value="assignment" className="mt-0">
        <EnhancedTaskAssignmentSection 
          selectedMember={selectedMember || "unassigned"}
          onAssign={handleUserAssignment}
          users={users}
          isLoading={loadingUsers}
          multiAssignMode={multiAssignMode}
          selectedMembers={selectedMembers}
          onMembersChange={onMembersChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskFormTabs;
