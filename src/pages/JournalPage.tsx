
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import JournalEntryList from "@/components/journal/JournalEntryList";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const JournalPage = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
    } else {
      setEntries(data as JournalEntry[]);
    }
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
            <span>Journal / Log</span>
            <span className="text-base font-normal text-muted-foreground ml-1 hidden sm:inline">Share thoughts, plans, and milestones</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <JournalEntryForm onSaved={fetchEntries} />
        </CardContent>
      </Card>
      <Card className="card card-hover animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <JournalEntryList entries={entries} isLoading={isLoading} onChange={fetchEntries} />
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalPage;
