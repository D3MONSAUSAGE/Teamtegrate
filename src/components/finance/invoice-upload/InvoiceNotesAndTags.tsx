import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';
import { StickyNote, Tags } from "lucide-react";

interface InvoiceNotesAndTagsProps {
  notes: string;
  setNotes: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  isDisabled?: boolean;
}

export const InvoiceNotesAndTags: React.FC<InvoiceNotesAndTagsProps> = ({
  notes,
  setNotes,
  tags,
  setTags,
  isDisabled
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* Notes */}
      <div className="grid gap-2">
        <Label htmlFor="notes" className={cn("flex items-center gap-2", isMobile ? "text-base font-semibold" : "text-sm font-medium")}>
          <StickyNote className="h-4 w-4" />
          Internal Notes
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any internal notes about this invoice..."
          className={cn("border-2 resize-none", isMobile ? "text-lg min-h-24" : "min-h-20")}
          disabled={isDisabled}
        />
      </div>

      {/* Tags */}
      <div className="grid gap-2">
        <Label htmlFor="tags" className={cn("flex items-center gap-2", isMobile ? "text-base font-semibold" : "text-sm font-medium")}>
          <Tags className="h-4 w-4" />
          Tags
        </Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Separate tags with commas (e.g., urgent, recurring, office supplies)"
          className={cn("border-2", isMobile ? "h-14 text-lg" : "h-10")}
          disabled={isDisabled}
        />
        <p className="text-xs text-muted-foreground">
          Use tags for flexible categorization and easy searching
        </p>
      </div>
    </div>
  );
};
