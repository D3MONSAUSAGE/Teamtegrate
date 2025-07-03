
// UUID validation utilities to prevent empty string errors

export const validateUUID = (value: string | null | undefined): string | null => {
  if (!value || value.trim() === '') {
    return null;
  }
  
  // Basic UUID format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    console.warn('Invalid UUID format:', value);
    return null;
  }
  
  return value;
};

export const validateUUIDArray = (values: (string | null | undefined)[] | null | undefined): string[] => {
  if (!Array.isArray(values)) {
    return [];
  }
  
  return values
    .map(validateUUID)
    .filter((uuid): uuid is string => uuid !== null);
};

export const sanitizeProjectData = (project: any) => {
  return {
    ...project,
    managerId: validateUUID(project.manager_id) || validateUUID(project.managerId),
    teamMemberIds: validateUUIDArray(project.team_members || project.teamMemberIds || []),
    organizationId: validateUUID(project.organization_id) || validateUUID(project.organizationId)
  };
};

export const sanitizeTaskData = (task: any) => {
  return {
    ...task,
    userId: validateUUID(task.user_id) || validateUUID(task.userId),
    projectId: validateUUID(task.project_id) || validateUUID(task.projectId),
    assignedToId: validateUUID(task.assigned_to_id) || validateUUID(task.assignedToId),
    assignedToIds: validateUUIDArray(task.assigned_to_ids || task.assignedToIds || []),
    organizationId: validateUUID(task.organization_id) || validateUUID(task.organizationId)
  };
};
