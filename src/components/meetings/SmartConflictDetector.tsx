import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Calendar, 
  Users, 
  Clock, 
  MapPin,
  CheckCircle,
  XCircle,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MeetingConflict {
  id: string;
  conflict_type: 'scheduling' | 'resource' | 'participant_overload' | 'room_booking';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_resolution?: string;
  is_resolved: boolean;
}

interface SmartConflictDetectorProps {
  meeting: MeetingRequestWithParticipants;
  onConflictsDetected?: (conflicts: MeetingConflict[]) => void;
  className?: string;
}

export const SmartConflictDetector: React.FC<SmartConflictDetectorProps> = ({
  meeting,
  onConflictsDetected,
  className
}) => {
  const [conflicts, setConflicts] = useState<MeetingConflict[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);
  const { user } = useAuth();

  const detectConflicts = async () => {
    if (!user) return;
    
    setIsAnalyzing(true);
    
    try {
      // Detect scheduling conflicts
      const schedulingConflicts = await detectSchedulingConflicts();
      
      // Detect participant overload
      const overloadConflicts = await detectParticipantOverload();
      
      // Detect resource conflicts
      const resourceConflicts = await detectResourceConflicts();
      
      const allConflicts = [
        ...schedulingConflicts,
        ...overloadConflicts,
        ...resourceConflicts
      ];

      setConflicts(allConflicts);
      onConflictsDetected?.(allConflicts);
      setLastAnalyzed(new Date());
      
      // Store conflicts in database
      if (allConflicts.length > 0) {
        await saveConflictsToDatabase(allConflicts);
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectSchedulingConflicts = async (): Promise<MeetingConflict[]> => {
    const conflicts: MeetingConflict[] = [];
    
    try {
      // Check for overlapping meetings for participants
      const participantIds = meeting.participants?.map(p => p.user_id) || [];
      
      if (participantIds.length > 0) {
        const { data: overlappingMeetings } = await supabase
          .from('meeting_requests')
          .select(`
            id, title, start_time, end_time,
            meeting_participants!inner(user_id)
          `)
          .neq('id', meeting.id)
          .in('meeting_participants.user_id', participantIds)
          .eq('organization_id', user.organizationId)
          .gte('end_time', meeting.start_time)
          .lte('start_time', meeting.end_time);

        if (overlappingMeetings && overlappingMeetings.length > 0) {
          conflicts.push({
            id: `scheduling-${Date.now()}`,
            conflict_type: 'scheduling',
            severity: 'high',
            description: `${overlappingMeetings.length} participant(s) have conflicting meetings`,
            suggested_resolution: 'Consider rescheduling or removing conflicting participants',
            is_resolved: false
          });
        }
      }

      // Check if meeting is outside business hours
      const meetingStart = new Date(meeting.start_time);
      const hour = meetingStart.getHours();
      const isWeekend = meetingStart.getDay() === 0 || meetingStart.getDay() === 6;
      
      if (hour < 8 || hour > 18) {
        conflicts.push({
          id: `business-hours-${Date.now()}`,
          conflict_type: 'scheduling',
          severity: 'medium',
          description: 'Meeting scheduled outside typical business hours',
          suggested_resolution: 'Consider moving to 9 AM - 5 PM for better attendance',
          is_resolved: false
        });
      }

      if (isWeekend) {
        conflicts.push({
          id: `weekend-${Date.now()}`,
          conflict_type: 'scheduling',
          severity: 'medium',
          description: 'Meeting scheduled on weekend',
          suggested_resolution: 'Consider rescheduling to weekday for better participation',
          is_resolved: false
        });
      }

    } catch (error) {
      console.error('Error detecting scheduling conflicts:', error);
    }
    
    return conflicts;
  };

  const detectParticipantOverload = async (): Promise<MeetingConflict[]> => {
    const conflicts: MeetingConflict[] = [];
    
    try {
      const participantIds = meeting.participants?.map(p => p.user_id) || [];
      
      if (participantIds.length > 0) {
        // Check meeting load for the day
        const meetingDate = new Date(meeting.start_time).toISOString().split('T')[0];
        
        const { data: dailyMeetings } = await supabase
          .from('meeting_requests')
          .select(`
            id,
            meeting_participants!inner(user_id)
          `)
          .eq('organization_id', user.organizationId)
          .gte('start_time', `${meetingDate}T00:00:00.000Z`)
          .lt('start_time', `${meetingDate}T23:59:59.999Z`)
          .in('meeting_participants.user_id', participantIds);

        if (dailyMeetings && dailyMeetings.length >= 5) {
          conflicts.push({
            id: `overload-${Date.now()}`,
            conflict_type: 'participant_overload',
            severity: 'medium',
            description: `Participants have ${dailyMeetings.length} meetings scheduled for this day`,
            suggested_resolution: 'Consider combining meetings or moving to a less busy day',
            is_resolved: false
          });
        }
      }

      // Check if meeting is too long
      const duration = (new Date(meeting.end_time).getTime() - new Date(meeting.start_time).getTime()) / (1000 * 60);
      
      if (duration > 120) {
        conflicts.push({
          id: `duration-${Date.now()}`,
          conflict_type: 'participant_overload',
          severity: 'medium',
          description: `Meeting is ${Math.round(duration)} minutes long`,
          suggested_resolution: 'Consider breaking into shorter sessions or adding breaks',
          is_resolved: false
        });
      }

    } catch (error) {
      console.error('Error detecting participant overload:', error);
    }
    
    return conflicts;
  };

  const detectResourceConflicts = async (): Promise<MeetingConflict[]> => {
    const conflicts: MeetingConflict[] = [];
    
    try {
      // Check if too many participants for effective meeting
      const participantCount = meeting.participants?.length || 0;
      
      if (participantCount > 8) {
        conflicts.push({
          id: `large-meeting-${Date.now()}`,
          conflict_type: 'resource',
          severity: 'low',
          description: `Large meeting with ${participantCount} participants`,
          suggested_resolution: 'Consider splitting into smaller focused groups',
          is_resolved: false
        });
      }

      if (participantCount === 0) {
        conflicts.push({
          id: `no-participants-${Date.now()}`,
          conflict_type: 'resource',
          severity: 'high',
          description: 'No participants added to meeting',
          suggested_resolution: 'Add relevant participants before scheduling',
          is_resolved: false
        });
      }

      // Check if meeting location conflicts exist (simplified check)
      if (meeting.location && meeting.location.toLowerCase().includes('room')) {
        const { data: roomConflicts } = await supabase
          .from('meeting_requests')
          .select('id, title, location')
          .eq('organization_id', user.organizationId)
          .eq('location', meeting.location)
          .neq('id', meeting.id)
          .gte('end_time', meeting.start_time)
          .lte('start_time', meeting.end_time);

        if (roomConflicts && roomConflicts.length > 0) {
          conflicts.push({
            id: `room-conflict-${Date.now()}`,
            conflict_type: 'room_booking',
            severity: 'high',
            description: `Room "${meeting.location}" is already booked`,
            suggested_resolution: 'Choose a different room or reschedule',
            is_resolved: false
          });
        }
      }

    } catch (error) {
      console.error('Error detecting resource conflicts:', error);
    }
    
    return conflicts;
  };

  const saveConflictsToDatabase = async (conflictsToSave: MeetingConflict[]) => {
    if (!user) return;

    try {
      const conflictRecords = conflictsToSave.map(conflict => ({
        meeting_request_id: meeting.id,
        organization_id: user.organizationId,
        conflict_type: conflict.conflict_type,
        severity: conflict.severity,
        description: conflict.description,
        suggested_resolution: conflict.suggested_resolution
      }));

      await supabase
        .from('meeting_conflicts')
        .insert(conflictRecords);
    } catch (error) {
      console.error('Error saving conflicts to database:', error);
    }
  };

  const resolveConflict = async (conflictId: string) => {
    setConflicts(prev => prev.map(conflict => 
      conflict.id === conflictId 
        ? { ...conflict, is_resolved: true }
        : conflict
    ));
  };

  useEffect(() => {
    detectConflicts();
  }, [meeting.id, meeting.start_time, meeting.end_time, meeting.participants?.length]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConflictIcon = (type: string) => {
    switch (type) {
      case 'scheduling': return Calendar;
      case 'participant_overload': return Users;
      case 'resource': return Clock;
      case 'room_booking': return MapPin;
      default: return AlertTriangle;
    }
  };

  const criticalConflicts = conflicts.filter(c => !c.is_resolved && (c.severity === 'critical' || c.severity === 'high'));
  const otherConflicts = conflicts.filter(c => !c.is_resolved && c.severity !== 'critical' && c.severity !== 'high');

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Smart Conflict Detection
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {lastAnalyzed && (
              <span className="text-xs text-muted-foreground">
                Last analyzed: {lastAnalyzed.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              onClick={detectConflicts}
              disabled={isAnalyzing}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isAnalyzing && "animate-spin")} />
              {isAnalyzing ? 'Analyzing...' : 'Check Again'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {conflicts.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              No conflicts detected! This meeting looks well-scheduled.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Critical Conflicts */}
            {criticalConflicts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Critical Issues ({criticalConflicts.length})
                </h4>
                {criticalConflicts.map((conflict) => {
                  const IconComponent = getConflictIcon(conflict.conflict_type);
                  return (
                    <Alert key={conflict.id} className={getSeverityColor(conflict.severity)}>
                      <IconComponent className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium capitalize">
                              {conflict.conflict_type.replace('_', ' ')} Issue
                            </div>
                            <div className="text-sm">{conflict.description}</div>
                            {conflict.suggested_resolution && (
                              <div className="flex items-start gap-2 mt-2 p-2 bg-white/50 rounded">
                                <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm">
                                  <strong>Suggestion:</strong> {conflict.suggested_resolution}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => resolveConflict(conflict.id)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Resolve
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}

            {/* Other Conflicts */}
            {otherConflicts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Recommendations ({otherConflicts.length})
                </h4>
                {otherConflicts.map((conflict) => {
                  const IconComponent = getConflictIcon(conflict.conflict_type);
                  return (
                    <Alert key={conflict.id} className={getSeverityColor(conflict.severity)}>
                      <IconComponent className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="font-medium capitalize">
                              {conflict.conflict_type.replace('_', ' ')}
                            </div>
                            <div className="text-sm">{conflict.description}</div>
                            {conflict.suggested_resolution && (
                              <div className="text-sm text-muted-foreground mt-1">
                                💡 {conflict.suggested_resolution}
                              </div>
                            )}
                          </div>
                          <Badge className={getSeverityColor(conflict.severity)}>
                            {conflict.severity}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
