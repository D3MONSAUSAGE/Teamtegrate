
import { fetchTasks } from './taskFetch';
import { fetchProjects } from './projects';
import { addTask } from './taskCreate';
import { updateTask } from './taskUpdate';
import { updateTaskStatus } from './taskStatus';
import { deleteTask } from './taskDelete';
import { assignTaskToProject, assignTaskToUser } from './taskAssignment';
import { addCommentToTask } from './comments';

export {
  fetchTasks,
  fetchProjects,
  addTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTaskToProject,
  assignTaskToUser,
  addCommentToTask
};
