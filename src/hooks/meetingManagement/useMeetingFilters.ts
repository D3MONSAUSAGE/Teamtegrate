import { useState, useMemo } from 'react';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { useAuth } from '@/contexts/AuthContext';

export interface MeetingFilters {
  search: string;
  status: 'all' | 'upcoming' | 'past' | 'pending' | 'accepted' | 'declined' | 'confirmed' | 'cancelled';
  sortBy: 'date' | 'title' | 'participants';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: MeetingFilters = {
  search: '',
  status: 'all',
  sortBy: 'date',
  sortOrder: 'asc'
};

export const useMeetingFilters = (meetings: MeetingRequestWithParticipants[]) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<MeetingFilters>(defaultFilters);

  const filteredMeetings = useMemo(() => {
    let result = [...meetings];

    // Apply search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(meeting =>
        meeting.title.toLowerCase().includes(searchLower) ||
        meeting.description?.toLowerCase().includes(searchLower) ||
        meeting.location?.toLowerCase().includes(searchLower) ||
        meeting.organizer_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      const now = new Date();
      
      result = result.filter(meeting => {
        const startTime = new Date(meeting.start_time);
        const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
        
        switch (filters.status) {
          case 'upcoming':
            return startTime > now && meeting.status !== 'cancelled';
          case 'past':
            return startTime <= now;
          case 'pending':
            return userParticipant?.response_status === 'invited' && startTime > now;
          case 'accepted':
            return userParticipant?.response_status === 'accepted';
          case 'declined':
            return userParticipant?.response_status === 'declined';
          case 'confirmed':
            return meeting.status === 'confirmed';
          case 'cancelled':
            return meeting.status === 'cancelled';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'participants':
          comparison = a.participants.length - b.participants.length;
          break;
        default:
          comparison = 0;
      }
      
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [meetings, filters, user?.id]);

  const meetingCounts = useMemo(() => {
    if (!meetings.length) {
      return {
        all: 0,
        upcoming: 0,
        past: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        confirmed: 0,
        cancelled: 0,
        organized: 0
      };
    }

    const now = new Date();
    
    return {
      all: meetings.length,
      upcoming: meetings.filter(m => new Date(m.start_time) > now && m.status !== 'cancelled').length,
      past: meetings.filter(m => new Date(m.start_time) <= now).length,
      pending: meetings.filter(m => {
        const userParticipant = m.participants.find(p => p.user_id === user?.id);
        return userParticipant?.response_status === 'invited' && new Date(m.start_time) > now;
      }).length,
      accepted: meetings.filter(m => {
        const userParticipant = m.participants.find(p => p.user_id === user?.id);
        return userParticipant?.response_status === 'accepted';
      }).length,
      declined: meetings.filter(m => {
        const userParticipant = m.participants.find(p => p.user_id === user?.id);
        return userParticipant?.response_status === 'declined';
      }).length,
      confirmed: meetings.filter(m => m.status === 'confirmed').length,
      cancelled: meetings.filter(m => m.status === 'cancelled').length,
      organized: meetings.filter(m => m.organizer_id === user?.id).length
    };
  }, [meetings, user?.id]);

  const updateFilters = (newFilters: Partial<MeetingFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  return {
    filters,
    filteredMeetings,
    updateFilters,
    resetFilters,
    meetingCounts
  };
};