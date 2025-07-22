
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface MobileTaskBasicsProps {
  form: UseFormReturn<any>;
}

const MobileTaskBasics: React.FC<MobileTaskBasicsProps> = ({ form }) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-medium text-foreground">
          Task Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          className="mobile-touch-target text-base border-2 focus:border-primary"
          {...form.register('title', { required: "Title is required" })}
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {String(form.formState.errors.title.message || 'Title is required')}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Add more details about this task..."
          className="min-h-[80px] text-base border-2 focus:border-primary resize-none"
          {...form.register('description')}
        />
        <p className="text-xs text-muted-foreground">
          Provide context and requirements for this task
        </p>
      </div>
    </div>
  );
};

export default MobileTaskBasics;
