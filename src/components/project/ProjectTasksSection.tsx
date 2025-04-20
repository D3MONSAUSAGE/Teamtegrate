
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash, Plus, ListTodo } from 'lucide-react';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { FormValues } from './ProjectFormTypes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskPriority } from '@/types';

interface ProjectTasksSectionProps {
  taskFields: { id: string }[];
  register: UseFormRegister<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
  fieldArrayProps: {
    append: (value: { title: string; description: string; priority: TaskPriority; deadline: string }) => void;
    remove: (index: number) => void;
  };
}

const ProjectTasksSection: React.FC<ProjectTasksSectionProps> = ({
  taskFields,
  register,
  setValue,
  fieldArrayProps,
}) => {
  const handleAddTask = () => {
    fieldArrayProps.append({
      title: '',
      description: '',
      priority: 'Medium',
      deadline: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Label className="text-base font-medium">Project Tasks</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleAddTask}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Task
        </Button>
      </div>

      {taskFields.length === 0 ? (
        <div className="flex items-center justify-center h-24 bg-muted/30 rounded-md border border-dashed border-muted-foreground/20">
          <div className="flex flex-col items-center text-muted-foreground">
            <ListTodo className="h-8 w-8 mb-2" />
            <p className="text-sm">No tasks added yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {taskFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md bg-card">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Task {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fieldArrayProps.remove(index)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={`tasks.${index}.title`}>Title</Label>
                  <Input
                    id={`tasks.${index}.title`}
                    placeholder="Task title"
                    {...register(`tasks.${index}.title` as const, { required: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`tasks.${index}.description`}>Description</Label>
                  <Textarea
                    id={`tasks.${index}.description`}
                    placeholder="Task description"
                    {...register(`tasks.${index}.description` as const)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`tasks.${index}.priority`}>Priority</Label>
                    <Select
                      onValueChange={(value) => {
                        setValue(`tasks.${index}.priority` as any, value as TaskPriority);
                      }}
                      defaultValue="Medium"
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
                    <Label htmlFor={`tasks.${index}.deadline`}>Deadline</Label>
                    <Input
                      id={`tasks.${index}.deadline`}
                      type="date"
                      {...register(`tasks.${index}.deadline` as const, { required: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectTasksSection;
