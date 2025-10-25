
import { useOptimizedUserData } from './useOptimizedUserData';

export const useUserData = (teamIds?: string[]) => {
  return useOptimizedUserData(teamIds);
};
