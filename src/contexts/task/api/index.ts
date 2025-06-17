
export * from './taskFetch';
export * from './taskCreate';
export { updateTask } from './taskUpdate';
export * from './taskStatus';
export * from './taskDelete';
export * from './taskAssignment';
export * from './projects';
export * from './comments';
export * from './teamPerformance';

// Export createTask from taskCreate
export { addTask as createTask } from './taskCreate';

// Create the missing project API functions
export const fetchProjects = async (organizationId: string) => {
  // Mock implementation - replace with actual API call
  return [];
};

export const createProject = async (projectData: any) => {
  // Mock implementation - replace with actual API call  
  return {
    id: Date.now().toString(),
    ...projectData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

export const updateProject = async (projectId: string, updates: any) => {
  // Mock implementation - replace with actual API call
  return { id: projectId, ...updates, updatedAt: new Date() };
};

export const deleteProject = async (projectId: string) => {
  // Mock implementation - replace with actual API call
  return true;
};
