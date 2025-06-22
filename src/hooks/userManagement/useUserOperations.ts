
import { useConsolidatedUserOperations } from './useConsolidatedUserOperations';

export const useUserOperations = (refetchUsers: () => void) => {
  return useConsolidatedUserOperations(refetchUsers);
};
