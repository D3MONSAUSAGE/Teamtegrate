import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingUp, 
  BarChart3,
  Target,
  Award,
  MessageSquare,
  GitBranch,
  Download,
  Crown,
  Star
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface TeamAnalyticsProps {
  memberId: string;
  teamId: string;
  timeRange: string;
}

export function TeamAnalytics({ memberId, teamId, timeRange }: TeamAnalyticsProps) {
  // Mock data - replace with actual API calls
  const teamMetrics = {
    teamSize: 8,
    memberRank: 2,
    collaborationScore: 89,
    mentorshipHours: 6.5,
    peerFeedbackScore: 4.3,
    crossProjectContribution: 75,
    teamInfluence: 82,
    knowledgeSharing: 91
  };

  const teamComparison = [
    { metric: 'Task Completion', member: 87, teamAvg: 73, teamMax: 92 },
    { metric: 'Code Quality', member: 91, teamAvg: 78, teamMax: 94 },
    { metric: 'Collaboration', member: 89, teamAvg: 82, teamMax: 95 },
    { metric: 'Innovation', member: 76, teamAvg: 70, teamMax: 88 },
    { metric: 'Reliability', member: 94, teamAvg: 85, teamMax: 96 },
    { metric: 'Communication', member: 88, teamAvg: 80, teamMax: 92 }
  ];

  const collaborationData = [
    { activity: 'Code Reviews', count: 24, quality: 4.5 },
    { activity: 'Pair Programming', count: 8, quality: 4.2 },
    { activity: 'Team Meetings', count: 16, quality: 4.0 },
    { activity: 'Knowledge Sharing', count: 6, quality: 4.7 },
    { activity: 'Mentoring', count: 4, quality: 4.4 }
  ];

  const projectContributions = [
    { project: 'Website Redesign', contribution: 85, role: 'Lead Developer' },
    { project: 'Mobile App', contribution: 60, role: 'Contributor' },
    { project: 'API Integration', contribution: 95, role: 'Technical Lead' },
    { project: 'Documentation', contribution: 40, role: 'Reviewer' }
  ];

  const peerFeedback = [
    {
      from: 'Sarah Johnson',
      role: 'Senior Developer',
      feedback: 'Excellent problem-solving skills and always willing to help team members.',
      rating: 5,
      category: 'Technical Excellence'
    },
    {
      from: 'Mike Chen',
      role: 'Product Manager',
      feedback: 'Great communicator, delivers quality work consistently on time.',
      rating: 4,
      category: 'Reliability'
    },
    {
      from: 'Emma Davis',
      role: 'Designer',
      feedback: 'Very collaborative and provides constructive feedback during reviews.',
      rating: 5,
      category: 'Collaboration'
    }
  ];

  const leadershipActivities = [
    {
      activity: 'Mentored Junior Developer',
      impact: 'High',
      duration: '3 months',
      outcome: 'Successful onboarding and skill development'
    },
    {
      activity: 'Led Technical Discussion',
      impact: 'Medium',
      duration: '2 hours',
      outcome: 'Resolved architecture decisions'
    },
    {
      activity: 'Organized Knowledge Sharing',
      impact: 'High',
      duration: '1 hour/week',
      outcome: 'Improved team technical skills'
    }
  ];

  const getRankBadge = (rank: number, teamSize: number) => {
    if (rank === 1) return { text: '🥇 Top Performer', variant: 'default' as const };
    if (rank <= teamSize * 0.3) return { text: '🌟 High Performer', variant: 'secondary' as const };
    if (rank <= teamSize * 0.7) return { text: '✅ Good Performer', variant: 'outline' as const };
    return { text: '📈 Developing', variant: 'outline' as const };
  };

  const rankBadge = getRankBadge(teamMetrics.memberRank, teamMetrics.teamSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Team Analytics & Collaboration</h2>
          <p className="text-muted-foreground">
            Team performance comparison, collaboration metrics, and leadership activities
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Analytics
        </Button>
      </div>

      {/* Team Position Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Team Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">#{teamMetrics.memberRank}</div>
            <Badge className="mt-2" variant={rankBadge.variant}>
              {rankBadge.text}
            </Badge>
            <p className="text-sm text-muted-foreground mt-1">
              of {teamMetrics.teamSize} members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Collaboration Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{teamMetrics.collaborationScore}%</div>
            <Progress value={teamMetrics.collaborationScore} className="w-full" />
            <p className="text-sm text-success">Above team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Peer Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.peerFeedbackScore}/5</div>
            <p className="text-sm text-success">Excellent rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4" />
              Mentorship Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{teamMetrics.mentorshipHours}h</div>
            <p className="text-sm text-muted-foreground">This {timeRange.toLowerCase()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance vs Team Average
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={teamComparison} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="metric" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="teamAvg" fill="hsl(var(--muted))" name="Team Average" />
              <Bar dataKey="member" fill="hsl(var(--primary))" name="Your Performance" />
              <Bar dataKey="teamMax" fill="hsl(var(--success))" name="Team Best" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Collaboration Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Collaboration Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {collaborationData.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{activity.activity}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.count} activities • {activity.quality}/5 quality
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < activity.quality 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Cross-Project Contributions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projectContributions.map((project, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{project.project}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {project.role}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold">{project.contribution}%</span>
                </div>
                <Progress value={project.contribution} className="w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Peer Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Peer Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {peerFeedback.map((feedback, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{feedback.from}</p>
                    <p className="text-xs text-muted-foreground">{feedback.role}</p>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < feedback.rating 
                            ? 'text-yellow-400 fill-current' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <p className="text-sm italic">"{feedback.feedback}"</p>
                
                <Badge variant="outline" className="text-xs">
                  {feedback.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leadership Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Leadership & Impact Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {leadershipActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{activity.activity}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Duration: {activity.duration}
                  </p>
                  <p className="text-sm mt-2">{activity.outcome}</p>
                </div>
                
                <Badge 
                  variant={
                    activity.impact === 'High' ? 'default' : 
                    activity.impact === 'Medium' ? 'secondary' : 'outline'
                  }
                >
                  {activity.impact} Impact
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Team Collaboration Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-success">Collaboration Strengths</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Excellent at knowledge sharing and mentoring
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  High peer feedback scores across all categories
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Strong cross-project collaboration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  Demonstrates leadership initiative
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-primary">Growth Opportunities</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Consider formal leadership training
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Explore innovation and creative problem-solving
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Expand mentorship to include junior developers
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Lead larger cross-functional initiatives
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}