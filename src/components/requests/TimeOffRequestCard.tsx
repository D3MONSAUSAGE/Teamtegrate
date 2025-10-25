import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { TimeOffRequest } from '@/types/employee';

interface TimeOffRequestCardProps {
  request: TimeOffRequest;
  onClick: () => void;
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  vacation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  sick: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  unpaid: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  denied: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
};

export function TimeOffRequestCard({ request, onClick }: TimeOffRequestCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-accent"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold capitalize">Time Off Request - {request.leave_type}</h3>
              <Badge className={STATUS_COLORS[request.status]}>
                {request.status}
              </Badge>
              <Badge className={LEAVE_TYPE_COLORS[request.leave_type]}>
                {request.leave_type}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {request.hours_requested} hours ({Math.floor(request.hours_requested / 8)} days)
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created {format(new Date(request.created_at), 'MMM d, yyyy')}
              </span>
            </div>

            {request.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {request.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
