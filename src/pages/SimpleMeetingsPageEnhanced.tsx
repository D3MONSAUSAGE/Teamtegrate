import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, Plus, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import GoogleCalendarConnect from '@/components/meetings/GoogleCalendarConnect';
import EnhancedMeetingForm from '@/components/meetings/EnhancedMeetingForm';
import { toast } from 'sonner';

const SimpleMeetingsPageEnhanced: React.FC = () => {
  const { user } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkGoogleConnection();
      fetchMeetings();
    }
  }, [user]);

  const checkGoogleConnection = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('google_calendar_sync_enabled')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Failed to check Google connection:', error);
        return;
      }

      setIsGoogleConnected(data?.google_calendar_sync_enabled || false);
    } catch (error) {
      console.error('Error checking Google connection:', error);
    }
  };

  const fetchMeetings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          meeting_participants (
            id,
            user_id,
            response_status
          )
        `)
        .eq('organization_id', user.organizationId)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Failed to fetch meetings:', error);
        return;
      }

      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMeetingCreated = async (meeting: any) => {
    setMeetings(prev => [...prev, meeting]);
  };

  const handleGoogleConnectionChange = (connected: boolean) => {
    setIsGoogleConnected(connected);
    if (connected) {
      toast.success('Google Calendar connected! You can now sync meetings.');
    }
  };

  const upcomingMeetings = meetings.filter((meeting: any) => 
    new Date(meeting.start_time) > new Date()
  ).slice(0, 5);

  const todaysMeetings = meetings.filter((meeting: any) => {
    const meetingDate = new Date(meeting.start_time);
    const today = new Date();
    return meetingDate.toDateString() === today.toDateString();
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Manage your meetings and sync with Google Calendar
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Quick Meeting
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Meeting</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meetings.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time meetings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysMeetings.length}</div>
                <p className="text-xs text-muted-foreground">
                  Meetings scheduled today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
                <p className="text-xs text-muted-foreground">
                  Next 5 meetings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Google Sync</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isGoogleConnected ? 'ON' : 'OFF'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Calendar integration
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Meetings</CardTitle>
                <CardDescription>Your next scheduled meetings</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : upcomingMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting: any) => (
                      <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{meeting.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(meeting.start_time).toLocaleDateString()} at {' '}
                            {new Date(meeting.start_time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {meeting.google_event_id && (
                          <div className="text-green-600 text-xs">Synced</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming meetings scheduled
                  </div>
                )}
              </CardContent>
            </Card>

            <GoogleCalendarConnect 
              isConnected={isGoogleConnected}
              onConnectionChange={handleGoogleConnectionChange}
            />
          </div>
        </TabsContent>

        <TabsContent value="create">
          <EnhancedMeetingForm 
            onSubmit={handleMeetingCreated}
            googleCalendarConnected={isGoogleConnected}
          />
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Calendar integration coming soon - view all your meetings in one place
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Calendar view will be implemented in the next phase
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <GoogleCalendarConnect 
              isConnected={isGoogleConnected}
              onConnectionChange={handleGoogleConnectionChange}
            />
            
            <Card>
              <CardHeader>
                <CardTitle>Meeting Preferences</CardTitle>
                <CardDescription>
                  Configure your default meeting settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Meeting preferences configuration coming soon
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimpleMeetingsPageEnhanced;