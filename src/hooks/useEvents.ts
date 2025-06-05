
import { useState, useEffect } from 'react';
import { Event } from '@/types/events';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedEvents: Event[] = data.map(event => ({
        ...event,
        start_date: new Date(event.start_date),
        end_date: new Date(event.end_date),
        created_at: new Date(event.created_at),
        updated_at: new Date(event.updated_at)
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          user_id: user.id,
          start_date: eventData.start_date.toISOString(),
          end_date: eventData.end_date.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent: Event = {
        ...data,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };

      setEvents(prev => [...prev, newEvent]);
      toast.success('Event created successfully!');
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
      return null;
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  return {
    events,
    isLoading,
    createEvent,
    deleteEvent,
    refetchEvents: fetchEvents
  };
};
