
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from 'lucide-react';
import { UseFieldArrayReturn } from 'react-hook-form';
import { TaskPriority } from '@/types';

interface ProjectTasksSectionProps {
  taskFields: any[];
  register: any;
  setValue: (name: string, value: any) => void;
  watch: any;
  fieldArrayProps: Pick<UseFieldArrayReturn, 'append' | 'remove'>;
}

const ProjectTasksSection: React.FC<ProjectTasksSectionProps> = ({
  taskFields,
  register,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Initial Tasks</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => append({ 
            title: '', 
            description: '', 
            priority: 'Medium' as TaskPriority,
            deadline: '' 
          })}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>
      
      {taskFields.map((field, index) => (
        <div key={field.id} className="space-y-4 p-4 border rounded-md relative">
          <Button 
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => remove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="space-y-2">
            <Label>Task Title</Label>
            <Input
              {...register(`tasks.${index}.title`)}
              placeholder="Task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register(`tasks.${index}.description`)}
              placeholder="Task description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value: TaskPriority) => setValue(`tasks.${index}.priority`, value)}
                value={watch(`tasks.${index}.priority`)}
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
            
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                {...register(`tasks.${index}.deadline`)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectTasksSection;
