import React from 'react';
import { useTask } from '@/contexts/task';
import { Project } from '@/types';
import { ProjectStatusDistribution, ProjectBudgetOverview } from './project/ProjectCharts';

const ProjectReports: React.FC = () => {
  const { projects } = useTask();
  
  // Use projects directly without conversion
  const projectList = projects as Project[];

  // Project status distribution data
  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = {
      'To Do': 0,
      'In Progress': 0,
      'Completed': 0
    };
    
    projectList.forEach(project => {
      counts[project.status]++;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [projectList]);
  
  // Project budget data
  const budgetData = React.useMemo(() => {
    return projectList
      .filter(project => project.budget > 0)
      .map(project => ({
        name: project.title,
        budget: project.budget,
        spent: project.budgetSpent,
        remaining: project.budget - project.budgetSpent
      }));
  }, [projectList]);
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectStatusDistribution statusCounts={statusCounts} />
        <ProjectBudgetOverview budgetData={budgetData} />
      </div>
    </div>
  );
};

export default ProjectReports;
