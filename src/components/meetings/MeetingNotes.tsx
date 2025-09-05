import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Save, 
  Plus, 
  CheckSquare, 
  Clock,
  User,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MeetingNote {
  id: string;
  content: string;
  type: 'note' | 'action_item' | 'decision';
  timestamp: Date;
  author?: string;
  completed?: boolean;
}

interface MeetingNotesProps {
  meetingId: string;
  isActive?: boolean;
  onActionItemCreate?: (content: string) => void;
  className?: string;
}

export const MeetingNotes: React.FC<MeetingNotesProps> = ({
  meetingId,
  isActive = false,
  onActionItemCreate,
  className
}) => {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'action_item' | 'decision'>('note');
  const [isUnsaved, setIsUnsaved] = useState(false);

  const addNote = () => {
    if (!currentNote.trim()) return;

    const newNote: MeetingNote = {
      id: Date.now().toString(),
      content: currentNote.trim(),
      type: noteType,
      timestamp: new Date(),
      author: 'Current User', // TODO: Get from auth context
      completed: noteType === 'action_item' ? false : undefined
    };

    setNotes(prev => [...prev, newNote]);
    
    // If it's an action item, trigger the callback
    if (noteType === 'action_item' && onActionItemCreate) {
      onActionItemCreate(currentNote.trim());
    }

    setCurrentNote('');
    setIsUnsaved(false);
  };

  const toggleActionItem = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, completed: !note.completed }
        : note
    ));
  };

  const saveNotes = () => {
    // TODO: Implement save to database
    console.log('Saving meeting notes:', { meetingId, notes });
    setIsUnsaved(false);
  };

  useEffect(() => {
    if (currentNote.trim()) {
      setIsUnsaved(true);
    }
  }, [currentNote]);

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'action_item': return CheckSquare;
      case 'decision': return Tag;
      default: return FileText;
    }
  };

  const getNoteColor = (type: string) => {
    switch (type) {
      case 'action_item': return 'bg-primary/10 text-primary border-primary/20';
      case 'decision': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted/10 text-muted-foreground border-muted/20';
    }
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Notes
            {isActive && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Live
              </Badge>
            )}
          </CardTitle>
          {isUnsaved && (
            <Button
              onClick={saveNotes}
              size="sm"
              variant="outline"
              className="gap-1"
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Notes List */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-64">
          {notes.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs">Start taking notes during your meeting</p>
            </div>
          ) : (
            notes.map((note) => {
              const Icon = getNoteIcon(note.type);
              return (
                <div
                  key={note.id}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    note.completed ? 'opacity-60' : '',
                    getNoteColor(note.type)
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <p className={cn(
                        "text-sm", 
                        note.completed ? 'line-through' : ''
                      )}>
                        {note.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs opacity-70">
                        <Clock className="h-3 w-3" />
                        {note.timestamp.toLocaleTimeString()}
                        {note.author && (
                          <>
                            <User className="h-3 w-3" />
                            {note.author}
                          </>
                        )}
                      </div>
                    </div>
                    {note.type === 'action_item' && (
                      <Button
                        onClick={() => toggleActionItem(note.id)}
                        size="sm"
                        variant="ghost"
                        className="p-1 h-auto"
                      >
                        <CheckSquare className={cn(
                          "h-4 w-4",
                          note.completed ? 'text-green-600' : 'text-muted-foreground'
                        )} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Separator />

        {/* Note Input */}
        <div className="space-y-3">
          <div className="flex gap-1">
            {(['note', 'action_item', 'decision'] as const).map((type) => (
              <Button
                key={type}
                onClick={() => setNoteType(type)}
                size="sm"
                variant={noteType === type ? 'default' : 'outline'}
                className="text-xs"
              >
                {type === 'note' && 'Note'}
                {type === 'action_item' && 'Action Item'}
                {type === 'decision' && 'Decision'}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder={`Add a ${noteType.replace('_', ' ')}...`}
              className="flex-1 min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  addNote();
                }
              }}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Press Cmd/Ctrl + Enter to add
            </span>
            <Button
              onClick={addNote}
              disabled={!currentNote.trim()}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Add {noteType === 'note' ? 'Note' : noteType === 'action_item' ? 'Action Item' : 'Decision'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};