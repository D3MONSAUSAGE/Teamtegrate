import React, { useState, useEffect } from 'react';
import { Download, Filter, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { exportTimeEntriesToPayroll, generateExportSummary, TimeEntryForExport } from '@/utils/payrollExportUtils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TimeEntryExportButtonProps {
  startDate: Date;
  endDate: Date;
  userId?: string | null;
  teamId?: string | null;
  disabled?: boolean;
}

export const TimeEntryExportButton: React.FC<TimeEntryExportButtonProps> = ({
  startDate,
  endDate,
  userId,
  teamId,
  disabled = false,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [entries, setEntries] = useState<TimeEntryForExport[]>([]);
  const [filters, setFilters] = useState({
    approvedOnly: true,
    includeRejected: false,
    includePending: false,
  });

  // Fetch full time entry data with joins when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchFullData = async () => {
      setIsLoadingData(true);
      try {
        let query = supabase
          .from('time_entries')
          .select(`
            id,
            user_id,
            clock_in,
            clock_out,
            duration_minutes,
            approval_status,
            approved_by,
            approved_at,
            approval_notes,
            labor_cost,
            notes,
            team_id
          `)
          .gte('clock_in', startDate.toISOString())
          .lte('clock_in', endDate.toISOString())
          .order('clock_in', { ascending: true });

        // Apply filters
        if (userId) {
          query = query.eq('user_id', userId);
        }
        if (teamId) {
          query = query.eq('team_id', teamId);
        }

        const { data: timeEntries, error } = await query;
        
        if (error) throw error;
        
        if (!timeEntries || timeEntries.length === 0) {
          setEntries([]);
          setIsLoadingData(false);
          return;
        }

        // Fetch related user data
        const userIds = Array.from(new Set(timeEntries.map(e => e.user_id)));
        const approverIds = Array.from(new Set(timeEntries.map(e => e.approved_by).filter(Boolean)));
        const teamIds = Array.from(new Set(timeEntries.map(e => e.team_id).filter(Boolean)));

        const [usersData, approversData, teamsData] = await Promise.all([
          supabase
            .from('users')
            .select('id, name, email, employee_id, hourly_rate')
            .in('id', userIds),
          approverIds.length > 0
            ? supabase.from('users').select('id, name').in('id', approverIds as string[])
            : Promise.resolve({ data: [] }),
          teamIds.length > 0
            ? supabase.from('teams').select('id, name').in('id', teamIds as string[])
            : Promise.resolve({ data: [] }),
        ]);

        // Create lookup maps
        const usersMap = new Map(usersData.data?.map(u => [u.id, u] as const) || []);
        const approversMap = new Map(approversData.data?.map(a => [a.id, a] as const) || []);
        const teamsMap = new Map(teamsData.data?.map(t => [t.id, t] as const) || []);

        // Combine data
        const enrichedEntries: TimeEntryForExport[] = timeEntries.map(entry => ({
          ...entry,
          user: usersMap.get(entry.user_id) as any,
          approver: entry.approved_by ? (approversMap.get(entry.approved_by) as any) : undefined,
          team: entry.team_id ? (teamsMap.get(entry.team_id) as any) : undefined,
        }));
        
        setEntries(enrichedEntries);
      } catch (error) {
        console.error('Failed to fetch time entries:', error);
        toast({
          title: 'Failed to load data',
          description: 'Could not fetch time entries. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchFullData();
  }, [isOpen, startDate, endDate, userId, teamId, toast]);

  // Filter entries based on selection
  const getFilteredEntries = (): TimeEntryForExport[] => {
    let filtered = [...entries];

    if (filters.approvedOnly) {
      filtered = filtered.filter(e => e.approval_status === 'approved');
    } else {
      // If not approved only, apply individual filters
      filtered = filtered.filter(e => {
        if (e.approval_status === 'approved') return true;
        if (e.approval_status === 'pending' && filters.includePending) return true;
        if (e.approval_status === 'rejected' && filters.includeRejected) return true;
        return false;
      });
    }

    return filtered;
  };

  const filteredEntries = getFilteredEntries();
  const summary = !isLoadingData && entries.length > 0 ? generateExportSummary(filteredEntries) : null;

  const handleExport = () => {
    try {
      if (filteredEntries.length === 0) {
        toast({
          title: 'No entries to export',
          description: 'Please adjust your filters or add time entries.',
          variant: 'destructive',
        });
        return;
      }

      exportTimeEntriesToPayroll(filteredEntries);
      
      toast({
        title: 'Export successful',
        description: `Exported ${filteredEntries.length} time entries for payroll.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="shadow-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export for Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Time Entries for Payroll</DialogTitle>
          <DialogDescription>
            Export time entries in CSV format compatible with payroll systems (ADP, QuickBooks, Paychex, etc.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading time entries...</p>
            </div>
          ) : (
            <>
              {/* Export Filters */}
              <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Export Filters
              </Label>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="approvedOnly"
                  checked={filters.approvedOnly}
                  onCheckedChange={(checked) =>
                    setFilters({
                      approvedOnly: !!checked,
                      includeRejected: false,
                      includePending: false,
                    })
                  }
                />
                <label
                  htmlFor="approvedOnly"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Approved entries only (Recommended)
                  </div>
                </label>
              </div>

              {!filters.approvedOnly && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePending"
                      checked={filters.includePending}
                      onCheckedChange={(checked) =>
                        setFilters(prev => ({ ...prev, includePending: !!checked }))
                      }
                    />
                    <label
                      htmlFor="includePending"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Include pending entries
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRejected"
                      checked={filters.includeRejected}
                      onCheckedChange={(checked) =>
                        setFilters(prev => ({ ...prev, includeRejected: !!checked }))
                      }
                    />
                    <label
                      htmlFor="includeRejected"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Include rejected entries
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Export Summary */}
          {summary && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h4 className="font-medium text-sm">Export Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Entries:</span>
                  <span className="ml-2 font-semibold">{summary.totalEntries}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Hours:</span>
                  <span className="ml-2 font-semibold">{summary.totalHours}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Regular Hours:</span>
                  <span className="ml-2 font-semibold">{summary.regularHours}h</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Overtime:</span>
                  <span className="ml-2 font-semibold text-amber-600">{summary.overtimeHours}h</span>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <span className="text-muted-foreground">Total Labor Cost:</span>
                  <span className="ml-2 font-semibold text-lg">${summary.totalLaborCost}</span>
                </div>
              </div>

              <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                <div>✓ Approved: {summary.approvedEntries}</div>
                {summary.pendingEntries > 0 && <div>⏳ Pending: {summary.pendingEntries}</div>}
                {summary.rejectedEntries > 0 && <div>✗ Rejected: {summary.rejectedEntries}</div>}
              </div>
            </div>
          )}

          {/* Export Info */}
          {!isLoadingData && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 text-sm space-y-2">
              <p className="font-medium">CSV Format Includes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Employee details (Name, ID, Email)</li>
                <li>Time entries (Clock In/Out, Total/Regular/OT Hours)</li>
                <li>Pay calculations (Hourly Rate, Total Pay)</li>
                <li>Approval status and history</li>
              </ul>
            </div>
          )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoadingData || filteredEntries.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export {filteredEntries.length} Entries
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
