
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NotebookEntryForm from "@/components/notebook/NotebookEntryForm";
import NotebookEntryList from "@/components/notebook/NotebookEntryList";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface NotebookEntry {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  author_name?: string | null;
}

const NotebookPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NotebookEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchEntries() {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .or(`user_id.eq.${user.id},is_public.eq.true`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load entries");
      setIsLoading(false);
      return;
    }

    // Find all public entries not by you
    const publicEntries = (data as NotebookEntry[]).filter(
      (e) => e.is_public && e.user_id !== user.id
    );
    const publicUserIds = [
      ...new Set(publicEntries.map((e) => e.user_id).filter(Boolean)),
    ];

    let userMap: Record<string, string> = {};
    if (publicUserIds.length > 0) {
      // Fetch names from users table
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name")
        .in("id", publicUserIds);
      if (usersData) {
        userMap = usersData.reduce(
          (acc: Record<string, string>, u: any) => {
            acc[u.id] = u.name;
            return acc;
          },
          {}
        );
      }
    }

    // Attach author_name to each entry if public and not your own
    const entriesWithAuthors = (data as NotebookEntry[]).map((entry) => {
      if (entry.is_public && entry.user_id !== user.id) {
        return {
          ...entry,
          author_name: userMap[entry.user_id] || "Unknown",
        };
      }
      return entry;
    });

    setEntries(entriesWithAuthors);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line
  }, [user]);

  return (
    <div className="container mx-auto max-w-2xl p-6 flex flex-col gap-8">
      <Card className="card card-hover animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gradient-primary tracking-tight flex items-center gap-2 pb-2">
            <span>Notebook</span>
            <span className="text-base font-normal text-muted-foreground ml-1 hidden sm:inline">Share thoughts, plans, and milestones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NotebookEntryForm onSaved={fetchEntries} />
        </CardContent>
      </Card>
      <Card className="card card-hover animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <NotebookEntryList entries={entries} isLoading={isLoading} onChange={fetchEntries} />
        </CardContent>
      </Card>
    </div>
  );
};

export default NotebookPage;
