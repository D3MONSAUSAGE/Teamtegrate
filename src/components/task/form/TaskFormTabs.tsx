
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Users, User } from "lucide-react";
import { Project, Task } from '@/types';
import { AppUser } from '@/types';
import TaskFormFieldsEnhanced from '../TaskFormFieldsEnhanced';
import TaskAssignmentSectionEnhanced from './TaskAssignmentSectionEnhanced';

interface TaskFormTabsProps {
  register: any;
  errors: any;
  setValue: any;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  selectedMember: string | undefined;
  setSelectedMember: (id: string | undefined) => void;
  deadlineDate: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
  multiAssignMode: boolean;
  selectedMembers: string[];
  onMembersChange: (memberIds: string[]) => void;
  users: AppUser[];
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
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
        />
      </TabsContent>
      
      <TabsContent value="assignment" className="mt-6">
        <TaskAssignmentSectionEnhanced
          selectedMember={selectedMember || "unassigned"}
          selectedMembers={selectedMembers}
          onAssign={handleUserAssignment}
          onMembersChange={onMembersChange}
          users={users}
          isLoading={loadingUsers}
          multiSelect={multiAssignMode}
        />
      </TabsContent>
    </Tabs>
  );
};

export default TaskFormTabs;
