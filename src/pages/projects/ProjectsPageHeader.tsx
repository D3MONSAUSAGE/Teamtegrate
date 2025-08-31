
import React from 'react';
import ModernPageHeader from '@/components/ui/ModernPageHeader';
import { Plus, Folder, Clock, CheckCircle } from 'lucide-react';

interface ProjectsPageHeaderProps {
  totalProjects: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  onCreateProject: () => void;
}

const ProjectsPageHeader: React.FC<ProjectsPageHeaderProps> = ({
  totalProjects,
  todoCount,
  inProgressCount,
  completedCount,
  onCreateProject
}) => {
  return (
    <ModernPageHeader
      title="Projects"
      subtitle="Manage and track your project portfolio"
      icon={Folder}
      actionButton={{
        label: 'New Project',
        onClick: onCreateProject,
        icon: Plus
      }}
      stats={[
        { label: 'Total Projects', value: totalProjects, color: 'text-primary' },
        { label: 'To Do', value: todoCount, color: 'text-blue-600' },
        { label: 'In Progress', value: inProgressCount, color: 'text-amber-600' },
        { label: 'Completed', value: completedCount, color: 'text-green-600' }
      ]}
      badges={[
        { label: 'Portfolio Management', variant: 'default' }
      ]}
    />
  );
};

export default ProjectsPageHeader;
