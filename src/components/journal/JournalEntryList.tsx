
import React from "react";
import { JournalEntry } from "@/pages/JournalPage";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JournalEntryListProps {
  entries: JournalEntry[];
  isLoading: boolean;
  onChange: () => void;
}

const JournalEntryList: React.FC<JournalEntryListProps> = ({ entries, isLoading, onChange }) => {
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
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-muted-foreground">Loading entries…</div>
      ) : entries.length === 0 ? (
        <div className="text-muted-foreground">No journal entries.</div>
      ) : (
        entries.map(entry => (
          <div
            key={entry.id}
            className="bg-card border p-4 rounded-md flex flex-col gap-2 relative"
          >
            <div className="flex items-center gap-2 text-xs mb-1">
              <span className="font-semibold">{entry.is_public ? "Public" : "Personal"}</span>
              <span className="text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </div>
            <h3 className="font-bold text-md">{entry.title}</h3>
            <p className="text-base whitespace-pre-line">{entry.content}</p>
            {user && entry.user_id === user.id && (
              <div className="absolute top-2 right-2 flex gap-1">
                {/* Future: Add edit button <Button size="sm" variant="ghost"><Pencil size={16} /></Button> */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => handleDelete(entry.id)}
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
