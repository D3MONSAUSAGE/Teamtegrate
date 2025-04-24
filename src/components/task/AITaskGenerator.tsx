
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface AITaskGeneratorProps {
  onGeneratedContent: (content: string) => void;
  type: 'description' | 'title';
}

const AITaskGenerator: React.FC<AITaskGeneratorProps> = ({ onGeneratedContent, type }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt first");
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll simulate the AI response with a timeout
      // In a real implementation, this would make an API call to OpenAI, Perplexity, or another AI service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let generatedContent = '';
      if (type === 'description') {
        generatedContent = generateSimulatedDescription(prompt);
      } else {
        generatedContent = generateSimulatedTitle(prompt);
      }
      
      onGeneratedContent(generatedContent);
      toast.success("Content generated successfully!");
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
    <div className="space-y-2 pt-2">
      <div className="text-sm font-medium flex items-center gap-1.5 text-primary">
        <Sparkles className="h-4 w-4" />
        {type === 'description' ? 'Generate Description with AI' : 'Generate Title with AI'}
      </div>
      <Textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={type === 'description' 
          ? "Describe what you want the task to be about..." 
          : "Briefly describe the task purpose..."}
        className="h-20 resize-none"
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
