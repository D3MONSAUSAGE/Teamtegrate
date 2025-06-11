import { FlatTask, FlatProject, FlatComment, RawTaskRow, RawProjectRow, RawCommentRow } from '@/types/flat';

const parseDate = (dateStr: string | null | undefined): Date => {
  if (!dateStr) return new Date();
  return new Date(dateStr);
};

export const mapRawTaskToFlat = (rawTask: RawTaskRow, comments: FlatComment[] = []): FlatTask => {
  // Explicit type validation
  let taskPriority: 'Low' | 'Medium' | 'High' = 'Medium';
  if (rawTask.priority === 'Low' || rawTask.priority === 'Medium' || rawTask.priority === 'High') {
    taskPriority = rawTask.priority;
  }
  
  let taskStatus: 'To Do' | 'In Progress' | 'Completed' = 'To Do';
  if (rawTask.status === 'To Do' || rawTask.status === 'In Progress' || rawTask.status === 'Completed') {
    taskStatus = rawTask.status;
  }

  return {
    id: String(rawTask.id || ''),
    userId: String(rawTask.user_id || ''),
    projectId: rawTask.project_id ? String(rawTask.project_id) : undefined,
    title: String(rawTask.title || ''),
    description: String(rawTask.description || ''),
    deadline: parseDate(rawTask.deadline),
    priority: taskPriority,
    status: taskStatus,
    createdAt: parseDate(rawTask.created_at),
    updatedAt: parseDate(rawTask.updated_at),
    assignedToId: rawTask.assigned_to_id ? String(rawTask.assigned_to_id) : undefined,
    assignedToName: rawTask.assigned_to_names?.[0] ? String(rawTask.assigned_to_names[0]) : undefined,
    assignedToIds: Array.isArray(rawTask.assigned_to_ids) 
      ? rawTask.assigned_to_ids.map((id: any) => String(id)) 
      : [],
    assignedToNames: Array.isArray(rawTask.assigned_to_names) 
      ? rawTask.assigned_to_names.map((name: any) => String(name)) 
      : [],
    cost: Number(rawTask.cost) || 0,
    organizationId: String(rawTask.organization_id || ''),
  };
};

export const mapRawProjectToFlat = (rawProject: RawProjectRow): FlatProject => {
  // Explicit status validation
  let projectStatus: 'To Do' | 'In Progress' | 'Completed' = 'To Do';
  if (rawProject.status === 'To Do' || rawProject.status === 'In Progress' || rawProject.status === 'Completed') {
    projectStatus = rawProject.status;
  }
  
  return {
    id: String(rawProject.id),
    title: String(rawProject.title || ''),
    description: rawProject.description ? String(rawProject.description) : undefined,
    status: projectStatus,
    managerId: String(rawProject.manager_id || ''),
    organizationId: String(rawProject.organization_id || ''),
    createdAt: rawProject.created_at || new Date().toISOString(),
    updatedAt: rawProject.updated_at || new Date().toISOString(),
  };
};

export const mapRawCommentToFlat = (rawComment: RawCommentRow): FlatComment => {
  return {
    id: String(rawComment.id),
    userId: String(rawComment.user_id),
    userName: 'User', // We'll need to get this separately
    text: String(rawComment.content),
    createdAt: parseDate(rawComment.created_at),
    taskId: String(rawComment.task_id),
  };
};
