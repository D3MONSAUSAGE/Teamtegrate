import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { fetchMeetingRequestsAPI } from '@/contexts/meeting/api';

export const useMeetingData = () => {
  const { user: currentUser } = useAuth();

  const {
    data: meetings = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['meetings', currentUser?.organizationId, currentUser?.id],
    queryFn: async (): Promise<MeetingRequestWithParticipants[]> => {
      if (!currentUser) {
        return [];
      }

      return await fetchMeetingRequestsAPI(currentUser);
    },
    enabled: !!currentUser?.organizationId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.code === 'PGRST116') return false;
      return failureCount < 2;
    }
  });

  return {
    meetings,
    isLoading,
    error,
    refetchMeetings: refetch
  };
};