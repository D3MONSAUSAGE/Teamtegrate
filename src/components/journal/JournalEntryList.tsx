
import React from "react";
import { JournalEntry } from "@/pages/JournalPage";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JournalEntryListProps {
  entries: JournalEntry[];
  isLoading: boolean;
  onChange: () => void;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({
  entries,
  isLoading,
  onChange
}) => {
  const { user } = useAuth();

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete entry");
    } else {
      toast.success("Deleted");
      onChange();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="text-muted-foreground px-2">Loading entries…</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground px-2">No journal entries.</div>
      ) : (
        entries.map(entry => (
          <div
            key={entry.id}
            className="relative animate-fade-in border-2 border-accent rounded-xl bg-glass p-5 card-hover shadow-[0_2px_14px_-2px_#B6EFD4]/80 transition hover-scale"
          >
            <div className="flex items-center gap-2 text-xs mb-2">
              <span className={entry.is_public
                ? "px-2 py-1 bg-gradient-to-br from-emerald-200 to-lime-100 text-emerald-900 font-semibold rounded-md border border-emerald-200/70"
                : "px-2 py-1 bg-gradient-to-br from-slate-200 to-slate-100 text-slate-600 font-semibold rounded-md border border-slate-200/60"
              }>
                {entry.is_public ? "Public" : "Personal"}
              </span>
              <span className="text-muted-foreground font-mono">
                {new Date(entry.created_at).toLocaleString()}
              </span>
              {/* Show author for public entries */}
              {entry.is_public && entry.user_id !== user?.id && (
                <span className="ml-2 text-foreground font-medium">by {entry.author_name || "Unknown"}</span>
              )}
            </div>
            <h3 className="font-bold text-lg mb-1 text-gradient">{entry.title}</h3>
            <p className="text-base whitespace-pre-line mb-6 text-foreground/80">{entry.content}</p>
            {user && entry.user_id === user.id && (
              <div className="absolute top-3 right-3 flex gap-1 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-rose-50/50 dark:hover:bg-rose-900/40 transition"
                  onClick={() => handleDelete(entry.id)}
                  aria-label="Delete entry"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default JournalEntryList;
