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
