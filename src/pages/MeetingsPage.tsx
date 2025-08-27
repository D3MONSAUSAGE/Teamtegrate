import React, { useState } from 'react';
import { Plus, Search, Calendar, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MeetingRequestDialog } from '@/components/meetings/MeetingRequestDialog';
import { MeetingInvitationCard } from '@/components/meetings/MeetingInvitationCard';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const MeetingsPage = () => {
  console.log('MeetingsPage component rendered');
  const { user } = useAuth();
  const { meetingRequests, loading } = useMeetingRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const filterMeetings = (type: string) => {
    if (!meetingRequests) return [];

    const now = new Date();
    const filteredMeetings = meetingRequests.filter(meeting => {
      const matchesSearch = meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.organizer_name?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const startTime = new Date(meeting.start_time);
      const isOrganizer = meeting.organizer_id === user?.id;
      const isParticipant = meeting.participants?.some(p => p.user_id === user?.id);

      switch (type) {
        case 'upcoming':
          return startTime > now && meeting.status !== 'cancelled' && (isOrganizer || isParticipant);
        case 'pending':
          return meeting.participants?.some(p => 
            p.user_id === user?.id && p.response_status === 'invited'
          ) && startTime > now && meeting.status !== 'cancelled';
        case 'organized':
          return isOrganizer;
        case 'past':
          return startTime <= now && (isOrganizer || isParticipant);
        case 'cancelled':
          return meeting.status === 'cancelled' && (isOrganizer || isParticipant);
        default:
          return false;
      }
    });

    return filteredMeetings.sort((a, b) => {
      const aTime = new Date(a.start_time);
      const bTime = new Date(b.start_time);
      return type === 'past' ? bTime.getTime() - aTime.getTime() : aTime.getTime() - bTime.getTime();
    });
  };

  const getTabCounts = () => {
    return {
      upcoming: filterMeetings('upcoming').length,
      pending: filterMeetings('pending').length,
      organized: filterMeetings('organized').length,
      past: filterMeetings('past').length,
      cancelled: filterMeetings('cancelled').length,
    };
  };

  const tabCounts = getTabCounts();

  const renderMeetingList = (meetings: typeof meetingRequests) => {
    if (!meetings || meetings.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No meetings found</p>
          <p className="text-sm">
            {activeTab === 'upcoming' && "You don't have any upcoming meetings."}
            {activeTab === 'pending' && "You don't have any pending meeting invitations."}
            {activeTab === 'organized' && "You haven't organized any meetings yet."}
            {activeTab === 'past' && "You don't have any past meetings."}
            {activeTab === 'cancelled' && "You don't have any cancelled meetings."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <MeetingInvitationCard 
            key={meeting.id} 
            meeting={meeting} 
            showActions={true}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your meetings, invitations, and schedules
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabCounts.upcoming}</div>
              <p className="text-xs text-muted-foreground">meetings scheduled</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabCounts.pending}</div>
              <p className="text-xs text-muted-foreground">awaiting response</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organized</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tabCounts.organized}</div>
              <p className="text-xs text-muted-foreground">meetings you created</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {meetingRequests?.filter(m => {
                  const meetingDate = new Date(m.start_time);
                  const now = new Date();
                  return meetingDate.getMonth() === now.getMonth() && 
                         meetingDate.getFullYear() === now.getFullYear();
                }).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">total this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Meeting Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              Upcoming
              {tabCounts.upcoming > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tabCounts.upcoming}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending
              {tabCounts.pending > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tabCounts.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="organized" className="flex items-center gap-2">
              My Meetings
              {tabCounts.organized > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tabCounts.organized}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              Past
              {tabCounts.past > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tabCounts.past}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="flex items-center gap-2">
              Cancelled
              {tabCounts.cancelled > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tabCounts.cancelled}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {renderMeetingList(filterMeetings('upcoming'))}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {renderMeetingList(filterMeetings('pending'))}
          </TabsContent>

          <TabsContent value="organized" className="space-y-4">
            {renderMeetingList(filterMeetings('organized'))}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {renderMeetingList(filterMeetings('past'))}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {renderMeetingList(filterMeetings('cancelled'))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Meeting Dialog */}
      <MeetingRequestDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default MeetingsPage;