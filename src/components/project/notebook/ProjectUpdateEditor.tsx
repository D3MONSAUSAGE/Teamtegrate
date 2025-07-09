
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { MessageCirclePlus, Pin } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectUpdateEditorProps {
  onSubmit: (content: string, category: string, isPinned: boolean) => Promise<void>;
  placeholder?: string;
  isSubmitting?: boolean;
}

const ProjectUpdateEditor: React.FC<ProjectUpdateEditorProps> = ({
  onSubmit,
  placeholder = "Add a project update...",
  isSubmitting = false
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [isPinned, setIsPinned] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || isSubmitting) return;
    
    try {
      await onSubmit(content.trim(), category, isPinned);
      setContent('');
      setCategory('general');
      setIsPinned(false);
    } catch (error) {
      console.error('Error submitting update:', error);
    }
  };

  const handlePinnedChange = (checked: boolean | 'indeterminate') => {
    setIsPinned(checked === true);
  };

  return (
    <Card className="p-4 bg-muted/30">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">
                <span className="flex items-center gap-2">
                  General
                </span>
              </SelectItem>
              <SelectItem value="progress">
                <span className="flex items-center gap-2">
                  Progress
                </span>
              </SelectItem>
              <SelectItem value="issue">
                <span className="flex items-center gap-2">
                  Issue
                </span>
              </SelectItem>
              <SelectItem value="milestone">
                <span className="flex items-center gap-2">
                  Milestone
                </span>
              </SelectItem>
              <SelectItem value="note">
                <span className="flex items-center gap-2">
                  Note
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="pin-update"
              checked={isPinned}
              onCheckedChange={handlePinnedChange}
            />
            <label htmlFor="pin-update" className="text-sm flex items-center gap-1 cursor-pointer">
              <Pin className="h-3 w-3" />
              Pin update
            </label>
          </div>
        </div>
        
        <Textarea 
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none"
          disabled={isSubmitting}
        />
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {content.length}/2000 characters
          </div>
          
          <Button 
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="flex items-center gap-2"
          >
            <MessageCirclePlus className="h-4 w-4" />
            {isSubmitting ? 'Adding...' : 'Add Update'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProjectUpdateEditor;
