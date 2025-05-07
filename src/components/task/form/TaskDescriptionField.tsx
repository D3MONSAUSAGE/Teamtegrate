
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sparkles } from "lucide-react";
import AITaskGenerator from '../AITaskGenerator';

interface TaskDescriptionFieldProps {
  register: any;
  setValue: (name: string, value: any) => void;
}

const TaskDescriptionField: React.FC<TaskDescriptionFieldProps> = ({
  register,
  setValue
}) => {
  const [useDescriptionAI, setUseDescriptionAI] = React.useState(false);

  const handleGeneratedDescription = (description: string) => {
    setValue('description', description);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="description">Description</Label>
        <div className="flex items-center space-x-2">
          <Switch
            id="use-description-ai"
            checked={useDescriptionAI}
            onCheckedChange={setUseDescriptionAI}
            className="h-4 w-8"
          />
          <Label htmlFor="use-description-ai" className="text-xs text-muted-foreground">
            Use AI
          </Label>
        </div>
      </div>
      <Textarea
        id="description"
        placeholder="Enter task description"
        className="resize-none h-24"
        {...register('description')}
      />
      
      {useDescriptionAI && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs font-medium flex items-center gap-1 text-primary mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Generate Description with AI
          </div>
          <AITaskGenerator 
            onGeneratedContent={handleGeneratedDescription}
            type="description"
          />
        </div>
      )}
    </div>
  );
};

export default TaskDescriptionField;
