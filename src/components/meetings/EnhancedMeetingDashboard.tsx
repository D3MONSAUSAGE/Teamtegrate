import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from '@/components/ui/ScrollableTabs';
import { 
  Calendar,
  Clock, 
  Users,
  FileText,
  Target,
  Zap,
  Play,
  Settings,
  MoreVertical,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeetingRequestWithParticipants } from '@/types/meeting';
import { MeetingNotes } from './MeetingNotes';
import { MeetingTimer } from './MeetingTimer';
import { MeetingGoals } from './MeetingGoals';
import { MeetingQuickActions } from './MeetingQuickActions';
import { MeetingStatusSummary } from './MeetingStatusSummary';

interface EnhancedMeetingDashboardProps {
  meeting: MeetingRequestWithParticipants;
  isLive?: boolean;
  onStartMeeting?: () => void;
  onEndMeeting?: () => void;
  className?: string;
}

export const EnhancedMeetingDashboard: React.FC<EnhancedMeetingDashboardProps> = ({
  meeting,
  isLive = false,
  onStartMeeting,
  onEndMeeting,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [meetingStarted, setMeetingStarted] = useState(isLive);

  const handleStartMeeting = () => {
    setMeetingStarted(true);
    onStartMeeting?.();
  };

  const handleEndMeeting = () => {
    setMeetingStarted(false);
    onEndMeeting?.();
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const startTime = formatDateTime(meeting.start_time);
  const endTime = formatDateTime(meeting.end_time);
  const duration = Math.round((new Date(meeting.end_time).getTime() - new Date(meeting.start_time).getTime()) / (1000 * 60));

  // Example agenda segments for the timer
  const agendaSegments = [
    { id: '1', name: 'Welcome & Introductions', duration: 5 },
    { id: '2', name: 'Agenda Review', duration: 5 },
    { id: '3', name: 'Main Discussion', duration: duration - 20 },
    { id: '4', name: 'Action Items & Next Steps', duration: 10 }
  ];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Meeting Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{meeting.title}</CardTitle>
                
                {meetingStarted && (
                  <Badge className="bg-red-600 text-white animate-pulse">
                    ● LIVE
                  </Badge>
                )}
                
                {meeting.status && (
                  <Badge variant="outline">
                    {meeting.status}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  {meeting.participants?.length || 0} participants
                </span>
              </div>

              {meeting.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {meeting.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!meetingStarted ? (
                <Button 
                  onClick={handleStartMeeting}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Meeting
                </Button>
              ) : (
                <Button 
                  onClick={handleEndMeeting}
                  variant="outline"
                  className="gap-2"
                >
                  End Meeting
                </Button>
              )}
              
              <Button variant="outline" size="sm" className="gap-2">
                <Video className="h-4 w-4" />
                Join Call
              </Button>
              
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Participants Summary */}
          <div className="pt-4">
            <MeetingStatusSummary 
              participants={meeting.participants || []}
              compact={true}
              showTrend={true}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Meeting Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <ScrollableTabsList className="md:grid md:grid-cols-5">
          <ScrollableTabsTrigger 
            isActive={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Overview
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={activeTab === 'timer'}
            onClick={() => setActiveTab('timer')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Timer
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={activeTab === 'notes'}
            onClick={() => setActiveTab('notes')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Notes
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={activeTab === 'goals'}
            onClick={() => setActiveTab('goals')}
            className="gap-2"
          >
            <Target className="h-4 w-4" />
            Goals
          </ScrollableTabsTrigger>
          
          <ScrollableTabsTrigger 
            isActive={activeTab === 'actions'}
            onClick={() => setActiveTab('actions')}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            Actions
          </ScrollableTabsTrigger>
        </ScrollableTabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <MeetingTimer
                scheduledDuration={duration}
                segments={agendaSegments}
                onSegmentComplete={(segmentId) => {
                  console.log('Segment completed:', segmentId);
                }}
                onMeetingOverrun={() => {
                  console.log('Meeting is running over schedule');
                }}
              />
              
              <MeetingQuickActions 
                meeting={meeting}
                onCreateTask={(task) => {
                  console.log('Creating task:', task);
                }}
                onCreateProject={(project) => {
                  console.log('Creating project:', project);
                }}
                onScheduleFollowUp={(followUp) => {
                  console.log('Scheduling follow-up:', followUp);
                }}
              />
            </div>
            
            <div className="space-y-4">
              <MeetingNotes
                meetingId={meeting.id}
                isActive={meetingStarted}
                onActionItemCreate={(content) => {
                  console.log('Action item created:', content);
                }}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timer">
          <MeetingTimer
            scheduledDuration={duration}
            segments={agendaSegments}
            onSegmentComplete={(segmentId) => {
              console.log('Segment completed:', segmentId);
            }}
            onMeetingOverrun={() => {
              console.log('Meeting is running over schedule');
            }}
            className="max-w-2xl mx-auto"
          />
        </TabsContent>

        <TabsContent value="notes">
          <MeetingNotes
            meetingId={meeting.id}
            isActive={meetingStarted}
            onActionItemCreate={(content) => {
              console.log('Action item created:', content);
            }}
            className="max-w-4xl mx-auto"
          />
        </TabsContent>

        <TabsContent value="goals">
          <MeetingGoals
            meetingId={meeting.id}
            onGoalComplete={(goalId) => {
              console.log('Goal completed:', goalId);
            }}
            onOutcomeAdd={(outcome) => {
              console.log('Outcome added:', outcome);
            }}
            className="max-w-4xl mx-auto"
          />
        </TabsContent>

        <TabsContent value="actions">
          <MeetingQuickActions 
            meeting={meeting}
            onCreateTask={(task) => {
              console.log('Creating task:', task);
            }}
            onCreateProject={(project) => {
              console.log('Creating project:', project);
            }}
            onScheduleFollowUp={(followUp) => {
              console.log('Scheduling follow-up:', followUp);
            }}
            className="max-w-2xl mx-auto"
          />
        </TabsContent>
      </Tabs>

      {/* Meeting Analytics - shown when meeting is not active */}
      {!meetingStarted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Meeting Preparation
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold">{meeting.participants?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Participants</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="font-semibold">{duration}min</div>
                <div className="text-sm text-muted-foreground">Scheduled Duration</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="font-semibold">0</div>
                <div className="text-sm text-muted-foreground">Goals Set</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                💡 <strong>Tip:</strong> Set meeting goals and prepare your agenda before starting the meeting for better productivity.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};