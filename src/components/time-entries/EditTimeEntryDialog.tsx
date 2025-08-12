import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import TimeSelector from '@/components/ui/time-selector';
import { format } from 'date-fns';

export interface EditTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate: Date;
  initialEntry?: {
    id: string;
    clock_in: string;
    clock_out?: string | null;
    notes?: string | null;
  } | null;
  onSave: (data: { clock_in: string; clock_out?: string | null; notes?: string }) => void | Promise<void>;
}

const toHHmm = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const combineDateAndTime = (date: Date, hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d.toISOString();
};

const EditTimeEntryDialog: React.FC<EditTimeEntryDialogProps> = ({
  open,
  onOpenChange,
  initialDate,
  initialEntry,
  onSave,
}) => {
  const isEditing = !!initialEntry;
  const [inTime, setInTime] = React.useState<string>('');
  const [outTime, setOutTime] = React.useState<string>('');
  const [notes, setNotes] = React.useState<string>('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setInTime(toHHmm(initialEntry?.clock_in) || '');
    setOutTime(toHHmm(initialEntry?.clock_out || null) || '');
    setNotes(initialEntry?.notes || '');
  }, [initialEntry]);

  const handleSubmit = async () => {
    if (!inTime) return;
    const clock_in = combineDateAndTime(initialDate, inTime);
    const clock_out = outTime ? combineDateAndTime(initialDate, outTime) : null;
    setSaving(true);
    try {
      await onSave({ clock_in, clock_out, notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Time Entry' : 'Add Time Entry'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Work Date</Label>
            <Input value={format(initialDate, 'PPP')} readOnly />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Clock In</Label>
              <TimeSelector value={inTime} onChange={setInTime} placeholder="HH:mm" />
            </div>
            <div>
              <Label>Clock Out (optional)</Label>
              <TimeSelector value={outTime} onChange={setOutTime} placeholder="HH:mm" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !inTime}>
            {isEditing ? 'Save Changes' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTimeEntryDialog;
