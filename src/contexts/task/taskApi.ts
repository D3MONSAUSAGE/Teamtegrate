
import { User, Task, Project, TaskComment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

// Helper function to get team member name from their ID
const fetchTeamMemberName = async (memberId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('name')
      .eq('id', memberId)
      .single();
    
    if (error || !data) {
      return 'Unknown';
    }
    
    return data.name;
  } catch (error) {
    console.error('Error fetching team member name:', error);
    return 'Unknown';
  }
};

export const fetchTasks = async (user: User | null, setTasks: React.Dispatch<React.SetStateAction<Task[]>>) => {
  try {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
      return;
    }
    
    if (data) {
      // First map tasks to get basic structure
      const tasksWithoutNames = data.map(task => ({
        id: task.id,
        userId: task.user_id,
        projectId: task.project_id,
        title: task.title || '',
        description: task.description || '',
        deadline: new Date(task.deadline || Date.now()),
        priority: (task.priority as any) || 'Medium',
        status: (task.status as any) || 'To Do',
        createdAt: new Date(task.created_at || Date.now()),
        updatedAt: new Date(task.updated_at || Date.now()),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        assignedToId: task.assigned_to_id,
        assignedToName: undefined, // We'll fill this in later
        completedById: user.id, // Default to current user if completed
        completedByName: user.name,
        cost: task.cost || 0,
        comments: [] // Initialize as empty array
      }));
      
      // Now process additional data in parallel for all tasks
      const formattedTasksWithPromises = await Promise.all(tasksWithoutNames.map(async (task) => {
        // Get assignee name if there is an assignedToId
        if (task.assignedToId) {
          task.assignedToName = await fetchTeamMemberName(task.assignedToId);
        }
        
        // Fetch comments for each task
        const comments = await fetchTaskComments(task.id);
        if (comments) {
          task.comments = comments;
        }
        
        return task;
      }));
      
      setTasks(formattedTasksWithPromises);
    }
  } catch (error) {
    console.error('Error in fetchTasks:', error);
  }
};

export const fetchProjects = async (user: User | null, setProjects: React.Dispatch<React.SetStateAction<Project[]>>) => {
  try {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('manager_id', user.id);
    
    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      return;
    }
    
    if (data) {
      const formattedProjects = await Promise.all(data.map(async (project) => {
        const { data: projectTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', project.id);
        
        const formattedProjectTasks = projectTasks ? await Promise.all(projectTasks.map(async (task) => {
          // For each task, fetch its comments
          const comments = await fetchTaskComments(task.id);

          // Get assignee name if available
          let assigneeName;
          if (task.assigned_to_id) {
            assigneeName = await fetchTeamMemberName(task.assigned_to_id);
          }
          
          const formattedTask: Task = {
            id: task.id,
            userId: task.user_id,
            projectId: task.project_id,
            title: task.title || '',
            description: task.description || '',
            deadline: new Date(task.deadline || Date.now()),
            priority: (task.priority as any) || 'Medium',
            status: (task.status as any) || 'To Do',
            createdAt: new Date(task.created_at || Date.now()),
            updatedAt: new Date(task.updated_at || Date.now()),
            completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
            assignedToId: task.assigned_to_id,
            assignedToName: assigneeName,
            completedById: user.id, // Default to the project manager
            completedByName: user.name,
            comments: comments || [],
            cost: task.cost || 0,
          };
          return formattedTask;
        })) : [];
        
        return {
          id: project.id,
          title: project.title || '',
          description: project.description || '',
          startDate: new Date(project.start_date || Date.now()),
          endDate: new Date(project.end_date || Date.now()),
          managerId: project.manager_id || '',
          createdAt: new Date(project.created_at || Date.now()),
          updatedAt: new Date(project.updated_at || Date.now()),
          tasks: formattedProjectTasks,
          teamMembers: [],
          tags: [],
          budget: project.budget || 0,
          budgetSpent: project.budget_spent || 0,
        };
      }));
      
      setProjects(formattedProjects);
    }
  } catch (error) {
    console.error('Error in fetchProjects:', error);
  }
};

export const fetchTaskComments = async (taskId: string): Promise<TaskComment[] | null> => {
  try {
    // In a real app, you would have a comments table. For now, we'll simulate it.
    // This would be replaced with actual API call to fetch comments from a database
    // For example:
    // const { data, error } = await supabase
    //   .from('comments')
    //   .select('*')
    //   .eq('task_id', taskId);
    
    // Since we don't have a comments table, we'll return an empty array
    // In a real implementation, this would contain actual comments from the database
    return [];
    
  } catch (error) {
    console.error('Error fetching comments for task:', error);
    return null;
  }
};

export const addCommentToTask = async (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    // In a real app, you would insert the comment into a database
    // For now, we'll just update the local state
    const newComment: TaskComment = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: new Date()
    };
    
    // Update tasks state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          comments: [...(task.comments || []), newComment]
        };
      }
      return task;
    }));
    
    // Update projects state
    setProjects(prevProjects => prevProjects.map(project => {
      return {
        ...project,
        tasks: project.tasks.map(task => {
          if (task.id === taskId) {
            return {
              ...task,
              comments: [...(task.comments || []), newComment]
            };
          }
          return task;
        })
      };
    }));
    
    toast.success('Comment added successfully');
    return newComment;
    
  } catch (error) {
    console.error('Error adding comment:', error);
    toast.error('Failed to add comment');
    return null;
  }
};
