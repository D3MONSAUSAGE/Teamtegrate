import React from 'react';
import { SimpleMeetingDialog } from '@/components/meetings/SimpleMeetingDialog';
import { EnhancedMeetingDashboard } from '@/components/meetings/EnhancedMeetingDashboard';
import { MeetingRequestWithParticipants } from '@/types/meeting';

const exampleMeeting: MeetingRequestWithParticipants = {
  id: 'example-meeting',
  organizer_id: 'user-1',
  organization_id: 'org-1',
  title: 'Product Planning Meeting',
  description: 'Quarterly planning session to review roadmap and set priorities for Q1',
  start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
  end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),   // 1.5 hours from now
  location: 'Conference Room A / Zoom',
  status: 'confirmed' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  participants: [
    {
      id: 'p1',
      meeting_request_id: 'example-meeting',
      user_id: 'user-1',
      response_status: 'accepted' as const,
      created_at: new Date().toISOString(),
      user_name: 'Alice Johnson',
      user_email: 'alice@company.com'
    },
    {
      id: 'p2',
      meeting_request_id: 'example-meeting', 
      user_id: 'user-2',
      response_status: 'accepted' as const,
      created_at: new Date().toISOString(),
      user_name: 'Bob Smith',
      user_email: 'bob@company.com'
    },
    {
      id: 'p3',
      meeting_request_id: 'example-meeting',
      user_id: 'user-3', 
      response_status: 'tentative' as const,
      created_at: new Date().toISOString(),
      user_name: 'Carol Davis',
      user_email: 'carol@company.com'
    },
    {
      id: 'p4',
      meeting_request_id: 'example-meeting',
      user_id: 'user-4',
      response_status: 'invited' as const,
      created_at: new Date().toISOString(),
      user_name: 'David Wilson',
      user_email: 'david@company.com'
    }
  ],
  organizer_name: 'Alice Johnson'
};

const FreshMeetingsPage = () => {
  console.log('🚀 ENHANCED MEETINGS PAGE: Rendering with full meeting management');
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Management</h1>
          <p className="text-muted-foreground mt-1">
            Enhanced meeting experience with notes, timers, goals, and quick actions
          </p>
        </div>
        
        <SimpleMeetingDialog />
      </div>

      <EnhancedMeetingDashboard
        meeting={exampleMeeting}
        isLive={false}
        onStartMeeting={() => {
          console.log('Meeting started - could trigger notifications, timer, etc.');
        }}
        onEndMeeting={() => {
          console.log('Meeting ended - could save notes, send summaries, etc.');
        }}
      />
    </div>
  );
};

export default FreshMeetingsPage;