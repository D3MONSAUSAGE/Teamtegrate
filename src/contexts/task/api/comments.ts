
import { TaskComment } from '@/types';

export const fetchTaskComments = async (taskId: string): Promise<TaskComment[]> => {
  // Mock implementation - replace with actual API call
  return [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe', 
      text: 'This is a sample comment',
      createdAt: new Date(),
      organizationId: 'org1'
    }
  ];
};

export const fetchProjectComments = async (projectId: string): Promise<TaskComment[]> => {
  // Mock implementation - replace with actual API call
  return [
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe', 
      text: 'Project kickoff meeting completed. All team members are aligned on objectives.',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      organizationId: 'org1'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith', 
      text: 'Initial design phase is 50% complete. On track for milestone delivery.',
      createdAt: new Date(Date.now() - 43200000), // 12 hours ago
      organizationId: 'org1'
    }
  ];
};

export const addTaskComment = async (taskId: string, comment: { userId: string; userName: string; text: string; organizationId: string }): Promise<TaskComment> => {
  // Mock implementation - replace with actual API call
  return {
    id: Date.now().toString(),
    userId: comment.userId,
    userName: comment.userName,
    text: comment.text,
    createdAt: new Date(),
    organizationId: comment.organizationId
  };
};

export const addProjectComment = async (projectId: string, comment: { userId: string; userName: string; text: string; organizationId: string }): Promise<TaskComment> => {
  // Mock implementation - replace with actual API call
  return {
    id: Date.now().toString(),
    userId: comment.userId,
    userName: comment.userName,
    text: comment.text,
    createdAt: new Date(),
    organizationId: comment.organizationId
  };
};
