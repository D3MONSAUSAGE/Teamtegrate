
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NotebookEntryFormProps {
  onSaved: () => void;
}

const NotebookEntryForm: React.FC<NotebookEntryFormProps> = ({ onSaved }) => {
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
      toast.success("Notebook entry created");
      setTitle("");
      setContent("");
      setIsPublic(false);
      onSaved();
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 animate-fade-in"
      style={{ maxWidth: 520 }}
      autoComplete="off"
    >
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={100}
        required
        className="shadow-inner bg-white/80 dark:bg-[#21283a]/80 border-2 border-accent focus:border-primary/60 focus:ring-primary/20 transition text-lg font-semibold"
      />
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        required
        className="shadow-inner bg-white/75 dark:bg-[#181928]/60 border-2 border-accent focus:border-primary/60 focus:ring-primary/20 transition"
      />
      <div className="flex items-center gap-3 select-none pt-2">
        <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
        <label htmlFor="isPublic" className="text-sm">
          <span>Make this entry </span>
          <span
            className={
              isPublic
                ? "text-emerald-700 font-semibold dark:text-emerald-300"
                : "text-muted-foreground"
            }
          >
            {isPublic ? "Public (team visible)" : "Personal (only you)"}
          </span>
        </label>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-primary focus:ring-2 focus:ring-primary/40"
      >
        Add Entry
      </Button>
    </form>
  );
};

export default NotebookEntryForm;
