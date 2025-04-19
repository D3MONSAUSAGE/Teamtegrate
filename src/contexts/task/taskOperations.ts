
import { playSuccessSound, playErrorSound, playStatusChangeSound } from '@/utils/sounds';
import { User, Project, Task, TaskStatus, TaskPriority, TaskComment, DailyScore } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { v4 as uuidv4 } from 'uuid';

export const addTask = async (
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const taskId = uuidv4();

    const taskToInsert = {
      id: taskId,
      user_id: user.id,
      project_id: task.projectId || null,
      title: task.title,
      description: task.description,
      deadline: task.deadline.toISOString(),
      priority: task.priority,
      status: task.status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      assigned_to_id: task.assignedToId || null,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(taskToInsert)
      .select('*')
      .single();

    if (error) {
      console.error('Error adding task:', error);
      playErrorSound();
      toast.error('Failed to create task');
      return;
    }

    if (data) {
      const newTask: Task = {
        id: data.id,
        userId: data.user_id || user.id,
        projectId: data.project_id || undefined,
        title: data.title || '',
        description: data.description || '',
        deadline: new Date(data.deadline || now),
        priority: (data.priority as TaskPriority) || 'Medium',
        status: (data.status as TaskStatus) || 'To Do',
        createdAt: new Date(data.created_at || now),
        updatedAt: new Date(data.updated_at || now),
        assignedToId: data.assigned_to_id || undefined,
        assignedToName: task.assignedToName,
        tags: [],
        comments: [],
        cost: data.cost || 0,
      };

      // Update local tasks state
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      // If the task is assigned to a project, update the project's tasks array
      if (newTask.projectId) {
        setProjects(prevProjects => 
          prevProjects.map(project => {
            if (project.id === newTask.projectId) {
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
            return project;
          })
        );
      }
      
      playSuccessSound();
      toast.success('Task created successfully!');
    }
  } catch (error) {
    console.error('Error in addTask:', error);
    playErrorSound();
    toast.error('Failed to create task');
  }
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const updatedFields: any = {
      updated_at: now.toISOString()
    };

    if (updates.title !== undefined) updatedFields.title = updates.title;
    if (updates.description !== undefined) updatedFields.description = updates.description;
    if (updates.deadline !== undefined) updatedFields.deadline = (updates.deadline instanceof Date ? updates.deadline : new Date(updates.deadline)).toISOString();
    if (updates.priority !== undefined) updatedFields.priority = updates.priority;
    if (updates.status !== undefined) updatedFields.status = updates.status;
    if (updates.projectId !== undefined) updatedFields.project_id = updates.projectId;
    if (updates.assignedToId !== undefined) updatedFields.assigned_to_id = updates.assignedToId;
    if (updates.cost !== undefined) updatedFields.cost = updates.cost;

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      playErrorSound();
      toast.error('Failed to update task');
      return;
    }

    // Get the original task before update
    const originalTask = tasks.find(t => t.id === taskId);
    const originalProjectId = originalTask?.projectId;
    
    // Update local tasks state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updates, updatedAt: now };
      }
      return task;
    }));
    
    // Handle project assignment changes
    if (updates.projectId !== undefined && updates.projectId !== originalProjectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          // If this is the old project, remove the task
          if (project.id === originalProjectId) {
            return {
              ...project,
              tasks: project.tasks.filter(task => task.id !== taskId)
            };
          }
          
          // If this is the new project, add the task
          if (project.id === updates.projectId) {
            // Find the updated task
            const updatedTask = tasks.find(t => t.id === taskId);
            if (updatedTask) {
              const newTask = { ...updatedTask, ...updates, projectId: updates.projectId, updatedAt: now };
              return {
                ...project,
                tasks: [...project.tasks, newTask]
              };
            }
          }
          
          return project;
        });
      });
    } else if (updates.status || updates.title || updates.description || updates.priority || updates.deadline || updates.assignedToId) {
      // Update task in project if other properties changed
      if (originalProjectId) {
        setProjects(prevProjects => {
          return prevProjects.map(project => {
            if (project.id === originalProjectId) {
              return {
                ...project,
                tasks: project.tasks.map(task => {
                  if (task.id === taskId) {
                    return { ...task, ...updates, updatedAt: now };
                  }
                  return task;
                })
              };
            }
            return project;
          });
        });
      }
    }

    toast.success('Task updated successfully!');
  } catch (error) {
    console.error('Error in updateTask:', error);
    playErrorSound();
    toast.error('Failed to update task');
  }
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setDailyScore: React.Dispatch<React.SetStateAction<DailyScore>>
) => {
  try {
    if (!user) return;

    const now = new Date();
    const updatedFields: any = {
      status,
      updated_at: now.toISOString()
    };
    
    // If completing the task, set completed_at
    if (status === 'Completed') {
      updatedFields.completed_at = now.toISOString();
    } else {
      // If changing from completed to something else, clear completed_at
      updatedFields.completed_at = null;
    }

    const { error } = await supabase
      .from('tasks')
      .update(updatedFields)
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      playErrorSound();
      toast.error('Failed to update task status');
      return;
    }

    // Find the task
    const task = tasks.find(t => t.id === taskId);
    const projectId = task?.projectId;
    
    // Update local tasks state
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { 
          ...task, 
          status, 
          updatedAt: now,
          completedAt: status === 'Completed' ? now : undefined
        };
      }
      return task;
    }));

    // Also update the task in the project
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(projectTask => {
                if (projectTask.id === taskId) {
                  return {
                    ...projectTask,
                    status,
                    updatedAt: now,
                    completedAt: status === 'Completed' ? now : undefined
                  };
                }
                return projectTask;
              })
            };
          }
          return project;
        });
      });
    }

    playStatusChangeSound();
    toast.success('Task status updated successfully!');
  } catch (error) {
    console.error('Error updating task status:', error);
    playErrorSound();
    toast.error('Failed to update task status');
  }
};

export const deleteTask = async (
  taskId: string,
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    // Find the task to get its project ID before deleting
    const taskToDelete = projects.flatMap(p => p.tasks).find(t => t.id === taskId) || 
                        tasks.find(t => t.id === taskId);
    const projectId = taskToDelete?.projectId;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      playErrorSound();
      toast.error('Failed to delete task');
      return;
    }

    // Remove from tasks array
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    
    // Also remove from project if it belongs to one
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.filter(task => task.id !== taskId)
            };
          }
          return project;
        });
      });
    }

    toast.success('Task deleted successfully!');
  } catch (error) {
    console.error('Error in deleteTask:', error);
    playErrorSound();
    toast.error('Failed to delete task');
  }
};

export const assignTaskToProject = async (
  taskId: string,
  projectId: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    // Find the task to get its current project ID
    const task = tasks.find(t => t.id === taskId);
    const originalProjectId = task?.projectId;

    const { error } = await supabase
      .from('tasks')
      .update({ project_id: projectId, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to project:', error);
      playErrorSound();
      toast.error('Failed to assign task to project');
      return;
    }

    // Update the task in the tasks array
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, projectId, updatedAt: now };
      }
      return task;
    }));

    // Handle project assignments
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        // If this is the old project, remove the task
        if (project.id === originalProjectId) {
          return {
            ...project,
            tasks: project.tasks.filter(task => task.id !== taskId)
          };
        }
        
        // If this is the new project, add the task
        if (project.id === projectId) {
          const taskToAdd = tasks.find(t => t.id === taskId);
          if (taskToAdd) {
            // Make a copy with the new project ID
            const updatedTask = { ...taskToAdd, projectId, updatedAt: now };
            return {
              ...project,
              tasks: [...project.tasks, updatedTask]
            };
          }
        }
        
        return project;
      });
    });

    toast.success('Task assigned to project successfully!');
  } catch (error) {
    console.error('Error in assignTaskToProject:', error);
    playErrorSound();
    toast.error('Failed to assign task to project');
  }
};

export const assignTaskToUser = async (
  taskId: string,
  userId: string,
  userName: string,
  user: User | null,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    if (!user) return;

    const now = new Date();

    // Only send assigned_to_id to the database
    const { error } = await supabase
      .from('tasks')
      .update({ assigned_to_id: userId, updated_at: now.toISOString() })
      .eq('id', taskId);

    if (error) {
      console.error('Error assigning task to user:', error);
      playErrorSound();
      toast.error('Failed to assign task to user');
      return;
    }

    // Find the task to get its project ID
    const task = tasks.find(t => t.id === taskId);
    const projectId = task?.projectId;
    
    // Update the task in the tasks array
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        return { ...task, assignedToId: userId, assignedToName: userName, updatedAt: now };
      }
      return task;
    }));
    
    // Also update the task in the project if needed
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(projectTask => {
                if (projectTask.id === taskId) {
                  return { 
                    ...projectTask, 
                    assignedToId: userId, 
                    assignedToName: userName,
                    updatedAt: now
                  };
                }
                return projectTask;
              })
            };
          }
          return project;
        });
      });
    }

    toast.success('Task assigned to user successfully!');
  } catch (error) {
    console.error('Error in assignTaskToUser:', error);
    playErrorSound();
    toast.error('Failed to assign task to user');
  }
};

export const addCommentToTask = async (
  taskId: string,
  comment: { userId: string; userName: string; text: string },
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  try {
    const now = new Date();
    const newComment: TaskComment = {
      id: uuidv4(),
      userId: comment.userId,
      userName: comment.userName,
      text: comment.text,
      createdAt: now,
    };

    // Find the task to get its project ID
    const task = tasks.find(t => t.id === taskId);
    const projectId = task?.projectId;
    
    // Update the task in the tasks array
    setTasks(prevTasks => prevTasks.map(task => {
      if (task.id === taskId) {
        const updatedComments = [...(task.comments || []), newComment];
        return { ...task, comments: updatedComments };
      }
      return task;
    }));
    
    // Also update the task in the project if needed
    if (projectId) {
      setProjects(prevProjects => {
        return prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              tasks: project.tasks.map(projectTask => {
                if (projectTask.id === taskId) {
                  const updatedComments = [...(projectTask.comments || []), newComment];
                  return { ...projectTask, comments: updatedComments };
                }
                return projectTask;
              })
            };
          }
          return project;
        });
      });
    }

    toast.success('Comment added successfully!');
  } catch (error) {
    console.error('Error in addCommentToTask:', error);
    playErrorSound();
    toast.error('Failed to add comment to task');
  }
};

export const addTagToTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  // Find the task to get its project ID
  const task = tasks.find(t => t.id === taskId);
  const projectId = task?.projectId;
  
  // Update the task in the tasks array
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId) {
      const updatedTags = [...(task.tags || []), tag];
      return { ...task, tags: updatedTags };
    }
    return task;
  }));
  
  // Also update the task in the project if needed
  if (projectId) {
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map(projectTask => {
              if (projectTask.id === taskId) {
                const updatedTags = [...(projectTask.tags || []), tag];
                return { ...projectTask, tags: updatedTags };
              }
              return projectTask;
            })
          };
        }
        return project;
      });
    });
  }

  toast.success('Tag added to task successfully!');
};

export const removeTagFromTask = (
  taskId: string,
  tag: string,
  tasks: Task[],
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  // Find the task to get its project ID
  const task = tasks.find(t => t.id === taskId);
  const projectId = task?.projectId;
  
  // Update the task in the tasks array
  setTasks(prevTasks => prevTasks.map(task => {
    if (task.id === taskId && task.tags) {
      const updatedTags = task.tags.filter(t => t !== tag);
      return { ...task, tags: updatedTags };
    }
    return task;
  }));
  
  // Also update the task in the project if needed
  if (projectId) {
    setProjects(prevProjects => {
      return prevProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map(projectTask => {
              if (projectTask.id === taskId && projectTask.tags) {
                const updatedTags = projectTask.tags.filter(t => t !== tag);
                return { ...projectTask, tags: updatedTags };
              }
              return projectTask;
            })
          };
        }
        return project;
      });
    });
  }

  toast.success('Tag removed from task successfully!');
};

export const addTagToProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId) {
      const updatedTags = [...(project.tags || []), tag];
      return { ...project, tags: updatedTags };
    }
    return project;
  }));

  toast.success('Tag added to project successfully!');
};

export const removeTagFromProject = (
  projectId: string,
  tag: string,
  projects: Project[],
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  setProjects(prevProjects => prevProjects.map(project => {
    if (project.id === projectId && project.tags) {
      const updatedTags = project.tags.filter(t => t !== tag);
      return { ...project, tags: updatedTags };
    }
    return project;
  }));

  toast.success('Tag removed from project successfully!');
};
