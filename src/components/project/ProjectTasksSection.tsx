
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskPriority } from '@/types';
import { UseFormRegister, UseFormWatch } from 'react-hook-form';
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectTasksSectionProps<T> {
  taskFields: Array<{
    id: string;
    title?: string;
    description?: string;
    priority?: TaskPriority;
    deadline?: string;
  }>;
  register: UseFormRegister<T>;
  setValue: (name: string, value: any) => void;
  watch: UseFormWatch<T>;
  fieldArrayProps: {
    append: (value: { title: string; description: string; priority: TaskPriority; deadline: string }) => void;
    remove: (index: number) => void;
  };
}

const ProjectTasksSection = <T,>({
  taskFields,
  register,
  setValue,
  watch,
  fieldArrayProps,
}: ProjectTasksSectionProps<T>) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Initial Tasks</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fieldArrayProps.append({ 
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
      
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-4">
          {taskFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md relative">
              <Button 
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => fieldArrayProps.remove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input
                    {...register(`tasks.${index}.title` as any)}
                    placeholder="Task title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    {...register(`tasks.${index}.description` as any)}
                    placeholder="Task description"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      onValueChange={(value: TaskPriority) => setValue(`tasks.${index}.priority`, value)}
                      value={String(watch(`tasks.${index}.priority` as any) || 'Medium')}
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
                      {...register(`tasks.${index}.deadline` as any)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ProjectTasksSection;
