
import { useMemo } from 'react';
import { Task } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/task';
import { getTaskPermissions, TaskPermissions } from '@/utils/taskPermissions';

export const useTaskPermissions = (task: Task): TaskPermissions => {
  const { user } = useAuth();
  const { projects } = useTask();

  return useMemo(() => {
    if (!user) {
      return {
        canView: false,
        canComment: false,
        canUpdateStatus: false,
        canEdit: false,
        accessReason: 'none'
      };
    }

    return getTaskPermissions(task, user, projects, user.role);
  }, [task, user, projects]);
};
