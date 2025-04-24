
import { Project, Task, TaskPriority, TaskStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert Supabase date strings to Date objects
const parseDate = (dateStr: string | null): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const fetchProjects = async (
  user: { id: string },
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
): Promise<void> => {
  try {
    if (!user) {
      console.log('No user found, skipping project fetch');
      setProjects([]);
      return;
    }

    console.log('Fetching projects for user:', user.id);
    
    // First fetch projects with simplified error handling
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*');

    if (projectError) {
      console.error('Error fetching projects:', projectError);
      toast.error('Failed to load projects');
      setProjects([]);
      return;
    }

    // If no projects, return empty array
    if (!projectData || projectData.length === 0) {
      console.log('No projects found');
      setProjects([]);
      return;
    }

    const projectIds = projectData.map(p => p.id);
    
    // Fetch team members for these projects
    const { data: teamMembersData, error: teamMembersError } = await supabase
      .from('project_team_members')
      .select('project_id, user_id');
      
    if (teamMembersError) {
      console.error('Error fetching project team members:', teamMembersError);
      // Continue execution, just log the error
    }

    // Create a map of project_id -> [member_ids]
    const teamMembersMap = new Map<string, string[]>();
    if (teamMembersData) {
      teamMembersData.forEach(member => {
        if (!teamMembersMap.has(member.project_id)) {
          teamMembersMap.set(member.project_id, []);
        }
        teamMembersMap.get(member.project_id)?.push(member.user_id);
      });
    }
    
    // Fetch tasks for these projects
    let taskData: any[] = [];
    if (projectIds.length > 0) {
      const { data: allTaskData, error: taskError } = await supabase
        .from('project_tasks')
        .select('*')
        .in('project_id', projectIds);
        
      if (taskError) {
        console.error('Error fetching project tasks:', taskError);
        // Continue execution, just log the error
      } else {
        taskData = allTaskData || [];
      }
    }
    
    // Fetch comments for all tasks
    const taskIds = taskData.map(t => t.id);
    let commentData: any[] = [];
    
    if (taskIds.length > 0) {
      const { data: comments, error: commentError } = await supabase
        .from('comments')
        .select('*')
        .in('task_id', taskIds);

      if (commentError) {
        console.error('Error fetching comments:', commentError);
        // Continue execution, just log the error
      } else {
        commentData = comments || [];
      }
    }

    // Create userMap for comment user names
    const userMap = new Map();
    if (commentData && commentData.length > 0) {
      const userIds = [...new Set(commentData.map(comment => comment.user_id))];
      
      if (userIds.length > 0) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email');
        
        if (!userError && userData) {
          userData.forEach(user => {
            userMap.set(user.id, user.name || user.email);
          });
        }
      }
    }

    const projects: Project[] = projectData.map(project => {
      // Get tasks that belong to this project
      const projectTasks = taskData
        .filter(task => task.project_id === project.id)
        .map(task => {
          // Find comments for this task
          const taskComments = commentData
            ? commentData
                .filter(comment => comment.task_id === task.id)
                .map(comment => ({
                  id: comment.id,
                  userId: comment.user_id,
                  userName: userMap.get(comment.user_id) || comment.user_id,
                  text: comment.content,
                  createdAt: parseDate(comment.created_at)
                }))
            : [];

          return {
            id: task.id,
            userId: task.assigned_to_id || user.id, 
            projectId: project.id,
            title: task.title || '',
            description: task.description || '',
            deadline: parseDate(task.deadline),
            priority: (task.priority as TaskPriority) || 'Medium',
            status: (task.status || 'To Do') as TaskStatus,
            createdAt: parseDate(task.created_at),
            updatedAt: parseDate(task.updated_at),
            completedAt: task.completed_at ? parseDate(task.completed_at) : undefined,
            assignedToId: task.assigned_to_id,
            assignedToName: task.assigned_to_id,
            comments: taskComments,
            cost: task.cost || 0
          };
        });

      // Get team members for this project from our map
      const teamMembers = teamMembersMap.get(project.id) || [];

      return {
        id: project.id,
        title: project.title || '',
        description: project.description || '',
        startDate: parseDate(project.start_date),
        endDate: parseDate(project.end_date),
        managerId: project.manager_id || user.id,
        tasks: projectTasks,
        createdAt: parseDate(project.created_at),
        updatedAt: parseDate(project.updated_at),
        budget: project.budget || 0,
        budgetSpent: project.budget_spent || 0,
        is_completed: project.is_completed || false,
        teamMembers
      };
    });

    console.log('Successfully fetched projects:', projectData?.length || 0);
    setProjects(projects);
  } catch (err) {
    console.error('Failed to fetch projects:', err);
    toast.error('Failed to load projects');
    setProjects([]);
  }
};
