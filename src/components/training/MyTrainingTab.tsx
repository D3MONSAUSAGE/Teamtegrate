import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  History, 
  Calendar,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LearningDashboard from './LearningDashboard';
import TrainingStatsCards from './TrainingStatsCards';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  content_title: string;
  assignment_type: string;
  status: string;
  priority: string;
  due_date?: string;
  completion_score?: number;
  completed_at?: string;
  assigned_at: string;
  assigned_by?: string;
  assigned_to?: string;
  organization_id?: string;
  content_id?: string;
  certificate_status?: string;
  certificate_url?: string;
  certificate_uploaded_at?: string;
  verified_at?: string;
  verified_by?: string;
  training_courses?: any;
  quizzes?: any;
}

interface MyTrainingTabProps {
  assignments: Assignment[];
  onViewAssignment: (assignment: Assignment) => void;
  onViewAllAssignments: () => void;
}

const MyTrainingTab: React.FC<MyTrainingTabProps> = ({
  assignments,
  onViewAssignment,
  onViewAllAssignments
}) => {
  const { user } = useAuth();

  // Calculate training statistics
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const inProgressAssignments = assignments.filter(a => a.status === 'in_progress').length;
  const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

  // Get recent completed assignments
  const recentCompletions = assignments
    .filter(a => a.status === 'completed' && a.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
    .slice(0, 3);

  // Get upcoming due assignments
  const upcomingDue = assignments
    .filter(a => a.status !== 'completed' && a.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Welcome back, {user?.name?.split(' ')[0] || 'Learner'}! 👋
            </h2>
            <p className="text-muted-foreground">
              Continue your learning journey and track your progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{completionRate}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalAssignments}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Assignments</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">{completedAssignments}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500 text-white">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{inProgressAssignments}</div>
              <div className="text-sm text-orange-600 dark:text-orange-400">In Progress</div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500 text-white">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{pendingAssignments}</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Pending</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Learning Dashboard */}
      <div className="animate-fade-in">
        <LearningDashboard
          assignments={assignments}
          onViewAssignment={onViewAssignment}
          onViewAllAssignments={onViewAllAssignments}
        />
      </div>

      {/* Additional Training Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completions */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Recent Achievements</h3>
                <p className="text-sm text-muted-foreground">Your latest completed training</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentCompletions.length > 0 ? (
                recentCompletions.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/20">
                        {assignment.assignment_type === 'course' ? (
                          <BookOpen className="h-4 w-4 text-green-600" />
                        ) : (
                          <GraduationCap className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{assignment.content_title}</div>
                        <div className="text-xs text-muted-foreground">
                          {assignment.completed_at && format(new Date(assignment.completed_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    {assignment.completion_score && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                        {assignment.completion_score}%
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Complete your first training to see achievements here</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Upcoming Due Dates */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Upcoming Deadlines</h3>
                <p className="text-sm text-muted-foreground">Stay on track with your training</p>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingDue.length > 0 ? (
                upcomingDue.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                        {assignment.assignment_type === 'course' ? (
                          <BookOpen className="h-4 w-4 text-orange-600" />
                        ) : (
                          <GraduationCap className="h-4 w-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{assignment.content_title}</div>
                        <div className="text-xs text-muted-foreground">
                          Due {assignment.due_date && format(new Date(assignment.due_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={assignment.priority === 'high' ? 'destructive' : 
                                assignment.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {assignment.priority}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onViewAssignment(assignment)}
                        className="text-xs px-2 py-1"
                      >
                        Start
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* System Training Stats */}
      <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <TrainingStatsCards />
      </div>

      {/* View All Assignments Link */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={onViewAllAssignments}
          className="gap-2"
        >
          <History className="h-4 w-4" />
          View All Training Assignments ({totalAssignments})
        </Button>
      </div>
    </div>
  );
};

export default MyTrainingTab;