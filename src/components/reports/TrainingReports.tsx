import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Award, 
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  Star,
  Download,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface TrainingReportsProps {
  memberId: string;
  teamId: string;
  timeRange: string;
}

export function TrainingReports({ memberId, teamId, timeRange }: TrainingReportsProps) {
  // Mock data - replace with actual API calls
  const trainingMetrics = {
    coursesCompleted: 8,
    coursesInProgress: 2,
    coursesAssigned: 12,
    completionRate: 67,
    avgQuizScore: 87,
    learningHours: 24.5,
    certificationsEarned: 3,
    skillsImproved: 5
  };

  const skillProgress = [
    { skill: 'React Development', current: 85, target: 90, improvement: '+15' },
    { skill: 'Project Management', current: 78, target: 85, improvement: '+12' },
    { skill: 'Communication', current: 92, target: 95, improvement: '+8' },
    { skill: 'Data Analysis', current: 65, target: 80, improvement: '+25' },
    { skill: 'Leadership', current: 70, target: 85, improvement: '+18' }
  ];

  const learningProgress = [
    { month: 'Oct', completed: 2, hours: 8 },
    { month: 'Nov', completed: 3, hours: 12 },
    { month: 'Dec', completed: 1, hours: 4 },
    { month: 'Jan', completed: 2, hours: 6 }
  ];

  const recentCourses = [
    {
      title: 'Advanced React Patterns',
      category: 'Technical',
      status: 'completed',
      completedDate: '2024-01-28',
      score: 92,
      duration: '4h 30m',
      certificate: true
    },
    {
      title: 'Agile Project Management',
      category: 'Management',
      status: 'in-progress',
      progress: 75,
      dueDate: '2024-02-15',
      duration: '6h 00m',
      certificate: false
    },
    {
      title: 'Data Visualization with D3',
      category: 'Technical',
      status: 'completed',
      completedDate: '2024-01-20',
      score: 88,
      duration: '3h 45m',
      certificate: true
    },
    {
      title: 'Effective Communication',
      category: 'Soft Skills',
      status: 'assigned',
      assignedDate: '2024-01-30',
      dueDate: '2024-02-20',
      duration: '2h 15m',
      certificate: false
    }
  ];

  const certifications = [
    {
      name: 'React Professional Certification',
      issuer: 'Meta',
      earned: '2024-01-28',
      validUntil: '2027-01-28',
      credentialId: 'RC-2024-001234'
    },
    {
      name: 'Scrum Master Certified',
      issuer: 'Scrum Alliance',
      earned: '2023-12-15',
      validUntil: '2025-12-15',
      credentialId: 'SM-2023-005678'
    },
    {
      name: 'Data Analytics Fundamentals',
      issuer: 'Google',
      earned: '2023-11-08',
      validUntil: 'Lifetime',
      credentialId: 'DA-2023-009012'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in-progress': return 'bg-primary text-primary-foreground';
      case 'assigned': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return Clock;
      case 'assigned': return BookOpen;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Training & Development</h2>
          <p className="text-muted-foreground">
            Learning progress, skill development, and certification tracking
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Training Record
        </Button>
      </div>

      {/* Training Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Courses Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainingMetrics.coursesCompleted}</div>
            <p className="text-sm text-muted-foreground">
              {trainingMetrics.coursesInProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-bold">{trainingMetrics.completionRate}%</div>
            <Progress value={trainingMetrics.completionRate} className="w-full" />
            <p className="text-sm text-success">Above average (60%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avg. Quiz Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainingMetrics.avgQuizScore}%</div>
            <p className="text-sm text-success">Excellent performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{trainingMetrics.certificationsEarned}</div>
            <p className="text-sm text-muted-foreground">This year</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={learningProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="hsl(var(--primary))" 
                  name="Courses Completed"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="hsl(var(--success))" 
                  name="Learning Hours"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skill Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Skill Development Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillProgress.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{skill.skill}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-success">{skill.improvement}</span>
                    <span className="text-sm font-medium">{skill.current}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={skill.current} className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    Target: {skill.target}%
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recent Training Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCourses.map((course, index) => {
              const StatusIcon = getStatusIcon(course.status);
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <StatusIcon className="w-5 h-5" />
                    <div>
                      <h4 className="font-medium">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{course.category}</Badge>
                        <Badge className={getStatusColor(course.status)} variant="secondary">
                          {course.status.replace('-', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {course.duration}
                        </span>
                        {course.certificate && (
                          <Award className="w-4 h-4 text-warning" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {course.status === 'completed' && (
                      <div>
                        <div className="text-lg font-bold text-success">{course.score}%</div>
                        <div className="text-sm text-muted-foreground">
                          {course.completedDate}
                        </div>
                      </div>
                    )}
                    {course.status === 'in-progress' && (
                      <div className="w-32">
                        <Progress value={course.progress} className="w-full" />
                        <div className="text-sm text-muted-foreground mt-1">
                          Due: {course.dueDate}
                        </div>
                      </div>
                    )}
                    {course.status === 'assigned' && (
                      <div className="text-sm text-muted-foreground">
                        Due: {course.dueDate}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Professional Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-warning mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Earned:</span>
                    <span className="font-medium">{cert.earned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valid Until:</span>
                    <span className="font-medium">{cert.validUntil}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      ID: {cert.credentialId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommended Learning Path
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-success">Strengths to Leverage</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Excellent technical skill development
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  High quiz scores and retention rates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Consistent learning engagement
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-primary">Growth Opportunities</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Focus on data analysis skills (current: 65%)
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Develop leadership capabilities
                </li>
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Consider advanced project management
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}