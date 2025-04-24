
import { User, Task, Project } from '@/types';
import { fetchTasks } from './api/tasks';
import { fetchProjects } from './api/projects';

// Fetch tasks for a user
export const fetchUserTasks = async (
  user: User | null,
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
) => {
  if (!user) {
    setTasks([]);
    return;
  }

  await fetchTasks(user, setTasks);
};

// Fetch projects for a user
export const fetchUserProjects = async (
  user: User | null,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) => {
  if (!user) {
    setProjects([]);
    return;
  }

  await fetchProjects(user, setProjects);
};
