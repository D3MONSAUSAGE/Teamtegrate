
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';

interface ProjectDebugToolsProps {
  onRefresh: () => void;
}

const ProjectDebugTools = ({ onRefresh }: ProjectDebugToolsProps) => {
  const { user } = useAuth();
  const { addProject } = useTask();

  const handleCreateBasicProject = async () => {
    if (!user) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
    const basicProject = {
      title: `Test Project ${new Date().toLocaleTimeString()}`,
      description: 'This is a test project created directly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      managerId: user.id,
      budget: 1000,
      teamMembers: []
    };
    
    try {
      await addProject(basicProject);
      toast.success('Test project created successfully!');
      onRefresh();
    } catch (error) {
      console.error('Failed to create test project:', error);
      toast.error('Failed to create test project');
    }
  };

  return (
    <div className="mb-4">
      <Button 
        onClick={onRefresh}
        className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded mr-2"
      >
        Refresh Projects
      </Button>
      <Button 
        onClick={handleCreateBasicProject}
        className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded"
      >
        Create Test Project
      </Button>
    </div>
  );
};

export default ProjectDebugTools;
