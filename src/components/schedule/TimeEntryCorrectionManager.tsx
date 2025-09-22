import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileEdit, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  MoreVertical
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTimeEntryCorrectionRequests, CorrectionRequest } from '@/hooks/useTimeEntryCorrectionRequests';
import { format } from 'date-fns';

interface TimeEntryCorrectionManagerProps {
  className?: string;
}

export const TimeEntryCorrectionManager: React.FC<TimeEntryCorrectionManagerProps> = ({
  className = '',
}) => {
  const { myRequests, corrections, isLoading } = useTimeEntryCorrectionRequests();
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null);

  const getStatusBadge = (status: CorrectionRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>;
      case 'manager_approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Manager Approved
        </Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Approved
        </Badge>;
      case 'rejected':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusColor = (status: CorrectionRequest['status']) => {
    switch (status) {
      case 'pending':
        return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-950/20';
      case 'manager_approved':
        return 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20';
      case 'approved':
        return 'border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent dark:from-green-950/20';
      case 'rejected':
        return 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/20';
      default:
        return 'border-l-gray-500 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-gray-950/20';
    }
  };

  if (myRequests.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileEdit className="h-5 w-5" />
          My Correction Requests
        </CardTitle>
        <CardDescription>
          Track the status of your time entry correction requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {myRequests.map((request) => {
          const requestCorrections = corrections[request.id] || [];
          
          return (
            <div
              key={request.id}
              className={`group relative p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-sm hover:scale-[1.01] cursor-pointer ${getStatusColor(request.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-foreground/90">
                        Request #{request.id.slice(-8)}
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <strong>Reason:</strong> {request.employee_reason}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {requestCorrections.length} entries
                    </div>
                    {request.manager_reviewed_at && (
                      <div>
                        Manager reviewed: {format(new Date(request.manager_reviewed_at), 'MMM d')}
                      </div>
                    )}
                    {request.admin_reviewed_at && (
                      <div>
                        Admin reviewed: {format(new Date(request.admin_reviewed_at), 'MMM d')}
                      </div>
                    )}
                  </div>

                  {request.manager_notes && (
                    <div className="text-xs p-2 bg-muted/50 rounded border">
                      <strong>Manager Notes:</strong> {request.manager_notes}
                    </div>
                  )}

                  {request.admin_notes && (
                    <div className="text-xs p-2 bg-muted/50 rounded border">
                      <strong>Admin Notes:</strong> {request.admin_notes}
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedRequest(request)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};