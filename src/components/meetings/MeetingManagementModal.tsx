import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MeetingInvitationCard } from './MeetingInvitationCard';
import { useMeetingRequests } from '@/hooks/useMeetingRequests';
import { useAuth } from '@/contexts/auth/AuthProvider';
import { 
  Calendar, 
  Clock, 
  Users, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  Clock3,
  User
} from 'lucide-react';
import { format, isPast } from 'date-fns';

interface MeetingManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MeetingManagementModal: React.FC<MeetingManagementModalProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { meetingRequests, loading } = useMeetingRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  // Filter meetings based on user involvement and status
  const filterMeetings = (type: string) => {
    const userMeetings = meetingRequests.filter(meeting => {
      const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
      return meeting.organizer_id === user?.id || userParticipant;
    });

    const filteredBySearch = userMeetings.filter(meeting =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date();
    
    switch (type) {
      case 'upcoming':
        return filteredBySearch.filter(meeting => 
          new Date(meeting.start_time) > now && meeting.status !== 'cancelled'
        ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      
      case 'pending':
        return filteredBySearch.filter(meeting => {
          const userParticipant = meeting.participants.find(p => p.user_id === user?.id);
          return userParticipant?.response_status === 'invited' && 
                 new Date(meeting.start_time) > now &&
                 meeting.organizer_id !== user?.id;
        });
      
      case 'organized':
        return filteredBySearch.filter(meeting => 
          meeting.organizer_id === user?.id
        ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      
      case 'past':
        return filteredBySearch.filter(meeting => 
          new Date(meeting.start_time) < now
        ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      
      default:
        return filteredBySearch;
    }
  };

  const getTabCounts = () => {
    const upcoming = filterMeetings('upcoming').length;
    const pending = filterMeetings('pending').length;
    const organized = filterMeetings('organized').length;
    const past = filterMeetings('past').length;
    
    return { upcoming, pending, organized, past };
  };

  const counts = getTabCounts();

  const MeetingList = ({ meetings, emptyMessage }: { meetings: any[], emptyMessage: string }) => (
    <ScrollArea className="h-[500px]">
      {meetings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3 p-1">
          {meetings.map(meeting => (
            <div key={meeting.id} className="transform hover:scale-[1.02] transition-transform">
              <MeetingInvitationCard 
                meeting={meeting} 
                showActions={meeting.organizer_id !== user?.id}
              />
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Meeting Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search meetings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Upcoming
                {counts.upcoming > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-2">
                    {counts.upcoming}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Pending
                {counts.pending > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 px-2">
                    {counts.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="organized" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                My Meetings
                {counts.organized > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 px-2">
                    {counts.organized}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Past
                {counts.past > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 px-2">
                    {counts.past}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              <MeetingList 
                meetings={filterMeetings('upcoming')} 
                emptyMessage="No upcoming meetings scheduled" 
              />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <MeetingList 
                meetings={filterMeetings('pending')} 
                emptyMessage="No pending invitations" 
              />
            </TabsContent>

            <TabsContent value="organized" className="mt-4">
              <MeetingList 
                meetings={filterMeetings('organized')} 
                emptyMessage="You haven't organized any meetings yet" 
              />
            </TabsContent>

            <TabsContent value="past" className="mt-4">
              <MeetingList 
                meetings={filterMeetings('past')} 
                emptyMessage="No past meetings" 
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};