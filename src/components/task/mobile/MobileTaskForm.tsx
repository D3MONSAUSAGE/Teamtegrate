
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, Calendar, Clock, DollarSign, Flag } from 'lucide-react';
import { Project, User, Task } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import MobileTaskBasics from './MobileTaskBasics';
import MobileTaskDeadline from './MobileTaskDeadline';
import MobileTaskAssignment from './MobileTaskAssignment';
import MobileTaskSchedule from './MobileTaskSchedule';
import MobileTaskDetails from './MobileTaskDetails';

interface MobileTaskFormProps {
  form: UseFormReturn<any>;
  projects: Project[];
  users: User[];
  loadingUsers: boolean;
  selectedMember: string | undefined;
  selectedMembers: string[];
  deadlineDate: Date | undefined;
  timeInput: string;
  scheduledStartDate: Date | undefined;
  scheduledEndDate: Date | undefined;
  scheduledStartTime: string;
  scheduledEndTime: string;
  onAssign: (userId: string) => void;
  onMembersChange: (memberIds: string[]) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onScheduledStartDateChange: (date: Date | undefined) => void;
  onScheduledEndDateChange: (date: Date | undefined) => void;
  onScheduledStartTimeChange: (time: string) => void;
  onScheduledEndTimeChange: (time: string) => void;
  editingTask?: Task;
}

const MobileTaskForm: React.FC<MobileTaskFormProps> = ({
  form,
  projects,
  users,
  loadingUsers,
  selectedMember,
  selectedMembers,
  deadlineDate,
  timeInput,
  scheduledStartDate,
  scheduledEndDate,
  scheduledStartTime,
  scheduledEndTime,
  onAssign,
  onMembersChange,
  onDateChange,
  onTimeChange,
  onScheduledStartDateChange,
  onScheduledEndDateChange,
  onScheduledStartTimeChange,
  onScheduledEndTimeChange,
  editingTask
}) => {
  return (
    <div className="p-4 space-y-4">
      {/* Task Basics */}
      <Card className="shadow-sm border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-4 w-4 text-primary" />
            <h3 className="font-medium text-foreground">Task Information</h3>
          </div>
          <MobileTaskBasics form={form} />
        </CardContent>
      </Card>

      {/* Deadline */}
      <Card className="shadow-sm border-l-4 border-l-red-400">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-red-500" />
            <h3 className="font-medium text-foreground">Deadline</h3>
            <span className="text-xs text-red-500 font-medium">Required</span>
          </div>
          <MobileTaskDeadline
            deadlineDate={deadlineDate}
            timeInput={timeInput}
            onDateChange={onDateChange}
            onTimeChange={onTimeChange}
          />
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card className="shadow-sm border-l-4 border-l-blue-400">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-blue-500" />
            <h3 className="font-medium text-foreground">Assignment</h3>
          </div>
          <MobileTaskAssignment
            selectedMember={selectedMember}
            selectedMembers={selectedMembers}
            users={users}
            loadingUsers={loadingUsers}
            onAssign={onAssign}
            onMembersChange={onMembersChange}
            editingTask={editingTask}
          />
        </CardContent>
      </Card>

      {/* Schedule (Optional) */}
      <Card className="shadow-sm border-l-4 border-l-green-400">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-green-500" />
            <h3 className="font-medium text-foreground">Schedule</h3>
            <span className="text-xs text-muted-foreground">Optional</span>
          </div>
          <MobileTaskSchedule
            scheduledStartDate={scheduledStartDate}
            scheduledEndDate={scheduledEndDate}
            scheduledStartTime={scheduledStartTime}
            scheduledEndTime={scheduledEndTime}
            onScheduledStartDateChange={onScheduledStartDateChange}
            onScheduledEndDateChange={onScheduledEndDateChange}
            onScheduledStartTimeChange={onScheduledStartTimeChange}
            onScheduledEndTimeChange={onScheduledEndTimeChange}
          />
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card className="shadow-sm border-l-4 border-l-amber-400">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="h-4 w-4 text-amber-500" />
            <h3 className="font-medium text-foreground">Details</h3>
          </div>
          <MobileTaskDetails form={form} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileTaskForm;
