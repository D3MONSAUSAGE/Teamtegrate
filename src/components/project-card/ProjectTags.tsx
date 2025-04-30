
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";

interface ProjectTagsProps {
  tags: string[];
}

const ProjectTags: React.FC<ProjectTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      <div className="flex items-center text-xs text-muted-foreground mr-1">
        <Tag className="h-3 w-3 mr-1" /> Tags:
      </div>
      {tags.map((tag, index) => (
        <Badge key={index} variant="outline" className="text-xs bg-primary/5 hover:bg-primary/10">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default ProjectTags;
