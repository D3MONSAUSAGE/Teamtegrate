import React, { useMemo, useState } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { CalendarIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import EditTimeEntryDialog from './EditTimeEntryDialog';
import { useTimeEntriesAdmin } from '@/hooks/useTimeEntriesAdmin';

const DatePicker = ({ date, setDate }: { date: Date; setDate: (d: Date) => void }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)}
          initialFocus
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
};

const formatTime = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return format(d, 'p');
  } catch {
    return '-';
  }
};

const minutesToHM = (mins?: number | null) => {
  if (!mins && mins !== 0) return '-';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h ${m}m`;
};

const PastTimeEntriesManager: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { 
    currentUserId,
    canManageOthers,
    users,
    targetUserId,
    setTargetUserId,
    entries,
    isLoading,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useTimeEntriesAdmin();

  const dayStart = useMemo(() => startOfDay(date), [date]);
  const dayEnd = useMemo(() => endOfDay(date), [date]);

  const onAdd = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const onEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  const selectedEntry = useMemo(() => entries.find(e => e.id === editingId) || null, [entries, editingId]);

  const handleSave = async (data: { clock_in: string; clock_out?: string | null; notes?: string }) => {
    if (!targetUserId) return;
    if (editingId) {
      await updateEntry(editingId, { clock_in: data.clock_in, clock_out: data.clock_out ?? null, notes: data.notes });
    } else {
      await createEntry({ user_id: targetUserId, clock_in: data.clock_in, clock_out: data.clock_out ?? null, notes: data.notes });
    }
    setDialogOpen(false);
    await refresh(targetUserId, dayStart, dayEnd);
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    await refresh(targetUserId!, dayStart, dayEnd);
  };

  // Refresh when date or target user changes
  React.useEffect(() => {
    if (targetUserId) {
      refresh(targetUserId, dayStart, dayEnd);
    }
  }, [targetUserId, dayStart, dayEnd, refresh]);

  return (
    <section className="space-y-4">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <DatePicker date={date} setDate={setDate} />
          {canManageOthers && (
            <Select value={targetUserId ?? undefined} onValueChange={(v) => setTargetUserId(v)}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onAdd}>
            <Plus className="h-4 w-4 mr-2" /> Add Entry
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Entries for {format(date, 'PPP')}</h2>
          {isLoading && <span className="text-sm text-muted-foreground">Loading…</span>}
        </div>
        <Separator className="my-2" />

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No entries for this day.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-md border">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatTime(e.clock_in)} — {formatTime(e.clock_out)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Duration: {minutesToHM(e.duration_minutes)} {e.notes ? `• ${e.notes}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(e.id)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <EditTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={date}
        initialEntry={selectedEntry}
        onSave={handleSave}
      />
    </section>
  );
};

export default PastTimeEntriesManager;
