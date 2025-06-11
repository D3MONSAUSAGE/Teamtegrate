
import React from 'react';
import { Project, Task, User } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskFormFieldsWithAI from '../TaskFormFieldsWithAI';
import TaskAssignmentSection from './TaskAssignmentSection';

export interface TaskFormTabsProps {
  register: any;
  errors: any;
  setValue: any;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  selectedMember?: string;
  setSelectedMember: (id: string | undefined) => void;
  deadlineDate: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  multiAssignMode: boolean;
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: User[];
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
      <TabsList className="mb-4">
        <TabsTrigger value="details">Task Details</TabsTrigger>
        <TabsTrigger value="assignment">Assignment</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="space-y-4">
        <TaskFormFieldsWithAI
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
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
        />
      </TabsContent>
      
      <TabsContent value="assignment">
        <TaskAssignmentSection 
          selectedUser={selectedMember || "unassigned"}
          onAssign={handleUserAssignment}
          users={users}
          isLoading={loadingUsers}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskFormTabs;
