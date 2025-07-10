
import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import TaskFormFieldsEnhanced from './TaskFormFieldsEnhanced';
import { TaskFormValues } from '@/types/forms';

interface TaskFormFieldsWithAIProps {
  form: UseFormReturn<TaskFormValues>;
  projects: Array<{ id: string; title: string }>;
  teamMembers: Array<{ id: string; name: string; email: string }>;
  showProjectField?: boolean;
  showAssignmentFields?: boolean;
}

const TaskFormFieldsWithAI: React.FC<TaskFormFieldsWithAIProps> = ({
  form,
  projects,
  teamMembers,
  showProjectField = true,
  showAssignmentFields = true
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTaskWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a description for the AI to generate a task');
      return;
    }

    setIsGenerating(true);
    try {
      // Mock AI generation - replace with actual AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Example generated task
      const generatedTask = {
        title: `Task based on: ${aiPrompt.slice(0, 50)}...`,
        description: `Generated description for: ${aiPrompt}`,
        priority: 'Medium' as const,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };

      form.setValue('title', generatedTask.title);
      form.setValue('description', generatedTask.description);
      form.setValue('priority', generatedTask.priority);
      form.setValue('deadline', generatedTask.deadline);

      toast.success('Task generated successfully!');
      setAiPrompt('');
    } catch (error) {
      console.error('Error generating task:', error);
      toast.error('Failed to generate task. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Section */}
      <div className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <Label className="text-base font-medium">AI Task Generator</Label>
        </div>
        <Textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe what you want to accomplish, and AI will generate a task for you..."
          rows={3}
          className="mb-3"
        />
        <Button
          onClick={generateTaskWithAI}
          disabled={isGenerating || !aiPrompt.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Task with AI
            </>
          )}
        </Button>
      </div>

      {/* Standard Form Fields */}
      <TaskFormFieldsEnhanced
        form={form}
        projects={projects}
        teamMembers={teamMembers}
        showProjectField={showProjectField}
        showAssignmentFields={showAssignmentFields}
      />
    </div>
  );
};

export default TaskFormFieldsWithAI;
