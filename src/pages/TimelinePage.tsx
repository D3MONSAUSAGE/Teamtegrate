
import React, { useEffect, useState } from 'react';
import { useTask } from '@/contexts/task';
import { Timeline } from "@/components/ui/timeline";
import useTeamMembers from '@/hooks/useTeamMembers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";
import { buildTimelineData } from "@/utils/buildTimelineData";

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

  useEffect(() => {
    async function fetchJournalEntries() {
      if (!user) return;
      const { data: entriesData, error } = await supabase
        .from('journal_entries')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (!entriesData || entriesData.length === 0) {
        setJournalEntries([]);
        return;
      }

      const publicEntries: TimelineJournalEntry[] = entriesData.filter((e: any) => e.is_public);
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

      const entriesWithAuthors = entriesData.map((entry: any) => {
        if (entry.is_public) {
          return {
            ...entry,
            author_name: entry.user_id === user.id ? null : userMap[entry.user_id] || "Unknown",
          };
        }
        return entry;
      });

      setJournalEntries(entriesWithAuthors);
    }
    fetchJournalEntries();
  }, [user]);

  // Use the new helper utility:
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
      <Timeline data={timelineData} />
    </div>
  );
};

export default TimelinePage;
