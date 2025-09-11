import { useState, useMemo } from 'react';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { useAuth } from '@/contexts/auth/AuthProvider';

export interface MeetingFilters {
  search: string;
  status: 'all' | 'upcoming' | 'pending' | 'past' | 'my_meetings' | 'needsResponse' | 'fullyConfirmed';
  sortBy: 'date' | 'title' | 'participants';
  sortOrder: 'asc' | 'desc';
}

export const useMeetingFilters = (meetings: MeetingRequestWithParticipants[]) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<MeetingFilters>({
    search: '',
    status: 'upcoming',
    sortBy: 'date',
    sortOrder: 'asc'
  });

  const filteredMeetings = useMemo(() => {
    let filtered = meetings;

    // Filter by search term
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(meeting =>
        meeting.title.toLowerCase().includes(searchTerm) ||
        meeting.description?.toLowerCase().includes(searchTerm) ||
        meeting.organizer_name?.toLowerCase().includes(searchTerm) ||
        meeting.participants.some(p => 
          p.user_name?.toLowerCase().includes(searchTerm) ||
          p.user_email?.toLowerCase().includes(searchTerm)
        )
      );
    }

    // Filter by status
    const now = new Date();
    switch (filters.status) {
      case 'upcoming':
        filtered = filtered.filter(meeting => 
          new Date(meeting.start_time) > now && meeting.status !== 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(meeting => 
          new Date(meeting.start_time) < now
        );
        break;
      case 'pending':
        filtered = filtered.filter(meeting => {
          const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
          return userParticipant?.response_status === 'invited' && 
                 new Date(meeting.start_time) > now &&
                 meeting.organizer_id !== user?.id;
        });
        break;
      case 'my_meetings':
        filtered = filtered.filter(meeting => 
          meeting.organizer_id === user?.id
        );
        break;
      case 'needsResponse':
        filtered = filtered.filter(meeting => {
          const pendingCount = meeting.participants.filter(p => p.response_status === 'invited').length;
          return pendingCount > 0 && new Date(meeting.start_time) > now && meeting.status !== 'cancelled';
        });
        break;
      case 'fullyConfirmed':
        filtered = filtered.filter(meeting => {
          const allResponded = meeting.participants.length > 0 && 
            meeting.participants.every(p => p.response_status !== 'invited');
          const hasAccepted = meeting.participants.some(p => p.response_status === 'accepted');
          return allResponded && hasAccepted && new Date(meeting.start_time) > now && meeting.status !== 'cancelled';
        });
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    // Sort meetings
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'participants':
          comparison = (a.participants?.length || 0) - (b.participants?.length || 0);
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [meetings, filters, user?.id]);

  const updateFilters = (newFilters: Partial<MeetingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'upcoming',
      sortBy: 'date',
      sortOrder: 'asc'
    });
  };

  const meetingCounts = useMemo(() => {
    const now = new Date();
    const all = meetings.length;
    const upcoming = meetings.filter(m => 
      new Date(m.start_time) > now && m.status !== 'cancelled'
    ).length;
    const past = meetings.filter(m => 
      new Date(m.start_time) < now
    ).length;
    const pending = meetings.filter(m => {
      const userParticipant = m.participants.find(p => p.user_id === user?.id);
      return userParticipant?.response_status === 'invited' && 
             new Date(m.start_time) > now &&
             m.organizer_id !== user?.id;
    }).length;
    const myMeetings = meetings.filter(m => 
      m.organizer_id === user?.id
    ).length;
    const needsResponse = meetings.filter(m => {
      const pendingCount = m.participants.filter(p => p.response_status === 'invited').length;
      return pendingCount > 0 && new Date(m.start_time) > now && m.status !== 'cancelled';
    }).length;
    const fullyConfirmed = meetings.filter(m => {
      const allResponded = m.participants.length > 0 && 
        m.participants.every(p => p.response_status !== 'invited');
      const hasAccepted = m.participants.some(p => p.response_status === 'accepted');
      return allResponded && hasAccepted && new Date(m.start_time) > now && m.status !== 'cancelled';
    }).length;

    return { all, upcoming, past, pending, myMeetings, needsResponse, fullyConfirmed };
  }, [meetings, user?.id]);

  return {
    filters,
    filteredMeetings,
    updateFilters,
    resetFilters,
    meetingCounts
  };
};