import React, { useState, useEffect, useMemo } from 'react';
import { Request, RequestType } from '@/types/requests';
import { EnhancedRequestCard } from './EnhancedRequestCard';
import RequestSearchBar from './RequestSearchBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface RequestSearchFilters {
  search: string;
  status: string;
  priority: string;
  category: string;
  dateRange: string;
}

interface RequestsDashboardProps {
  onViewRequest?: (request: Request) => void;
  onAssignRequest?: (request: Request) => void;
  onStatusChange?: (request: Request, status: string) => void;
}

export const RequestsDashboard: React.FC<RequestsDashboardProps> = ({
  onViewRequest,
  onAssignRequest,
  onStatusChange
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilters, setSearchFilters] = useState<RequestSearchFilters>({
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user?.organizationId) return;

    try {
      // Get requests with request_type data - let RLS handle access control
      // Exclude archived requests by default
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select(`
          *,
          request_type:request_types(id, name, category, subcategory, description)
        `)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then get user details separately to avoid foreign key issues
      const userIds = [...new Set([
        ...requestsData.map(r => r.requested_by),
        ...requestsData.map(r => r.assigned_to).filter(Boolean)
      ])];

      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', userIds);

      const userMap = usersData?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>) || {};

      // Map the requests with user data and request_type
      const mappedRequests: Request[] = requestsData.map(item => ({
        id: item.id,
        organization_id: item.organization_id,
        request_type_id: item.request_type_id,
        request_type: item.request_type as RequestType,
        requested_by: item.requested_by,
        title: item.title,
        description: item.description,
        form_data: (item.form_data as Record<string, any>) || {},
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: item.status as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled',
        due_date: item.due_date,
        submitted_at: item.submitted_at,
        completed_at: item.completed_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        ticket_number: item.ticket_number,
        assigned_to: item.assigned_to,
        assigned_at: item.assigned_at,
        requested_by_user: userMap[item.requested_by] || { id: item.requested_by, name: 'Unknown User', email: '' },
        assigned_to_user: item.assigned_to ? userMap[item.assigned_to] : undefined
      }));

      setRequests(mappedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on search criteria
  const filteredRequests = useMemo(() => {
    if (!requests.length) return [];

    return requests.filter(request => {
      // Text search
      if (searchFilters.search.trim()) {
        const searchTerm = searchFilters.search.toLowerCase().trim();
        const searchableText = [
          request.title,
          request.description,
          request.ticket_number,
          request.requested_by_user?.name
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Status filter
      if (searchFilters.status !== 'all' && request.status !== searchFilters.status) {
        return false;
      }

      // Priority filter
      if (searchFilters.priority !== 'all' && request.priority !== searchFilters.priority) {
        return false;
      }

      // Category filter (assuming request_type has category)
      if (searchFilters.category !== 'all' && request.request_type?.category !== searchFilters.category) {
        return false;
      }

      // Date range filter
      if (searchFilters.dateRange !== 'all') {
        const createdAt = new Date(request.created_at);
        const now = new Date();
        
        switch (searchFilters.dateRange) {
          case 'today':
            if (createdAt.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (createdAt < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (createdAt < monthAgo) return false;
            break;
          case 'quarter':
            const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (createdAt < quarterAgo) return false;
            break;
        }
      }

      return true;
    });
  }, [requests, searchFilters]);

  const getRequestsByStatus = (status: string) => {
    return filteredRequests.filter(request => request.status === status);
  };

  const getMyRequests = () => {
    return filteredRequests.filter(request => request.requested_by === user?.id);
  };

  const getAssignedToMe = () => {
    return filteredRequests.filter(request => request.assigned_to === user?.id);
  };

  const getOverdueRequests = () => {
    const now = new Date();
    return filteredRequests.filter(request => 
      request.due_date && 
      new Date(request.due_date) < now && 
      !['completed', 'cancelled', 'rejected'].includes(request.status)
    );
  };

  const getRequestStats = () => {
    return {
      total: filteredRequests.length,
      pending: getRequestsByStatus('submitted').length,
      inProgress: getRequestsByStatus('in_progress').length,
      approved: getRequestsByStatus('approved').length,
      overdue: getOverdueRequests().length,
      myRequests: getMyRequests().length,
      assignedToMe: getAssignedToMe().length
    };
  };

  const handleRequestDelete = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleRequestArchive = (requestId: string) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const stats = getRequestStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <RequestSearchBar onFiltersChange={setSearchFilters} initialFilters={searchFilters} />
      
      {/* Stats Overview */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${user?.role === 'user' ? 'lg:grid-cols-5' : 'lg:grid-cols-6'} gap-4`}>
        {user?.role !== 'user' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Requests</p>
                <p className="text-2xl font-bold">{stats.myRequests}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold">{stats.assignedToMe}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request Tabs */}
      <Tabs defaultValue={user?.role === 'user' ? 'mine' : 'all'} className="space-y-4">
        <TabsList className={`grid w-full ${user?.role === 'user' ? 'grid-cols-5' : 'grid-cols-6'}`}>
          {user?.role !== 'user' && (
            <TabsTrigger value="all">All Requests</TabsTrigger>
          )}
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          <TabsTrigger value="mine">My Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {user?.role !== 'user' && (
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {filteredRequests.map(request => (
                <EnhancedRequestCard
                  key={request.id}
                  request={request}
                  currentUserId={user?.id}
                  onView={onViewRequest}
                  onAssign={onAssignRequest}
                  onStatusChange={onStatusChange}
                  onDelete={handleRequestDelete}
                  onArchive={handleRequestArchive}
                />
              ))}
            </div>
          </TabsContent>
        )}

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {getAssignedToMe().map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                currentUserId={user?.id}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
                onDelete={handleRequestDelete}
                onArchive={handleRequestArchive}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="space-y-4">
          <div className="grid gap-4">
            {getMyRequests().map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                currentUserId={user?.id}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
                onDelete={handleRequestDelete}
                onArchive={handleRequestArchive}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {getRequestsByStatus('submitted').map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                currentUserId={user?.id}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
                onDelete={handleRequestDelete}
                onArchive={handleRequestArchive}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <div className="grid gap-4">
            {getOverdueRequests().map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                currentUserId={user?.id}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
                onDelete={handleRequestDelete}
                onArchive={handleRequestArchive}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {getRequestsByStatus('completed').map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                currentUserId={user?.id}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
                onDelete={handleRequestDelete}
                onArchive={handleRequestArchive}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {filteredRequests.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground">
              {searchFilters.search || searchFilters.status !== 'all' || searchFilters.priority !== 'all' 
                ? "Try adjusting your search filters."
                : "Create your first request to get started."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};