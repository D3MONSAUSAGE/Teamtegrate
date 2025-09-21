import React, { useState } from 'react';
import { Plus, Search, Calendar, Users, Clock, CalendarCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import { SimpleMeetingDialog } from '@/components/meetings/SimpleMeetingDialog';
import { MeetingInvitationCard } from '@/components/meetings/MeetingInvitationCard';
import { useEnhancedMeetingManagement } from '@/hooks/useEnhancedMeetingManagement';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';

const MeetingsPage = () => {
  const { user } = useAuth();
  const { meetings, isLoading: loading } = useEnhancedMeetingManagement();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  // Show loading if user doesn't have organizationId yet (profile still loading)
  const isProfileLoading = user && !user.organizationId;
  const shouldShowLoading = loading || isProfileLoading;

  const filterMeetings = (type: string) => {
    if (!meetings) return [];

    const now = new Date();
    const filteredMeetings = meetings.filter(meeting => {
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

  const getWeeklyMeetings = () => {
    if (!meetingRequests) return 0;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return meetingRequests.filter(m => {
      const meetingDate = new Date(m.start_time);
      return meetingDate >= now && meetingDate <= weekFromNow && m.status !== 'cancelled';
    }).length;
  };

  const getResponseRate = () => {
    if (!meetingRequests) return 0;
    const invitations = meetingRequests.flatMap(m => 
      m.participants?.filter(p => p.user_id === user?.id) || []
    );
    if (invitations.length === 0) return 0;
    const responded = invitations.filter(p => p.response_status !== 'invited').length;
    return Math.round((responded / invitations.length) * 100);
  };

  const renderMeetingList = (meetings: typeof meetingRequests) => {
    if (!meetings || meetings.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
            <Sparkles className="absolute top-2 right-1/2 translate-x-6 h-4 w-4 text-purple-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No meetings found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {activeTab === 'upcoming' && "You don't have any upcoming meetings. Schedule a new meeting to get started!"}
            {activeTab === 'pending' && "You don't have any pending meeting invitations at the moment."}
            {activeTab === 'organized' && "You haven't organized any meetings yet. Create your first meeting!"}
            {activeTab === 'past' && "You don't have any past meetings to review."}
            {activeTab === 'cancelled' && "You don't have any cancelled meetings."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {meetings.map((meeting) => (
          <div key={meeting.id} className="animate-fade-in">
            <MeetingInvitationCard 
              meeting={meeting} 
              showActions={true}
            />
          </div>
        ))}
      </div>
    );
  };

  if (shouldShowLoading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-background via-muted/20 to-primary/5">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="h-48 bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50 rounded-3xl mb-8"></div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl"></div>
              ))}
            </div>
            
            {/* Content skeleton */}
            <div className="h-96 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl"></div>
          </div>
          {isProfileLoading && (
            <div className="text-center text-muted-foreground">
              <p>Loading your profile...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-3xl bg-card border shadow-lg animate-fade-in">
          {/* Background Effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl" />
          
          <div className="relative p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Meetings Info Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/15 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 transition-all duration-500">
                      <CalendarCheck className="h-10 w-10 text-primary" />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-purple-500 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent">
                      Meeting Hub
                    </h1>
                    <div className="flex items-center gap-4 text-base md:text-lg mt-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-border" />
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                        <span>Meeting Management</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-6 pt-2">
                  <div className="group cursor-pointer">
                    <div className="text-2xl md:text-3xl font-bold text-primary group-hover:scale-110 transition-transform">
                      {tabCounts.upcoming}
                    </div>
                    <div className="text-sm text-muted-foreground">Upcoming</div>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="text-2xl md:text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
                      {tabCounts.pending}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="group cursor-pointer">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                      {getWeeklyMeetings()}
                    </div>
                    <div className="text-sm text-muted-foreground">This Week</div>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex-shrink-0">
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  size={isMobile ? "default" : "lg"} 
                  className="w-full lg:w-auto relative overflow-hidden bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Schedule Meeting
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 hover:shadow-lg transition-all duration-300 group animate-fade-in">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{tabCounts.upcoming}</div>
              <p className="text-xs text-muted-foreground mt-1">meetings scheduled</p>
              <div className="w-full bg-muted rounded-full h-1 mt-3">
                <div 
                  className="bg-gradient-to-r from-primary to-primary/80 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((tabCounts.upcoming / 20) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-purple-500/5 border-purple-500/20 hover:shadow-lg transition-all duration-300 group animate-fade-in [animation-delay:100ms]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Responses</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <Clock className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{tabCounts.pending}</div>
              <p className="text-xs text-muted-foreground mt-1">awaiting response</p>
              <div className="w-full bg-muted rounded-full h-1 mt-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-400 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((tabCounts.pending / 10) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all duration-300 group animate-fade-in [animation-delay:200ms]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Meetings</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{tabCounts.organized}</div>
              <p className="text-xs text-muted-foreground mt-1">meetings organized</p>
              <div className="w-full bg-muted rounded-full h-1 mt-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-400 h-1 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((tabCounts.organized / 15) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-emerald-500/5 border-emerald-500/20 hover:shadow-lg transition-all duration-300 group animate-fade-in [animation-delay:300ms]">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{getResponseRate()}%</div>
              <p className="text-xs text-muted-foreground mt-1">invitations responded</p>
              <Progress value={getResponseRate()} className="mt-3 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters Section */}
        <ModernSectionCard
          title="Search & Filter"
          subtitle="Find meetings quickly"
          icon={Search}
          className="animate-fade-in [animation-delay:400ms]"
          noPadding
        >
          <div className="p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search meetings, organizers, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>
          </div>
        </ModernSectionCard>

        {/* Meeting Lists Section */}
        <ModernSectionCard
          title="Your Meetings"
          subtitle="Manage all your meeting activities"
          icon={CalendarCheck}
          className="animate-fade-in [animation-delay:500ms]"
          gradient="from-primary/5 via-purple-500/5 to-blue-500/5"
          noPadding
        >
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 bg-muted/50">
                <TabsTrigger value="upcoming" className="flex items-center gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                  Upcoming
                  {tabCounts.upcoming > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-primary/20 text-primary border-primary/30">
                      {tabCounts.upcoming}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending" className="flex items-center gap-2 data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600">
                  Pending
                  {tabCounts.pending > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-purple-500/20 text-purple-600 border-purple-500/30">
                      {tabCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="organized" className="flex items-center gap-2 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600">
                  My Meetings
                  {tabCounts.organized > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs bg-blue-500/20 text-blue-600 border-blue-500/30">
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

              <TabsContent value="upcoming" className="space-y-4 mt-6">
                {renderMeetingList(filterMeetings('upcoming'))}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4 mt-6">
                {renderMeetingList(filterMeetings('pending'))}
              </TabsContent>

              <TabsContent value="organized" className="space-y-4 mt-6">
                {renderMeetingList(filterMeetings('organized'))}
              </TabsContent>

              <TabsContent value="past" className="space-y-4 mt-6">
                {renderMeetingList(filterMeetings('past'))}
              </TabsContent>

              <TabsContent value="cancelled" className="space-y-4 mt-6">
                {renderMeetingList(filterMeetings('cancelled'))}
              </TabsContent>
            </Tabs>
          </div>
        </ModernSectionCard>
      </div>

      {/* Create Meeting Dialog */}
      <SimpleMeetingDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default MeetingsPage;