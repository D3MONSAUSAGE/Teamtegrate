
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Plus, X } from 'lucide-react';

export type FormValues = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  budget: string | number;
  teamMembers: { memberId: string }[];
  tasks: { title: string; description: string; priority: string; deadline: string }[];
}

interface ProjectTasksSectionProps {
  taskFields: { id: string }[];
  register: UseFormRegister<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
  fieldArrayProps: {
    append: (value: { title: string; description: string; priority: string; deadline: string }) => void;
    remove: (index: number) => void;
  };
}

const ProjectTasksSection: React.FC<ProjectTasksSectionProps> = ({
  taskFields,
  register,
  setValue,
  watch,
  fieldArrayProps: { append, remove }
}) => {
  const handleAddTask = () => {
    append({
      title: '',
      description: '',
      priority: 'Medium',
      deadline: ''
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Tasks</h3>
        <Button 
          type="button" 
          onClick={handleAddTask}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Task
        </Button>
      </div>
      
      {taskFields.map((field, index) => (
        <div key={field.id} className="p-4 border rounded space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Task {index + 1}</h4>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => remove(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`tasks.${index}.title`}>Task Title</Label>
            <Input
              id={`tasks.${index}.title`}
              {...register(`tasks.${index}.title`)}
              placeholder="Enter task title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`tasks.${index}.description`}>Description</Label>
            <Textarea
              id={`tasks.${index}.description`}
              {...register(`tasks.${index}.description`)}
              placeholder="Enter task description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`tasks.${index}.priority`}>Priority</Label>
              <select
                id={`tasks.${index}.priority`}
                {...register(`tasks.${index}.priority`)}
                className="w-full p-2 border rounded"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`tasks.${index}.deadline`}>Deadline</Label>
              <Input
                id={`tasks.${index}.deadline`}
                type="date"
                {...register(`tasks.${index}.deadline`)}
              />
            </div>
          </div>
        </div>
      ))}
      
      {taskFields.length === 0 && (
        <p className="text-sm text-gray-500">No tasks added yet. Click "Add Task" to create one.</p>
      )}
    </div>
  );
};

export default ProjectTasksSection;
