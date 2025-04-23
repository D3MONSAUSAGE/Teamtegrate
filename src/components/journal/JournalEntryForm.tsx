
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface JournalEntryFormProps {
  onSaved: () => void;
}

const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onSaved }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Fill in all required fields");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("journal_entries").insert([
      {
        title,
        content,
        is_public: isPublic,
        user_id: user.id,
      },
    ]);
    if (error) {
      toast.error("Could not create entry");
    } else {
      toast.success("Journal entry created");
      setTitle("");
      setContent("");
      setIsPublic(false);
      onSaved();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-card p-4 rounded shadow flex flex-col gap-3">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={100}
        required
      />
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        required
      />
      <div className="flex items-center gap-2">
        <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
        <label htmlFor="isPublic" className="text-sm">
          Make this entry <span className={isPublic ? "text-primary" : "text-muted-foreground"}>{isPublic ? "Public (visible to team)" : "Personal (visible only to you)"}</span>
        </label>
      </div>
      <Button type="submit" disabled={loading}>
        Add Entry
      </Button>
    </form>
  );
};

export default JournalEntryForm;
