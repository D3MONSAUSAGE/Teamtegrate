import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  X,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

interface MeetingChange {
  field: string;
  oldValue: string;
  newValue: string;
  displayName: string;
}

interface MeetingChangeNotificationProps {
  meetingTitle: string;
  organizerName: string;
  changes: MeetingChange[];
  participantCount: number;
  onAccept?: () => void;
  onDecline?: () => void;
  onDismiss?: () => void;
  severity?: 'info' | 'warning' | 'success';
}

export const MeetingChangeNotification: React.FC<MeetingChangeNotificationProps> = ({
  meetingTitle,
  organizerName,
  changes,
  participantCount,
  onAccept,
  onDecline,
  onDismiss,
  severity = 'info'
}) => {
  const getSeverityIcon = () => {
    switch (severity) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'success':
        return 'border-success/20 bg-success/5';
      default:
        return 'border-primary/20 bg-primary/5';
    }
  };

  const getChangeIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'start_time':
      case 'end_time':
        return <Clock className="h-4 w-4" />;
      case 'location':
        return <MapPin className="h-4 w-4" />;
      case 'participants':
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatChangeValue = (field: string, value: string) => {
    if (field === 'start_time' || field === 'end_time') {
      try {
        return format(new Date(value), 'MMM d, yyyy h:mm a');
      } catch {
        return value;
      }
    }
    return value;
  };

  return (
    <Card className={`transition-all duration-200 ${getSeverityColor()}`}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {getSeverityIcon()}
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Meeting Updated</h4>
              <p className="text-sm text-muted-foreground">
                "{meetingTitle}" has been updated by {organizerName}
              </p>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-auto p-1 hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Changes List */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              What Changed:
            </p>
            {changes.map((change, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 bg-muted/30 rounded-md"
              >
                {getChangeIcon(change.field)}
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-medium">{change.displayName}</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        From
                      </Badge>
                      <span className="text-muted-foreground">
                        {formatChangeValue(change.field, change.oldValue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="default" className="text-xs px-2 py-0.5">
                        To
                      </Badge>
                      <span className="font-medium">
                        {formatChangeValue(change.field, change.newValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Participant Info */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{participantCount} participant{participantCount !== 1 ? 's' : ''} notified</span>
          </div>

          {/* Action Buttons */}
          {(onAccept || onDecline) && (
            <div className="flex gap-2 pt-2 border-t border-border/50">
              {onAccept && (
                <Button
                  size="sm"
                  onClick={onAccept}
                  className="flex-1"
                >
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Accept Changes
                </Button>
              )}
              {onDecline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onDecline}
                  className="flex-1"
                >
                  <X className="h-3 w-3 mr-2" />
                  Decline Changes
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};