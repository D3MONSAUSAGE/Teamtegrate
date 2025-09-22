import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Calendar,
  MessageSquare,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, differenceInHours } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export interface PendingTimeEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  clock_in: string;
  clock_out: string;
  duration_minutes: number;
  notes?: string;
  team_id?: string;
  team_name?: string;
  created_at: string;
  work_date: string;
}

interface TimeEntryApprovalListProps {
  selectedTeamId?: string;
}

export const TimeEntryApprovalList: React.FC<TimeEntryApprovalListProps> = ({ 
  selectedTeamId 
}) => {
  const { user } = useAuth();
  const [pendingEntries, setPendingEntries] = useState<PendingTimeEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [teams, setTeams] = useState<Array<{id: string, name: string}>>([]);

  // Fetch pending time entries
  const fetchPendingEntries = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_time_approvals', {
        manager_user_id: user.id,
        team_filter_id: selectedTeamId || null
      });

      if (error) throw error;

      setPendingEntries(data || []);
    } catch (error) {
      console.error('Error fetching pending entries:', error);
      toast.error('Failed to fetch pending time entries');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch teams for filtering
  const fetchTeams = async () => {
    if (!user?.organizationId) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('organization_id', user.organizationId)
        .eq('is_active', true);

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchPendingEntries();
    fetchTeams();
  }, [user?.id, user?.organizationId, selectedTeamId]);

  // Approve single entry
  const approveEntry = async (entryId: string, notes?: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('manage_time_entry_approval', {
        entry_id: entryId,
        manager_id: user.id,
        new_status: 'approved',
        approval_notes_text: notes || null
      }) as { data: { success?: boolean; error?: string }, error: any };

      if (error) throw error;

      if (data?.success) {
        toast.success('Time entry approved successfully');
        await fetchPendingEntries();
      } else {
        toast.error(data?.error || 'Failed to approve entry');
      }
    } catch (error) {
      console.error('Error approving entry:', error);
      toast.error('Failed to approve time entry');
    }
  };

  // Reject single entry
  const rejectEntry = async (entryId: string, reason: string) => {
    if (!user?.id || !reason.trim()) return;

    try {
      const { data, error } = await supabase.rpc('manage_time_entry_approval', {
        entry_id: entryId,
        manager_id: user.id,
        new_status: 'rejected',
        rejection_reason: reason
      }) as { data: { success?: boolean; error?: string }, error: any };

      if (error) throw error;

      if (data?.success) {
        toast.success('Time entry rejected');
        await fetchPendingEntries();
      } else {
        toast.error(data?.error || 'Failed to reject entry');
      }
    } catch (error) {
      console.error('Error rejecting entry:', error);
      toast.error('Failed to reject time entry');
    }
  };

  // Bulk approve selected entries
  const bulkApprove = async () => {
    if (!user?.id || selectedEntries.length === 0) return;

    try {
      const { data, error } = await supabase.rpc('bulk_approve_time_entries', {
        entry_ids: selectedEntries,
        manager_id: user.id,
        approval_notes_text: approvalNotes || null
      }) as { data: { success?: boolean; error?: string; processed_count?: number }, error: any };

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data?.processed_count || 0} time entries approved successfully`);
        setSelectedEntries([]);
        setApprovalNotes('');
        await fetchPendingEntries();
      } else {
        toast.error(data?.error || 'Failed to bulk approve');
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      toast.error('Failed to bulk approve entries');
    }
  };

  // Toggle entry selection
  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries(prev => 
      prev.includes(entryId) 
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  // Select all entries
  const selectAll = () => {
    const filteredEntries = filterTeam === 'all' 
      ? pendingEntries 
      : pendingEntries.filter(entry => entry.team_id === filterTeam);
    
    const allIds = filteredEntries.map(entry => entry.id);
    setSelectedEntries(
      selectedEntries.length === allIds.length ? [] : allIds
    );
  };

  // Get filtered entries
  const filteredEntries = filterTeam === 'all' 
    ? pendingEntries 
    : pendingEntries.filter(entry => entry.team_id === filterTeam);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Time Entry Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve pending time entries from your team
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Team filter */}
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Bulk actions */}
          {selectedEntries.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedEntries.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Approve Time Entries</DialogTitle>
                  <DialogDescription>
                    Approve {selectedEntries.length} selected time entries
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="bulk-notes">Approval Notes (Optional)</Label>
                    <Textarea
                      id="bulk-notes"
                      placeholder="Add notes for this bulk approval..."
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setApprovalNotes('')}>
                      Cancel
                    </Button>
                    <Button onClick={bulkApprove}>
                      Approve {selectedEntries.length} Entries
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/20">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-semibold">{filteredEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selected</p>
                <p className="text-xl font-semibold">{selectedEntries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent/20">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-xl font-semibold">
                  {new Set(filteredEntries.map(e => e.user_id)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/20">
                <Clock className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-xl font-semibold">
                  {Math.round(filteredEntries.reduce((sum, entry) => sum + entry.duration_minutes, 0) / 60)}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selection controls */}
      {filteredEntries.length > 0 && (
        <div className="flex items-center gap-3 py-2 border-b border-border">
          <Checkbox
            id="select-all"
            checked={selectedEntries.length === filteredEntries.length}
            onCheckedChange={selectAll}
          />
          <Label htmlFor="select-all" className="text-sm">
            Select all {filteredEntries.length} entries
          </Label>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading pending entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
                <p className="text-muted-foreground">
                  All time entries have been reviewed. Great job!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedEntries.includes(entry.id)}
                    onCheckedChange={() => toggleEntrySelection(entry.id)}
                  />
                  
                  <div className="flex-1 space-y-4">
                    {/* Employee info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{entry.user_name}</p>
                          <p className="text-sm text-muted-foreground">{entry.user_email}</p>
                        </div>
                        {entry.team_name && (
                          <Badge variant="secondary">{entry.team_name}</Badge>
                        )}
                      </div>
                      
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>

                    {/* Time details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <p className="font-medium">
                          {format(new Date(entry.work_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Clock In</Label>
                        <p className="font-medium">
                          {format(new Date(entry.clock_in), 'HH:mm')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Clock Out</Label>
                        <p className="font-medium">
                          {format(new Date(entry.clock_out), 'HH:mm')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Duration</Label>
                        <p className="font-medium">{formatDuration(entry.duration_minutes)}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {entry.notes && (
                      <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-accent mt-0.5" />
                          <div>
                            <Label className="text-xs text-muted-foreground">Employee Notes</Label>
                            <p className="text-sm">{entry.notes}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        size="sm" 
                        onClick={() => approveEntry(entry.id)}
                        className="bg-success hover:bg-success/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Time Entry</DialogTitle>
                            <DialogDescription>
                              Provide a reason for rejecting this time entry
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="rejection-reason">Reason for Rejection *</Label>
                              <Textarea
                                id="rejection-reason"
                                placeholder="Please provide a clear reason for rejection..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="mt-1"
                                required
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => setRejectionReason('')}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive"
                                onClick={() => {
                                  rejectEntry(entry.id, rejectionReason);
                                  setRejectionReason('');
                                }}
                                disabled={!rejectionReason.trim()}
                              >
                                Reject Entry
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve with Notes
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Approve with Notes</DialogTitle>
                            <DialogDescription>
                              Add notes to this approval
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="approval-notes">Approval Notes</Label>
                              <Textarea
                                id="approval-notes"
                                placeholder="Add any notes about this approval..."
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                onClick={() => setApprovalNotes('')}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={() => {
                                  approveEntry(entry.id, approvalNotes);
                                  setApprovalNotes('');
                                }}
                              >
                                Approve Entry
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};