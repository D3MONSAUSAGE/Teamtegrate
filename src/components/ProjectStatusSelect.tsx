
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Project } from '@/types';
import { useTask } from '@/contexts/task';
import { toast } from '@/components/ui/sonner';
import { playSuccessSound, playErrorSound } from '@/utils/sounds';

interface ProjectStatusSelectProps {
  project: Project;
}

const ProjectStatusSelect: React.FC<ProjectStatusSelectProps> = ({ project }) => {
  const { updateProject } = useTask();

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Explicitly set is_completed based on the status
      const isCompleted = newStatus === 'Done';
      
      console.log(`Updating project ${project.id} status to:`, newStatus);
      console.log(`Setting is_completed to:`, isCompleted);
      
      await updateProject(project.id, { 
        status: newStatus as Project['status'],
        is_completed: isCompleted
      });
      
      toast.success("Project status updated");
      playSuccessSound();
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error("Failed to update project status");
      playErrorSound();
    }
  };

  // Create a style object based on the current status
  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'Done':
        return "bg-green-500/10 text-green-700 border-green-500";
      case 'In Progress':
        return "bg-blue-500/10 text-blue-700 border-blue-500";
      default: // To Do
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500";
    }
  };

  return (
    <Select 
      defaultValue={project.status} 
      value={project.status}
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className={`w-full ${getStatusStyle(project.status)}`}>
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="To Do">To Do</SelectItem>
        <SelectItem value="In Progress">In Progress</SelectItem>
        <SelectItem value="Done">Done</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ProjectStatusSelect;
