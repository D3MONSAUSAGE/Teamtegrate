
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
import { FormField, FormLabel, FormMessage } from "@/components/ui/form";
import TaskAssigneeSelect from './form/TaskAssigneeSelect';
import TaskDeadlinePicker from './form/TaskDeadlinePicker';
import AITaskGenerator from './AITaskGenerator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface TaskFormFieldsProps {
  register: any;
  errors: any;
  setValue: any;
  selectedMember: string | undefined;
  setSelectedMember: (id: string | undefined) => void;
  projects: Project[];
  editingTask?: Task;
  currentProjectId?: string;
}

const TaskFormFieldsWithAI: React.FC<TaskFormFieldsProps> = ({
  register,
  errors,
  setValue,
  selectedMember,
  setSelectedMember,
  projects,
  editingTask,
  currentProjectId
}) => {
  const [useAI, setUseAI] = React.useState(false);

  const handleGeneratedTitle = (title: string) => {
    setValue('title', title);
  };

  const handleGeneratedDescription = (description: string) => {
    setValue('description', description);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <FormLabel>Task Title</FormLabel>
          <div className="flex items-center space-x-2">
            <Switch
              id="use-ai"
              checked={useAI}
              onCheckedChange={setUseAI}
              size="sm"
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
          <FormMessage>{errors.title.message}</FormMessage>
        )}
        
        {useAI && (
          <AITaskGenerator 
            onGeneratedContent={handleGeneratedTitle}
            type="title"
          />
        )}
      </div>

      <div className="space-y-2">
        <FormLabel>Description</FormLabel>
        <Textarea
          id="description"
          placeholder="Enter task description"
          className="resize-none h-24"
          {...register('description')}
        />
        
        {useAI && (
          <AITaskGenerator 
            onGeneratedContent={handleGeneratedDescription}
            type="description"
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel>Priority</FormLabel>
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
        
        <TaskDeadlinePicker register={register} setValue={setValue} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <FormLabel>Project</FormLabel>
          <Select 
            defaultValue={currentProjectId || editingTask?.projectId || "none"} 
            onValueChange={(value) => setValue('projectId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
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
          setSelectedMember={setSelectedMember}
          setValue={setValue}
        />
      </div>

      <div className="space-y-2">
        <FormLabel>Cost</FormLabel>
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
