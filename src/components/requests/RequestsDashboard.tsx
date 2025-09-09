import React, { useState, useEffect } from 'react';
import { Request } from '@/types/requests';
import { EnhancedRequestCard } from './EnhancedRequestCard';
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

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user?.organizationId) return;

    try {
      // First get requests without joins
      const { data: requestsData, error } = await supabase
        .from('requests')
        .select('*')
        .eq('organization_id', user.organizationId)
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

      // Map the requests with user data
      const mappedRequests: Request[] = requestsData.map(item => ({
        id: item.id,
        organization_id: item.organization_id,
        request_type_id: item.request_type_id,
        requested_by: item.requested_by,
        title: item.title,
        description: item.description,
        form_data: (item.form_data as Record<string, any>) || {},
        priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
        status: item.status as 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed' | 'cancelled',
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

  const getRequestsByStatus = (status: string) => {
    return requests.filter(request => request.status === status);
  };

  const getMyRequests = () => {
    return requests.filter(request => request.requested_by === user?.id);
  };

  const getAssignedToMe = () => {
    return requests.filter(request => request.assigned_to === user?.id);
  };

  const getOverdueRequests = () => {
    const now = new Date();
    return requests.filter(request => 
      request.due_date && 
      new Date(request.due_date) < now && 
      !['completed', 'cancelled', 'rejected'].includes(request.status)
    );
  };

  const getRequestStats = () => {
    return {
      total: requests.length,
      pending: getRequestsByStatus('submitted').length,
      approved: getRequestsByStatus('approved').length,
      overdue: getOverdueRequests().length,
      myRequests: getMyRequests().length,
      assignedToMe: getAssignedToMe().length
    };
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
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
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
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Requests</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          <TabsTrigger value="mine">My Requests</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {requests.map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {getAssignedToMe().map(request => (
              <EnhancedRequestCard
                key={request.id}
                request={request}
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
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
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
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
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
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
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
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
                onView={onViewRequest}
                onAssign={onAssignRequest}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {requests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No requests found</h3>
            <p className="text-muted-foreground">Create your first request to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};