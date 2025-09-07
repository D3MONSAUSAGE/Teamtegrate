import React, { useMemo, useState } from 'react';
import { format, startOfDay, endOfDay, startOfWeek, addDays } from 'date-fns';
import { CalendarIcon, Pencil, Plus, Trash2, FileText, Calendar as CalendarViewIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { WeekPicker } from '@/components/ui/week-picker';
import EditTimeEntryDialog from './EditTimeEntryDialog';
import { EnhancedTimeEntryCorrectionForm } from './EnhancedTimeEntryCorrectionForm';
import { useTimeEntriesAdmin } from '@/hooks/useTimeEntriesAdmin';
import { useTimeEntryCorrectionRequests } from '@/hooks/useTimeEntryCorrectionRequests';

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
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [selectedEmptyDays, setSelectedEmptyDays] = useState<Set<string>>(new Set());
  const [correctionFormOpen, setCorrectionFormOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'entries' | 'requests'>('entries');
  const [displayMode, setDisplayMode] = useState<'daily' | 'weekly'>('daily');

  const { 
    currentUserId,
    canManageOthers,
    isManager,
    isAdminOrSuperAdmin,
    users,
    targetUserId,
    setTargetUserId,
    selectedTeamId,
    setSelectedTeamId,
    teams,
    entries,
    isLoading,
    refresh,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useTimeEntriesAdmin();

  const { createCorrectionRequest } = useTimeEntryCorrectionRequests();

  const dayStart = useMemo(() => startOfDay(date), [date]);
  const dayEnd = useMemo(() => endOfDay(date), [date]);
  
  // Weekly view calculations
  const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = useMemo(() => endOfDay(weekDays[6]), [weekDays]);

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

  const handleSelectEntry = (entryId: string, checked: boolean) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(entryId);
      } else {
        newSet.delete(entryId);
      }
      return newSet;
    });
  };

  const handleSelectEmptyDay = (dayString: string, checked: boolean) => {
    setSelectedEmptyDays(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(dayString);
      } else {
        newSet.delete(dayString);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (displayMode === 'weekly') {
      if (checked) {
        // Select all entries
        setSelectedEntries(new Set(entries.map(e => e.id)));
        // Select all empty days (days with no entries)
        const emptyDays = weekDays.filter(day => getDayEntries(day).length === 0)
          .map(day => format(day, 'yyyy-MM-dd'));
        setSelectedEmptyDays(new Set(emptyDays));
      } else {
        setSelectedEntries(new Set());
        setSelectedEmptyDays(new Set());
      }
    } else {
      if (checked) {
        setSelectedEntries(new Set(entries.map(e => e.id)));
      } else {
        setSelectedEntries(new Set());
      }
    }
  };

  const handleCorrectionSubmit = async (correctionData: any) => {
    await createCorrectionRequest(correctionData);
    setSelectedEntries(new Set());
    setSelectedEmptyDays(new Set());
  };

  const selectedEntriesArray = entries.filter(e => selectedEntries.has(e.id));

  // Get entries for a specific day in weekly view
  const getDayEntries = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    return entries.filter(entry => {
      const entryDate = format(new Date(entry.clock_in), 'yyyy-MM-dd');
      return entryDate === formattedDate;
    }).sort((a, b) => new Date(a.clock_in).getTime() - new Date(b.clock_in).getTime());
  };

  // Refresh when date or target user changes
  React.useEffect(() => {
    if (targetUserId) {
      if (displayMode === 'daily') {
        refresh(targetUserId, dayStart, dayEnd);
      } else {
        refresh(targetUserId, startOfDay(weekStart), weekEnd);
      }
    }
  }, [targetUserId, dayStart, dayEnd, weekStart, weekEnd, displayMode, refresh]);

  return (
    <div className="space-y-6">
      {/* Primary Header - View Mode Selection */}
      <div className="bg-gradient-to-r from-background via-background to-accent/5 border border-border/50 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Time Management</h1>
            <p className="text-muted-foreground text-sm">
              {viewMode === 'entries' 
                ? 'View and manage time entries for your team' 
                : 'Track your time correction requests'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'entries' ? 'default' : 'outline'}
              size="default"
              onClick={() => setViewMode('entries')}
              className="min-w-[120px]"
            >
              <Clock className="h-4 w-4 mr-2" />
              Time Entries
            </Button>
            <Button
              variant={viewMode === 'requests' ? 'default' : 'outline'}
              size="default"
              onClick={() => setViewMode('requests')}
              className="min-w-[120px]"
            >
              <FileText className="h-4 w-4 mr-2" />
              My Requests
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'entries' && (
        <>
          {/* Filter Controls Section */}
          <Card className="p-6 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <div className="space-y-6">
              {/* View Mode and Date Selection */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    View Options
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={displayMode === 'daily' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('daily')}
                      className="min-w-[100px]"
                    >
                      <CalendarViewIcon className="h-4 w-4 mr-2" />
                      Daily
                    </Button>
                    <Button
                      variant={displayMode === 'weekly' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayMode('weekly')}
                      className="min-w-[100px]"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Weekly
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Date Range
                  </h3>
                  {displayMode === 'daily' ? (
                    <DatePicker date={date} setDate={setDate} />
                  ) : (
                    <WeekPicker selectedWeek={date} onWeekChange={setDate} />
                  )}
                </div>
              </div>

              {/* Team and User Selection */}
              {canManageOthers && (
                <div className="pt-4 border-t border-border/50">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {isAdminOrSuperAdmin && (
                      <div className="space-y-3 flex-1">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Team Filter
                        </h3>
                        <Select value={selectedTeamId ?? 'all'} onValueChange={(v) => setSelectedTeamId(v === 'all' ? null : v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Teams" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                            <SelectItem value="all">
                              <span className="font-medium">All Teams</span>
                            </SelectItem>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="space-y-3 flex-1">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {isManager ? 'Team Member' : 'Employee'}
                      </h3>
                      <Select value={targetUserId ?? undefined} onValueChange={(v) => setTargetUserId(v)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={isManager ? "Select team member" : "Select employee"} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover/95 backdrop-blur-sm border-border/50">
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              <div className="flex flex-col py-1">
                                <span className="font-medium">{u.name || u.email}</span>
                                <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-border/50">
                <div className="flex items-center gap-3">
                  {(selectedEntries.size > 0 || selectedEmptyDays.size > 0) && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCorrectionFormOpen(true)}
                      className="shadow-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Request Correction ({selectedEntries.size + selectedEmptyDays.size})
                    </Button>
                  )}
                </div>
                
                {canManageOthers && (
                  <Button variant="default" onClick={onAdd} className="shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Content Area */}
          <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <div className="p-6">
              {displayMode === 'daily' ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-foreground">
                        {format(date, 'EEEE, MMMM d, yyyy')}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Daily time entries
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {entries.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedEntries.size === entries.length && entries.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-sm text-muted-foreground">Select All</span>
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-sm text-muted-foreground">Loading…</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  {entries.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        No time entries found for this date
                      </p>
                      {canManageOthers && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={onAdd}
                          className="mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Entry
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {entries.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={selectedEntries.has(e.id)}
                              onCheckedChange={(checked) => handleSelectEntry(e.id, !!checked)}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-foreground">
                                  {formatTime(e.clock_in)} — {formatTime(e.clock_out)}
                                </span>
                                <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                                <span className="font-medium text-primary">
                                  {minutesToHM(e.duration_minutes)}
                                </span>
                              </div>
                              {e.notes && (
                                <p className="text-sm text-muted-foreground">
                                  {e.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          {canManageOthers && (
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => onEdit(e.id)}>
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(e.id)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-foreground">
                        Week of {format(weekStart, 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Weekly time entries
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {(entries.length > 0 || weekDays.some(day => getDayEntries(day).length === 0)) && (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={
                              displayMode === 'weekly' 
                                ? selectedEntries.size === entries.length && 
                                  selectedEmptyDays.size === weekDays.filter(day => getDayEntries(day).length === 0).length &&
                                  (entries.length > 0 || weekDays.some(day => getDayEntries(day).length === 0))
                                : selectedEntries.size === entries.length && entries.length > 0
                            }
                            onCheckedChange={handleSelectAll}
                          />
                          <span className="text-sm text-muted-foreground">Select All</span>
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-sm text-muted-foreground">Loading…</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Weekly view bulk actions */}
                  {(selectedEntries.size > 0 || selectedEmptyDays.size > 0) && (
                    <div className="p-4 bg-accent/20 rounded-lg border-2 border-dashed border-accent/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {selectedEntries.size + selectedEmptyDays.size} item{selectedEntries.size + selectedEmptyDays.size !== 1 ? 's' : ''} selected
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({selectedEntries.size} entries, {selectedEmptyDays.size} empty days)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedEntries(new Set());
                              setSelectedEmptyDays(new Set());
                            }}
                          >
                            Clear Selection
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => setCorrectionFormOpen(true)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Request Correction
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {weekDays.map((day, index) => {
                      const dayEntries = getDayEntries(day);
                      const dayName = format(day, 'EEEE');
                      const dayDate = format(day, 'MMM d');
                      
                      return (
                        <div key={index} className="border border-border/50 rounded-lg p-5 bg-background/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-base">{dayName}</h3>
                              <span className="text-sm text-muted-foreground">{dayDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {dayEntries.length === 0 ? (
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={selectedEmptyDays.has(format(day, 'yyyy-MM-dd'))}
                                    onCheckedChange={(checked) => 
                                      handleSelectEmptyDay(format(day, 'yyyy-MM-dd'), !!checked)
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground">Select empty day</span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {dayEntries.length} entr{dayEntries.length !== 1 ? 'ies' : 'y'}
                                </span>
                              )}
                            </div>
                          </div>

                          {dayEntries.length === 0 ? (
                            <div className="py-8 text-center">
                              <div className="mx-auto w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mb-3">
                                <Clock className="h-6 w-6 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground">No entries for this day</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {dayEntries.map(e => (
                                <div key={e.id} className="flex items-center justify-between p-3 rounded-md border border-border/30 bg-card/30">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      checked={selectedEntries.has(e.id)}
                                      onCheckedChange={(checked) => handleSelectEntry(e.id, !!checked)}
                                    />
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-3">
                                        <span className="font-medium text-foreground">
                                          {formatTime(e.clock_in)} — {formatTime(e.clock_out)}
                                        </span>
                                        <div className="h-1 w-1 bg-muted-foreground rounded-full" />
                                        <span className="font-medium text-primary">
                                          {minutesToHM(e.duration_minutes)}
                                        </span>
                                      </div>
                                      {e.notes && (
                                        <p className="text-xs text-muted-foreground">
                                          {e.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {canManageOthers && (
                                    <div className="flex items-center gap-2">
                                      <Button size="sm" variant="outline" onClick={() => onEdit(e.id)}>
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleDelete(e.id)}>
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {viewMode === 'requests' && (
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="py-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Time correction requests will be displayed here
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <EditTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={date}
        initialEntry={selectedEntry}
        onSave={handleSave}
      />

      <EnhancedTimeEntryCorrectionForm
        open={correctionFormOpen}
        onOpenChange={setCorrectionFormOpen}
        selectedEntries={selectedEntriesArray}
        selectedEmptyDays={Array.from(selectedEmptyDays)}
        onSubmit={() => setCorrectionFormOpen(false)}
      />
    </div>
  );
};

export default PastTimeEntriesManager;