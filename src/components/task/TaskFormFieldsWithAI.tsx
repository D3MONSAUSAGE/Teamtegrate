
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Project, Task } from '@/types';
import { Label } from "@/components/ui/label";
import TaskAssigneeSelect from './form/TaskAssigneeSelect';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import AITaskGenerator from './AITaskGenerator';
import { Switch } from '@/components/ui/switch';
import { useUsers } from '@/hooks/useUsers';

interface TaskFormFieldsProps {
  register: any;
  errors: any;
  setValue: any;
  selectedMember: string | undefined;
  setSelectedMember: (id: string | undefined) => void;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
  date: Date | undefined;
  timeInput: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TaskFormFieldsWithAI: React.FC<TaskFormFieldsProps> = ({
  register,
  errors,
  setValue,
  selectedMember,
  setSelectedMember,
  projects,
  editingTask,
  currentProjectId,
  date,
  timeInput,
  onDateChange,
  onTimeChange
}) => {
  const [useAI, setUseAI] = React.useState(false);
  const { users, isLoading: loadingUsers } = useUsers();

  const handleGeneratedTitle = (title: string) => {
    setValue('title', title);
  };

  const handleGeneratedDescription = (description: string) => {
    setValue('description', description);
  };

  const handleUserAssignment = (userId: string) => {
    const selectedUser = users.find(user => user.id === userId);
    if (selectedUser) {
      setSelectedMember(userId);
      setValue('assignedToId', userId);
      setValue('assignedToName', selectedUser.name);
    } else if (userId === "unassigned") {
      setSelectedMember(undefined);
      setValue('assignedToId', undefined);
      setValue('assignedToName', undefined);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="title">Task Title</Label>
          <div className="flex items-center space-x-2">
            <Switch
              id="use-ai"
              checked={useAI}
              onCheckedChange={setUseAI}
              className="h-4 w-8" 
            />
            <Label htmlFor="use-ai" className="text-xs">Use AI</Label>
          </div>
        </div>
        <Input
          id="title"
          placeholder="Enter task title"
          {...register('title', { 
            required: "Title is required" 
          })}
        />
        {errors.title && (
          <p className="text-sm font-medium text-destructive">{errors.title.message}</p>
        )}
        
        {useAI && (
          <AITaskGenerator 
            onGeneratedContent={handleGeneratedTitle}
            type="title"
          />
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          className="resize-none h-20"
          {...register('description')}
        />
        
        {useAI && (
          <AITaskGenerator 
            onGeneratedContent={handleGeneratedDescription}
            type="description"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="priority">Priority</Label>
          <Select 
            defaultValue={editingTask?.priority || "Medium"} 
            onValueChange={(value) => setValue('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <TaskDeadlinePicker 
          date={date}
          timeInput={timeInput}
          onDateChange={onDateChange}
          onTimeChange={onTimeChange}
          error={errors.deadline?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="project">Project</Label>
          <Select 
            defaultValue={currentProjectId || editingTask?.projectId || "none"} 
            onValueChange={(value) => setValue('projectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[200px]">
              <SelectItem value="none">No Project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <TaskAssigneeSelect 
          selectedMember={selectedMember}
          onAssign={handleUserAssignment}
          users={users} 
          isLoading={loadingUsers}
        />
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

export default TaskFormFieldsWithAI;
