
import { useConsolidatedUserOperations } from './useConsolidatedUserOperations';

export const useUserOperations = (refetchUsers: () => Promise<void>) => {
  return useConsolidatedUserOperations(refetchUsers);
};
