
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface AITaskGeneratorProps {
  onGeneratedContent: (content: string) => void;
  type: 'description' | 'title';
}

const AITaskGenerator: React.FC<AITaskGeneratorProps> = ({ onGeneratedContent, type }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Try to use the OpenAI API via our Edge Function
      try {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('chat-with-ai', {
          body: { 
            message: `Generate a ${type === 'description' ? 'detailed task description' : 'concise task title'} for: ${prompt}` 
          }
        });

        if (!aiError && aiData && aiData.response) {
          // If we got a successful response, use it
          onGeneratedContent(aiData.response);
          toast.success("Content generated successfully using AI!");
          setPrompt('');
          setIsLoading(false);
          return;
        }

        // If there was a quota error, show it
        if (aiData?.error === 'quota_exceeded') {
          setApiError('OpenAI API quota exceeded. Using fallback generator instead.');
          // Continue to fallback
        }
      } catch (aiError) {
        console.warn("AI API error, using fallback:", aiError);
        // Continue to fallback
      }

      // Fallback to simulated AI response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      let generatedContent = '';
      if (type === 'description') {
        generatedContent = generateSimulatedDescription(prompt);
      } else {
        generatedContent = generateSimulatedTitle(prompt);
      }
      
      onGeneratedContent(generatedContent);
      toast.success("Content generated with fallback system!");
      setPrompt('');
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated AI responses - would be replaced with actual AI API calls
  const generateSimulatedDescription = (input: string) => {
    const templates = [
      `Based on the request to ${input}, this task will require careful planning and execution. The primary goal is to ensure all aspects are addressed thoroughly, with attention to detail and quality standards. Key deliverables include documentation, implementation, and testing where applicable.`,
      `This task involves ${input}. It should be approached methodically, starting with research and planning before moving to implementation. Consider potential challenges like resource constraints or technical limitations. Document progress throughout the process.`,
      `Task objective: ${input}. This requires coordination with team members and stakeholders to ensure alignment on expectations. Set clear milestones for tracking progress and provide regular updates on status.`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  };

  const generateSimulatedTitle = (input: string) => {
    const prefixes = ["Implement", "Develop", "Create", "Design", "Update", "Analyze", "Review"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix} ${input.charAt(0).toUpperCase() + input.slice(1)}`;
  };

  return (
    <div className="space-y-2 mt-2">
      {apiError && (
        <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded p-2 text-xs flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> 
          {apiError}
        </div>
      )}
      
      <Textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={type === 'description' 
          ? "Describe what you want the task to be about..." 
          : "Briefly describe the task purpose..."}
        className="h-20 resize-none text-sm"
      />
      
      <Button 
        onClick={generateContent}
        disabled={isLoading || !prompt.trim()}
        className="w-full"
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate {type === 'description' ? 'Description' : 'Title'}
          </>
        )}
      </Button>
    </div>
  );
};

export default AITaskGenerator;
