
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Plus, Tag, X } from 'lucide-react';
import { UseFormWatch, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./TeamMembersSection";

interface TagsSectionProps {
  watch: UseFormWatch<FormValues>;
  setValue: UseFormSetValue<FormValues>;
}

export const TagsSection: React.FC<TagsSectionProps> = ({
  watch,
  setValue
}) => {
  const [newTag, setNewTag] = useState('');
  const currentTags = watch('tags') || [];
  
  const handleAddTag = () => {
    if (newTag && newTag.trim() !== '') {
      // Check if the tag already exists
      if (!currentTags.includes(newTag.trim())) {
        setValue('tags', [...currentTags, newTag.trim()]);
        setNewTag('');
      }
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setValue('tags', currentTags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Label htmlFor="newTag" className="sr-only">Add Tag</Label>
          <div className="flex">
            <Input
              id="newTag"
              placeholder="Enter a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="rounded-r-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleAddTag} 
              className="rounded-l-none"
            >
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {currentTags.length > 0 ? (
          currentTags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <Tag className="h-3 w-3" /> {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                onClick={() => handleRemoveTag(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No tags added yet. Add tags to categorize your project.</p>
        )}
      </div>
    </div>
  );
};
