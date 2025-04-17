import { User, Task, Project } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Comment } from '@/types';

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
      const formattedTasks = data.map(task => ({
        ...task,
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
      }));
      
      setTasks(formattedTasks);
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
        
        const formattedProjectTasks = projectTasks ? projectTasks.map(task => ({
          ...task,
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
        };
      }));
      
      setProjects(formattedProjects);
    }
  } catch (error) {
    console.error('Error in fetchProjects:', error);
  }
};

export const fetchTaskComments = async (taskId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        task_id,
        user_id,
        text,
        created_at,
        profiles (name)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      return [];
    }

    return data.map(comment => ({
      id: comment.id,
      taskId: comment.task_id,
      userId: comment.user_id,
      userName: comment.profiles?.name || 'Unknown User',
      text: comment.text,
      createdAt: new Date(comment.created_at)
    }));
  } catch (error) {
    console.error('Error in fetchTaskComments:', error);
    return [];
  }
};

export const addCommentToTask = async (
  taskId: string, 
  userId: string, 
  text: string
): Promise<Comment | null> => {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('comments')
      .insert({
        task_id: taskId,
        user_id: userId,
        text: text
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return null;
    }

    const newComment: Comment = {
      id: data.id,
      taskId: data.task_id,
      userId: data.user_id,
      userName: userData?.name || 'Unknown User',
      text: data.text,
      createdAt: new Date(data.created_at)
    };

    toast.success('Comment added successfully');
    return newComment;
  } catch (error) {
    console.error('Error in addCommentToTask:', error);
    toast.error('Failed to add comment');
    return null;
  }
};
