import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap, 
  Video, 
  Settings, 
  BarChart3, 
  BookOpen, 
  Award,
  Clock,
  TrendingUp,
  Users,
  PlayCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTrainingAssignments, useTrainingCourses, useQuizzes } from '@/hooks/useTrainingData';

export function TrainingDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: assignments = [] } = useTrainingAssignments();
  const { data: courses = [] } = useTrainingCourses();
  const { data: quizzes = [] } = useQuizzes();

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  // Calculate stats
  const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress').length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const totalAssignments = assignments.length;
  const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  const quickAccessItems = [
    {
      title: "My Training",
      description: "View your assigned courses and quizzes",
      icon: GraduationCap,
      path: "/dashboard/training/my-training",
      badge: pendingAssignments > 0 ? `${pendingAssignments} pending` : null,
      color: "bg-blue-500"
    },
    {
      title: "Video Library",
      description: "Browse and watch training videos",
      icon: Video,
      path: "/dashboard/training/video-library",
      color: "bg-purple-500"
    }
  ];

  const managementItems = [
    {
      title: "Content Management",
      description: "Create and manage courses and quizzes",
      icon: BookOpen,
      path: "/dashboard/training/management/content",
      color: "bg-green-500"
    },
    {
      title: "User Assignments",
      description: "Assign training to employees",
      icon: Users,
      path: "/dashboard/training/management/assignments",
      color: "bg-orange-500"
    },
    {
      title: "Analytics & Reports",
      description: "View training progress and analytics",
      icon: BarChart3,
      path: "/dashboard/training/analytics",
      color: "bg-indigo-500"
    },
    {
      title: "Video Library Admin",
      description: "Manage video library content",
      icon: PlayCircle,
      path: "/dashboard/training/management/video-library",
      color: "bg-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Training Center</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Track your progress and manage training content.
          </p>
        </div>

        {/* Training Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssignments}</div>
              <p className="text-xs text-muted-foreground">
                {pendingAssignments} pending, {inProgressAssignments} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(completionRate)}%</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">Training courses available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quizzes.length}</div>
              <p className="text-xs text-muted-foreground">Quizzes and assessments</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickAccessItems.map((item) => (
              <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-md ${item.color} text-white`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary">{item.badge}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => navigate(item.path)}
                    className="w-full"
                  >
                    Open {item.title}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Management Section for Admins */}
        {canManageContent && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Training Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {managementItems.map((item) => (
                <Card key={item.path} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-md ${item.color} text-white`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <CardDescription className="text-sm">{item.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className="w-full"
                    >
                      Manage
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {assignments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recent Training Activity</h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Assignments</CardTitle>
                <CardDescription>Your most recent training assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {assignment.assignment_type === 'course' ? (
                            <BookOpen className="h-5 w-5 text-blue-500" />
                          ) : (
                            <Award className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{assignment.content_title}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.assignment_type === 'course' ? 'Course' : 'Quiz'} • 
                            Priority: {assignment.priority}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        assignment.status === 'completed' ? 'default' :
                        assignment.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {assignment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/training/my-training')}
                    className="w-full"
                  >
                    View All Assignments
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}