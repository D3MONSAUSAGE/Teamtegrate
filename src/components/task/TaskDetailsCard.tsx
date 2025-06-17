
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase } from 'lucide-react';
import { Project } from '@/types';
import { UseFormReturn } from 'react-hook-form';
import TaskTitleField from './form/TaskTitleField';
import TaskDescriptionField from './form/TaskDescriptionField';
import TaskPrioritySelect from './form/TaskPrioritySelect';
import TaskProjectSelect from './form/TaskProjectSelect';
import TaskDeadlineSection from './form/TaskDeadlineSection';
import TaskCostField from './form/TaskCostField';

interface TaskDetailsCardProps {
  form: UseFormReturn<any>;
  deadlineDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  timeInput: string;
  onTimeChange: (time: string) => void;
  projects: Project[];
  currentProjectId?: string;
}

const TaskDetailsCard: React.FC<TaskDetailsCardProps> = ({
  form,
  deadlineDate,
  onDateChange,
  timeInput,
  onTimeChange,
  projects,
  currentProjectId
}) => {
  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Briefcase className="h-5 w-5" />
          Task Details
        </div>

        <TaskTitleField form={form} />
        
        <TaskDescriptionField form={form} />

        {/* Priority and Project Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaskPrioritySelect form={form} />
          <TaskProjectSelect 
            form={form} 
            projects={projects} 
            currentProjectId={currentProjectId} 
          />
        </div>

        <TaskDeadlineSection
          deadlineDate={deadlineDate}
          onDateChange={onDateChange}
          timeInput={timeInput}
          onTimeChange={onTimeChange}
        />

        <TaskCostField form={form} />
      </CardContent>
    </Card>
  );
};

export default TaskDetailsCard;
