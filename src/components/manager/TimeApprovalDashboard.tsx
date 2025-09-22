import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { TimeEntryApprovalCard } from './TimeEntryApprovalCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatHoursMinutes } from '@/utils/timeUtils';

interface TimeEntry {
  id: string;
  user_id: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  clock_in: string;
  clock_out: string;
  duration_minutes: number;
  notes?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  team_id?: string;
}

interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalHours: number;
}

export const TimeApprovalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [stats, setStats] = useState<ApprovalStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalHours: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pending');

  const fetchTimeEntries = async () => {
    if (!user?.organizationId) return;

    try {
      setIsLoading(true);
      
      // Fetch time entries that need approval
      const { data: timeEntries, error } = await supabase
        .from('time_entries')
        .select(`
          id,
          user_id,
          clock_in,
          clock_out,
          duration_minutes,
          notes,
          approval_status,
          approved_by,
          approved_at,
          team_id,
          users:user_id (
            name,
            email,
            avatar_url
          )
        `)
        .eq('organization_id', user.organizationId)
        .not('clock_out', 'is', null)
        .order('clock_out', { ascending: false })
        .limit(100);

      if (error) throw error;

      const entriesWithUsers = timeEntries?.map(entry => ({
        ...entry,
        user: entry.users as any
      })) || [];

      setEntries(entriesWithUsers);

      // Calculate stats
      const newStats = entriesWithUsers.reduce((acc, entry) => {
        acc.total++;
        acc[entry.approval_status]++;
        acc.totalHours += entry.duration_minutes;
        return acc;
      }, {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalHours: 0
      });

      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch time entries:', error);
      toast.error('Failed to load time entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeEntries();
  }, [user?.organizationId]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchQuery || 
      entry.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingEntries = filteredEntries.filter(e => e.approval_status === 'pending');
  const approvedEntries = filteredEntries.filter(e => e.approval_status === 'approved');
  const rejectedEntries = filteredEntries.filter(e => e.approval_status === 'rejected');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Entry Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve employee time entries
          </p>
        </div>
        <Button onClick={fetchTimeEntries} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by employee name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Time Entries Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pending
            {pendingEntries.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingEntries.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingEntries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No pending approvals</p>
                <p className="text-muted-foreground">
                  All time entries have been reviewed
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingEntries.map(entry => (
              <TimeEntryApprovalCard
                key={entry.id}
                entry={entry}
                onApprovalChange={fetchTimeEntries}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedEntries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No approved entries</p>
                <p className="text-muted-foreground">
                  Approved time entries will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            approvedEntries.map(entry => (
              <TimeEntryApprovalCard
                key={entry.id}
                entry={entry}
                onApprovalChange={fetchTimeEntries}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedEntries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No rejected entries</p>
                <p className="text-muted-foreground">
                  Rejected time entries will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            rejectedEntries.map(entry => (
              <TimeEntryApprovalCard
                key={entry.id}
                entry={entry}
                onApprovalChange={fetchTimeEntries}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};