import React, { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, User, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Request, PRIORITY_COLORS, STATUS_COLORS } from '@/types/requests';
import RequestDetails from './RequestDetails';
import { useAuth } from '@/contexts/AuthContext';

interface RequestListProps {
  requests: Request[];
  loading?: boolean;
  onRequestUpdated?: () => void;
}

export default function RequestList({ requests, loading, onRequestUpdated }: RequestListProps) {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  const isAssignedToUser = (request: Request) => {
    return request.assigned_to && 
      (request.assigned_to === user?.id || 
       request.assigned_to.split(',').includes(user?.id || ''));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending_acceptance': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded w-16"></div>
                  <div className="h-5 bg-muted rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No requests found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start gap-3">
                  {getStatusIcon(request.status)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg">{request.title}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge className={STATUS_COLORS[request.status]}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={PRIORITY_COLORS[request.priority]}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    {request.description && (
                      <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                        {request.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{request.requested_by_user?.name || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {request.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Due {format(new Date(request.due_date), 'MMM d')}</span>
                    </div>
                  )}

                  {request.accepted_by && request.accepted_by_user && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Accepted by {request.accepted_by_user.name}</span>
                    </div>
                  )}
                </div>

                {isAssignedToUser(request) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 border-blue-200">
                      Assigned to you
                    </Badge>
                    {request.status === 'submitted' && !request.accepted_by && (
                      <Badge variant="outline" className="bg-orange-50 border-orange-200">
                        Awaiting acceptance
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                      <RequestDetails 
                        request={selectedRequest} 
                        onRequestUpdated={onRequestUpdated}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}