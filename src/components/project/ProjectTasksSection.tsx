
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from 'lucide-react';
import { TaskPriority } from '@/types';
import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldArrayWithId, Path, PathValue } from 'react-hook-form';
import { FormValues } from '../CreateProjectDialog';

interface ProjectTasksSectionProps<TFormValues extends FormValues> {
  taskFields: FieldArrayWithId[];
  register: UseFormRegister<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  watch: UseFormWatch<TFormValues>;
  fieldArrayProps: {
    append: (value: { title: string; description: string; priority: TaskPriority; deadline: string }) => void;
    remove: (index: number) => void;
  };
}

function ProjectTasksSection<TFormValues extends FormValues>({
  taskFields,
  register,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}: ProjectTasksSectionProps<TFormValues>) {
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
              {...register(`tasks.${index}.title` as Path<TFormValues>)}
              placeholder="Task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              {...register(`tasks.${index}.description` as Path<TFormValues>)}
              placeholder="Task description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                onValueChange={(value: TaskPriority) => {
                  setValue(`tasks.${index}.priority` as Path<TFormValues>, value as PathValue<TFormValues, Path<TFormValues>>);
                }}
                value={(watch(`tasks.${index}.priority` as Path<TFormValues>) || 'Medium') as TaskPriority}
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
                {...register(`tasks.${index}.deadline` as Path<TFormValues>)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProjectTasksSection;
