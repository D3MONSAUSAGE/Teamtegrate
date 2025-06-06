
import { Project, ProjectStatus } from '@/types';

export const processProjectData = (data: any[], tasks: any[]): Project[] => {
  if (!data || data.length === 0) {
    console.log('No accessible projects found');
    return [];
  }
  
  console.log('Processing project data:', data);
  
  const formattedProjects: Project[] = data.map(project => {
    // Get project tasks to calculate accurate status
    const projectTasks = tasks.filter(task => task.projectId === project.id);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    
    // Calculate progress based on completed tasks
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Determine status based on task completion
    let status = project.status || 'To Do';
    let isCompleted = project.is_completed || false;
    
    // Fix any status inconsistencies
    if (totalTasks > 0) {
      const allTasksCompleted = completedTasks === totalTasks;
      
      if (allTasksCompleted) {
        status = 'Completed';
        isCompleted = true;
      } else if (status === 'Completed' || isCompleted) {
        // If not all tasks are completed, project cannot be marked as completed
        status = 'In Progress';
        isCompleted = false;
        
        console.log(`Project ${project.id} status corrected: not all tasks complete but was marked as Completed`);
      }
    }
    
    console.log(`✓ Formatted project: ${project.id} - "${project.title}" (${status}, ${progress}% complete)`);
    
    return {
      id: project.id,
      title: project.title || '',
      description: project.description || '',
      startDate: project.start_date ? new Date(project.start_date) : new Date(),
      endDate: project.end_date ? new Date(project.end_date) : new Date(),
      managerId: project.manager_id || '',
      createdAt: project.created_at ? new Date(project.created_at) : new Date(),
      updatedAt: project.updated_at ? new Date(project.updated_at) : new Date(),
      tasks: projectTasks,
      teamMembers: project.team_members || [],
      budget: project.budget || 0,
      budgetSpent: project.budget_spent || 0,
      is_completed: isCompleted,
      status: status as ProjectStatus,
      tasks_count: totalTasks,
      tags: project.tags || []
    };
  });

  console.log(`Final projects being set: ${formattedProjects.length} projects`);
  formattedProjects.forEach(p => console.log(`Final: ${p.id} - "${p.title}"`));
  
  return formattedProjects;
};
