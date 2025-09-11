import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Calendar,
  Clock,
  Users,
  MapPin,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Zap,
  Copy,
  Edit,
  Trash2,
  UserPlus,
  StickyNote,
  Video,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeetingRequestWithParticipants, MeetingParticipant } from '@/types/meeting';

interface MeetingAnalytics {
  effectiveness_score: number;
  engagement_score: number;
  completion_rate: number;
  follow_through_rate: number;
  participant_satisfaction_avg: number;
  roi_score: number;
  total_participants: number;
  active_participants: number;
}

interface MeetingConflict {
  id: string;
  conflict_type: 'scheduling' | 'resource' | 'participant_overload' | 'room_booking';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_resolution?: string;
}

interface EnhancedMeetingCardProps {
  meeting: MeetingRequestWithParticipants;
  analytics?: MeetingAnalytics;
  conflicts?: MeetingConflict[];
  onEdit?: (meeting: MeetingRequestWithParticipants) => void;
  onDuplicate?: (meeting: MeetingRequestWithParticipants) => void;
  onDelete?: (meetingId: string) => void;
  onAddParticipants?: (meetingId: string) => void;
  onQuickNote?: (meetingId: string) => void;
  onJoinCall?: (meeting: MeetingRequestWithParticipants) => void;
  className?: string;
}

export const EnhancedMeetingCard: React.FC<EnhancedMeetingCardProps> = ({
  meeting,
  analytics,
  conflicts = [],
  onEdit,
  onDuplicate,
  onDelete,
  onAddParticipants,
  onQuickNote,
  onJoinCall,
  className
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isToday: date.toDateString() === new Date().toDateString(),
      isPast: date < new Date(),
      isUpcoming: date > new Date() && date < new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  };

  const startTime = formatDateTime(meeting.start_time);
  const endTime = formatDateTime(meeting.end_time);
  const duration = Math.round((new Date(meeting.end_time).getTime() - new Date(meeting.start_time).getTime()) / (1000 * 60));

  // Calculate health scores
  const effectivenessScore = analytics?.effectiveness_score || 0;
  const engagementScore = analytics?.engagement_score || 0;
  const participantCount = meeting.participants?.length || 0;
  const responseRate = participantCount > 0 
    ? (meeting.participants?.filter(p => p.response_status !== 'invited').length || 0) / participantCount * 100 
    : 0;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'tentative': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getParticipantStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'declined': return <XCircle className="h-3 w-3 text-red-600" />;
      case 'tentative': return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical' || c.severity === 'high');
  const hasConflicts = conflicts.length > 0;

  return (
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md border-l-4",
        startTime.isToday ? "border-l-blue-500 bg-blue-50/30" : "border-l-gray-200",
        hasConflicts && criticalConflicts.length > 0 ? "border-l-red-500 bg-red-50/20" : "",
        className
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              {/* Meeting Title and Status */}
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-semibold text-lg text-gray-900">{meeting.title}</h3>
                
                <Badge className={cn("text-xs font-medium", getStatusColor(meeting.status))}>
                  {meeting.status}
                </Badge>

                {startTime.isToday && (
                  <Badge className="bg-blue-600 text-white text-xs">
                    Today
                  </Badge>
                )}

                {startTime.isUpcoming && (
                  <Badge className="bg-purple-600 text-white text-xs animate-pulse">
                    Soon
                  </Badge>
                )}

                {hasConflicts && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Meeting Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {startTime.date}
                </span>
                
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {startTime.time} - {endTime.time} ({duration}min)
                </span>
                
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </span>

                {meeting.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {meeting.location}
                  </span>
                )}
              </div>

              {meeting.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
              )}
            </div>

            {/* Quick Actions Menu */}
            <div className="flex items-center gap-2 ml-4">
              {startTime.isToday && !startTime.isPast && onJoinCall && (
                <Button
                  onClick={() => onJoinCall(meeting)}
                  size="sm"
                  className="gap-2"
                >
                  <Video className="h-4 w-4" />
                  Join
                </Button>
              )}

              <div className="flex items-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onQuickNote?.(meeting.id)}
                    >
                      <StickyNote className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quick note</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAddParticipants?.(meeting.id)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add participants</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More actions</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Enhanced Participant Status Section */}
          <div className="space-y-3">
            {/* Participant Status Summary */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Participant Responses</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="h-auto p-1 text-xs"
                >
                  {showDetails ? 'Hide' : 'View All'}
                </Button>
              </div>
              
              <div className="space-y-2">
                {/* Status breakdown */}
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(meeting.participants?.reduce((acc, p) => {
                    const status = p.response_status;
                    if (!acc[status]) acc[status] = 0;
                    acc[status]++;
                    return acc;
                  }, {} as Record<string, number>) || {}).map(([status, count]) => {
                    const config = {
                      accepted: { icon: CheckCircle, label: 'Confirmed', color: 'text-green-600 bg-green-50' },
                      tentative: { icon: AlertTriangle, label: 'Tentative', color: 'text-yellow-600 bg-yellow-50' },
                      declined: { icon: XCircle, label: 'Declined', color: 'text-red-600 bg-red-50' },
                      invited: { icon: Clock, label: 'Pending', color: 'text-gray-600 bg-gray-50' }
                    }[status] || { icon: Clock, label: 'Unknown', color: 'text-gray-600 bg-gray-50' };
                    
                    const Icon = config.icon;
                    return (
                      <div key={status} className={cn("flex items-center gap-1 px-2 py-1 rounded text-xs font-medium", config.color)}>
                        <Icon className="h-3 w-3" />
                        {count} {config.label}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{ width: `${responseRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-600">
                    {Math.round(responseRate)}% responded
                  </span>
                </div>
              </div>
            </div>

            {/* Participant Avatars */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Participants:</span>
              <div className="flex items-center -space-x-2">
                {meeting.participants?.slice(0, 8).map((participant) => (
                  <Tooltip key={participant.id}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar className="h-8 w-8 border-2 border-white ring-1 ring-gray-200">
                          <AvatarImage src={participant.user_avatar_url} />
                          <AvatarFallback className="text-xs">
                            {participant.user_name?.split(' ').map(n => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                          {getParticipantStatusIcon(participant.response_status)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-center">
                        <div className="font-medium">{participant.user_name}</div>
                        <div className="text-xs text-muted-foreground">{participant.user_email}</div>
                        <div className="text-xs capitalize font-medium">{participant.response_status}</div>
                        {participant.responded_at && (
                          <div className="text-xs text-muted-foreground">
                            Responded: {new Date(participant.responded_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {participantCount > 8 && (
                  <div className="h-8 w-8 rounded-full bg-gray-100 border-2 border-white ring-1 ring-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">+{participantCount - 8}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Health Indicators */}
          {analytics && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Health:</span>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                      getHealthColor(effectivenessScore)
                    )}>
                      <Target className="h-3 w-3" />
                      {effectivenessScore}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Effectiveness Score</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                      getHealthColor(engagementScore)
                    )}>
                      <Zap className="h-3 w-3" />
                      {engagementScore}%
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Engagement Score</TooltipContent>
                </Tooltip>

                {analytics.roi_score > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                        getHealthColor(analytics.roi_score)
                      )}>
                        {analytics.roi_score >= 70 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        ROI {analytics.roi_score}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Return on Investment</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          )}

          {/* Conflicts Display */}
          {hasConflicts && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-amber-700">Detected Issues:</div>
              {conflicts.slice(0, 2).map((conflict) => (
                <div key={conflict.id} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-amber-800 capitalize">
                      {conflict.conflict_type.replace('_', ' ')} - {conflict.severity}
                    </div>
                    <div className="text-xs text-amber-700">{conflict.description}</div>
                    {conflict.suggested_resolution && (
                      <div className="text-xs text-amber-600 mt-1">
                        <strong>Suggestion:</strong> {conflict.suggested_resolution}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {conflicts.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowDetails(true)}
                >
                  View {conflicts.length - 2} more conflicts
                </Button>
              )}
            </div>
          )}

          {/* Extended Actions (when details shown) */}
          {showDetails && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit?.(meeting)}
                className="gap-2"
              >
                <Edit className="h-3 w-3" />
                Edit
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate?.(meeting)}
                className="gap-2"
              >
                <Copy className="h-3 w-3" />
                Duplicate
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddParticipants?.(meeting.id)}
                className="gap-2"
              >
                <UserPlus className="h-3 w-3" />
                Add People
              </Button>
              
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(meeting.id)}
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};