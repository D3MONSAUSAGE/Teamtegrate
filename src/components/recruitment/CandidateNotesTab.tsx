import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Plus, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { useRecruitmentNotes } from '@/hooks/recruitment/useRecruitmentNotes';
import { AddNoteDialog } from './AddNoteDialog';
import type { CandidateWithDetails } from '@/types/recruitment';

interface CandidateNotesTabProps {
  candidate: CandidateWithDetails;
}

export function CandidateNotesTab({ candidate }: CandidateNotesTabProps) {
  const { notes, isLoading } = useRecruitmentNotes(candidate.id);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'interview_feedback':
        return 'bg-blue-500';
      case 'red_flag':
        return 'bg-red-500';
      case 'strength':
        return 'bg-green-500';
      case 'question':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const pinnedNotes = notes.filter((note) => note.is_pinned);
  const regularNotes = notes.filter((note) => !note.is_pinned);

  if (isLoading) {
    return <div className="text-center py-8">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Notes</h3>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <StickyNote className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No notes yet</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {pinnedNotes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned Notes
              </h4>
              <div className="grid gap-4">
                {pinnedNotes.map((note) => (
                  <Card key={note.id} className="border-primary">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getNoteTypeColor(note.note_type)}>
                              {note.note_type}
                            </Badge>
                            <Pin className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(note.created_at), 'PPP p')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap">{note.note_content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {pinnedNotes.length > 0 && (
              <h4 className="text-sm font-semibold text-muted-foreground">All Notes</h4>
            )}
            <div className="grid gap-4">
              {regularNotes.map((note) => (
                <Card key={note.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Badge className={getNoteTypeColor(note.note_type)}>
                          {note.note_type}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(note.created_at), 'PPP p')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{note.note_content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <AddNoteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        candidateId={candidate.id}
      />
    </div>
  );
}
