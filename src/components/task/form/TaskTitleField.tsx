
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import AITaskGenerator from '../AITaskGenerator';

interface TaskTitleFieldProps {
  register: any;
  errors: any;
  setValue: (name: string, value: any) => void;
}

const TaskTitleField: React.FC<TaskTitleFieldProps> = ({
  register,
  errors,
  setValue
}) => {
  const [useTitleAI, setUseTitleAI] = React.useState(false);

  const handleGeneratedTitle = (title: string) => {
    setValue('title', title);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="title">Task Title</Label>
        <div className="flex items-center space-x-2">
          <Switch
            id="use-title-ai"
            checked={useTitleAI}
            onCheckedChange={setUseTitleAI}
            className="h-4 w-8"
          />
          <Label htmlFor="use-title-ai" className="text-xs text-muted-foreground">
            Use AI
          </Label>
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
      
      {useTitleAI && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs font-medium flex items-center gap-1 text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Generate Title with AI
          </div>
          <AITaskGenerator 
            onGeneratedContent={handleGeneratedTitle}
            type="title"
          />
        </div>
      )}
    </div>
  );
};

export default TaskTitleField;
