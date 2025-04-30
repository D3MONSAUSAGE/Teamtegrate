
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

interface ProjectStatusSelectProps {
  project: Project;
}

export const ProjectStatusSelect: React.FC<ProjectStatusSelectProps> = ({ project }) => {
  const { updateProject } = useTask();

  const handleStatusChange = async (newStatus: string) => {
    try {
      // Synchronize is_completed with status
      const isCompleted = newStatus === 'Completed';
      
      console.log(`Updating project ${project.id} status to: ${newStatus}, is_completed: ${isCompleted}`);
      
      await updateProject(project.id, { 
        status: newStatus as Project['status'],
        is_completed: isCompleted
      });
      
      toast.success("Project status updated");
    } catch (error) {
      console.error('Error updating project status:', error);
      toast.error("Failed to update project status");
    }
  };

  return (
    <Select 
      defaultValue={project.status} 
      value={project.status}
      onValueChange={handleStatusChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="To Do">To Do</SelectItem>
        <SelectItem value="In Progress">In Progress</SelectItem>
        <SelectItem value="Completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  );
};
