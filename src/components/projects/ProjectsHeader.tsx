
import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProjectsHeaderProps {
  onCreateProject: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ onCreateProject }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Projects</h1>
      <Button onClick={onCreateProject}>
        <Plus className="w-4 h-4 mr-2" /> New Project
      </Button>
    </div>
  );
};

export default ProjectsHeader;
