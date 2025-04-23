
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import JournalEntryList from "@/components/journal/JournalEntryList";
import { toast } from "sonner";

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
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Journal / Log</h1>
      <JournalEntryForm onSaved={fetchEntries} />
      <JournalEntryList entries={entries} isLoading={isLoading} onChange={fetchEntries} />
    </div>
  );
};

export default JournalPage;
