import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, 
  FileText, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Calendar,
  User
} from 'lucide-react';
import { useEnhancedRequests } from '@/hooks/useEnhancedRequests';
import { useAuth } from '@/contexts/AuthContext';
import EnhancedRequestDetails from '@/components/requests/EnhancedRequestDetails';
import { Request } from '@/types/requests';
import { format } from 'date-fns';

export const ManagerRequestsDashboard: React.FC = () => {
  const { requests, updateRequestStatus } = useEnhancedRequests();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter requests that need manager approval
  const pendingRequests = requests.filter(request => 
    request.status === 'submitted' && 
    request.request_type?.category === 'time_tracking'
  );

  const timeEntryCorrectionRequests = requests.filter(request =>
    request.request_type?.name === 'Time Entry Correction'
  );

  const otherRequests = requests.filter(request => 
    request.status === 'submitted' && 
    request.request_type?.category !== 'time_tracking'
  );

  const handleApprove = async (requestId: string) => {
    try {
      await updateRequestStatus(requestId, 'approved');
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await updateRequestStatus(requestId, 'rejected');
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const RequestCard: React.FC<{ request: Request }> = ({ request }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
      setSelectedRequest(request);
      setDetailsOpen(true);
    }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold">{request.title}</h4>
            {request.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {request.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            <Badge className={getPriorityColor(request.priority)}>
              {request.priority}
            </Badge>
            <Badge className={getStatusColor(request.status)}>
              {request.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {request.requested_by_user?.name || 'Unknown'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(request.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={(e) => {
              e.stopPropagation();
              handleApprove(request.id);
            }}>
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={(e) => {
              e.stopPropagation();
              handleReject(request.id);
            }}>
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Manager Dashboard</h2>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Corrections</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeEntryCorrectionRequests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{otherRequests.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time-corrections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time-corrections" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Corrections ({timeEntryCorrectionRequests.length})
          </TabsTrigger>
          <TabsTrigger value="other-requests" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Other Requests ({otherRequests.length})
          </TabsTrigger>
          <TabsTrigger value="all-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Requests ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time-corrections" className="space-y-4">
          {timeEntryCorrectionRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No time entry correction requests pending.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {timeEntryCorrectionRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="other-requests" className="space-y-4">
          {otherRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No other requests pending approval.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {otherRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all-requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No requests to review.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <EnhancedRequestDetails 
              request={selectedRequest} 
              onClose={() => setDetailsOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerRequestsDashboard;