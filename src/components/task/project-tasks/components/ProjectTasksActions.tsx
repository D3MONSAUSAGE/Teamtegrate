
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Settings, RefreshCw, UserPlus } from 'lucide-react';

interface ProjectTasksActionsProps {
  canEditProject: boolean;
  isRefreshing: boolean;
  onCreateTask: () => void;
  onEditProject: () => void;
  onRefresh: () => void;
  onAddTeamMember: () => void;
}

const ProjectTasksActions: React.FC<ProjectTasksActionsProps> = ({
  canEditProject,
  isRefreshing,
  onCreateTask,
  onEditProject,
  onRefresh,
  onAddTeamMember
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button onClick={onCreateTask} className="flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create Task
      </Button>
      
      {canEditProject && (
        <>
          <Button variant="outline" onClick={onEditProject} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Edit Project
          </Button>
          
          <Button variant="outline" onClick={onAddTeamMember} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Team Member
          </Button>
        </>
      )}
      
      <Button 
        variant="outline" 
        onClick={onRefresh} 
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};

export default ProjectTasksActions;
