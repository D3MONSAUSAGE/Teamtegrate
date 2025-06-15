
import { useEnhancedUserOperations } from './useEnhancedUserOperations';

export const useUserOperations = (refetchUsers: () => void) => {
  return useEnhancedUserOperations(refetchUsers);
};
