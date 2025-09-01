import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Calendar, User, FileText, Users, Settings, GraduationCap } from 'lucide-react';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  day: number;
  status: 'completed' | 'current' | 'upcoming';
  category: 'orientation' | 'documentation' | 'training' | 'meetings' | 'systems';
  duration?: string;
  assignedTo?: string;
}

export function OnboardingTimeline() {
  const timelineEvents: TimelineEvent[] = [
    {
      id: '1',
      title: 'Welcome & Orientation',
      description: 'Office tour, welcome meeting, and initial paperwork',
      day: 1,
      status: 'completed',
      category: 'orientation',
      duration: '2 hours',
      assignedTo: 'HR Team'
    },
    {
      id: '2',
      title: 'IT Setup & Equipment',
      description: 'Laptop setup, account creation, and software installation',
      day: 1,
      status: 'completed',
      category: 'systems',
      duration: '1 hour',
      assignedTo: 'IT Support'
    },
    {
      id: '3',
      title: 'Company Handbook Review',
      description: 'Review policies, procedures, and company culture',
      day: 2,
      status: 'current',
      category: 'documentation',
      duration: '30 minutes',
      assignedTo: 'Self-paced'
    },
    {
      id: '4',
      title: 'Manager 1:1 Meeting',
      description: 'Meet with direct manager to discuss role and expectations',
      day: 3,
      status: 'upcoming',
      category: 'meetings',
      duration: '45 minutes',
      assignedTo: 'Direct Manager'
    },
    {
      id: '5',
      title: 'Team Introductions',
      description: 'Meet team members and key collaborators',
      day: 3,
      status: 'upcoming',
      category: 'meetings',
      duration: '1 hour',
      assignedTo: 'Team Members'
    },
    {
      id: '6',
      title: 'Security Training',
      description: 'Complete mandatory cybersecurity and safety training',
      day: 5,
      status: 'upcoming',
      category: 'training',
      duration: '2 hours',
      assignedTo: 'Security Team'
    },
    {
      id: '7',
      title: 'Department Overview',
      description: 'Learn about department goals, processes, and tools',
      day: 7,
      status: 'upcoming',
      category: 'training',
      duration: '1.5 hours',
      assignedTo: 'Department Head'
    },
    {
      id: '8',
      title: 'Role-Specific Training',
      description: 'Deep dive into specific job responsibilities and tools',
      day: 10,
      status: 'upcoming',
      category: 'training',
      duration: '4 hours',
      assignedTo: 'Subject Matter Expert'
    },
    {
      id: '9',
      title: '30-Day Check-in',
      description: 'Progress review and feedback session',
      day: 30,
      status: 'upcoming',
      category: 'meetings',
      duration: '30 minutes',
      assignedTo: 'Direct Manager'
    }
  ];

  const getCategoryIcon = (category: TimelineEvent['category']) => {
    switch (category) {
      case 'orientation':
        return <Users className="w-4 h-4" />;
      case 'documentation':
        return <FileText className="w-4 h-4" />;
      case 'training':
        return <GraduationCap className="w-4 h-4" />;
      case 'meetings':
        return <User className="w-4 h-4" />;
      case 'systems':
        return <Settings className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: TimelineEvent['category']) => {
    switch (category) {
      case 'orientation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'documentation':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'training':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'meetings':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'systems':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: TimelineEvent['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'current':
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const completedEvents = timelineEvents.filter(event => event.status === 'completed').length;
  const totalEvents = timelineEvents.length;
  const progressPercentage = (completedEvents / totalEvents) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Onboarding Timeline</h3>
          <p className="text-sm text-muted-foreground">Track progress through the 30-day onboarding journey</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Overall Progress
          </CardTitle>
          <CardDescription>
            {completedEvents} of {totalEvents} milestones completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Onboarding Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>30-Day Onboarding Journey</CardTitle>
          <CardDescription>
            Follow the structured path from day one to full integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
            
            <div className="space-y-6">
              {timelineEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-6">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex items-center justify-center">
                    {getStatusIcon(event.status)}
                  </div>
                  
                  {/* Event content */}
                  <div className={`flex-1 pb-6 ${index === timelineEvents.length - 1 ? 'pb-0' : ''}`}>
                    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Day {event.day}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(event.category)}`}>
                            <span className="mr-1">{getCategoryIcon(event.category)}</span>
                            {event.category}
                          </Badge>
                        </div>
                        <Badge 
                          variant={event.status === 'completed' ? 'default' : event.status === 'current' ? 'secondary' : 'outline'}
                          className="capitalize"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      
                      <h4 className="font-medium mb-1">{event.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {event.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {event.duration}
                          </div>
                        )}
                        {event.assignedTo && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.assignedTo}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}