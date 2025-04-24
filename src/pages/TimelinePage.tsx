
import React, { useEffect, useState } from 'react';
import { useTask } from '@/contexts/task';
import { Timeline } from "@/components/ui/timeline";
import useTeamMembers from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";
import { buildTimelineData } from "@/utils/buildTimelineData";
import { toast } from '@/components/ui/sonner';

interface TimelineJournalEntry {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  author_name?: string | null;
}

const TimelinePage = () => {
  const { tasks, projects } = useTask();
  const { teamMembers } = useTeamMembers();
  const { user } = useAuth();
  const [journalEntries, setJournalEntries] = useState<TimelineJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJournalEntries() {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('Fetching journal entries for user:', user.id);
        
        const { data: entriesData, error } = await supabase
          .from('journal_entries')
          .select('*');
          
        if (error) {
          console.error('Error fetching journal entries:', error);
          toast.error('Failed to load journal entries');
          setJournalEntries([]);
          return;
        }

        console.log('Journal entries fetched:', entriesData?.length || 0);

        if (!entriesData || entriesData.length === 0) {
          setJournalEntries([]);
          return;
        }

        // Filter entries the user should see (their own or public)
        const visibleEntries = entriesData.filter((entry: any) => 
          entry.user_id === user.id || entry.is_public
        );
        
        const publicEntries: TimelineJournalEntry[] = visibleEntries.filter((e: any) => e.is_public);
        const publicUserIds = [...new Set(publicEntries.map(e => e.user_id).filter((uid) => uid && uid !== user.id))];
        
        let userMap: Record<string, string> = {};
        if (publicUserIds.length > 0) {
          const { data: userRows } = await supabase
            .from('users')
            .select('id, name')
            .in('id', publicUserIds);

          if (userRows) {
            userMap = userRows.reduce((acc: Record<string, string>, u: any) => {
              acc[u.id] = u.name;
              return acc;
            }, {});
          }
        }

        const entriesWithAuthors = visibleEntries.map((entry: any) => {
          if (entry.is_public) {
            return {
              ...entry,
              author_name: entry.user_id === user.id ? null : userMap[entry.user_id] || "Unknown",
            };
          }
          return entry;
        });

        setJournalEntries(entriesWithAuthors);
      } catch (err) {
        console.error('Failed to fetch journal entries:', err);
        toast.error('Failed to load journal entries');
      } finally {
        setLoading(false);
      }
    }
    
    fetchJournalEntries();
  }, [user]);

  // Use the helper utility:
  const timelineData = buildTimelineData({
    tasks,
    projects,
    teamMembers,
    journalEntries,
  });

  return (
    <div className="min-h-screen pb-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Timeline</h1>
        <p className="text-muted-foreground text-sm">
          A chronological view of completed tasks, projects, and journal entries
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : timelineData.length > 0 ? (
        <Timeline data={timelineData} />
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <p className="text-muted-foreground">No timeline data available yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Complete tasks, finish projects or create journal entries to see them here.</p>
        </div>
      )}
    </div>
  );
};

export default TimelinePage;
