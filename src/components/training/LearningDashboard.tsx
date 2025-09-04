import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Target, 
  TrendingUp,
  Award,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  content_title: string;
  assignment_type: string;
  status: string;
  priority: string;
  due_date?: string;
  progress?: number;
  certificate_url?: string;
  certificate_status?: string;
  certificate_uploaded_at?: string;
  training_courses?: {
    id: string;
    title: string;
    is_external?: boolean;
    external_base_url?: string;
    url_parameters?: any;
    [key: string]: any;
  };
  quizzes?: {
    id: string;
    title: string;
    [key: string]: any;
  };
}

interface LearningDashboardProps {
  assignments: Assignment[];
  onViewAssignment: (assignment: Assignment) => void;
  onViewAllAssignments: () => void;
}

const LearningDashboard: React.FC<LearningDashboardProps> = ({
  assignments,
  onViewAssignment,
  onViewAllAssignments
}) => {
  console.log('LearningDashboard: Received assignments:', assignments.length, assignments);
  console.log('LearningDashboard: Assignment details:', assignments.map(a => ({
    id: a.id,
    title: a.content_title,
    type: a.assignment_type,
    status: a.status,
    priority: a.priority,
    due_date: a.due_date,
    is_external: a.assignment_type === 'course' ? !!a.training_courses?.is_external : false,
    external_url: a.assignment_type === 'course' ? a.training_courses?.external_base_url : null,
    has_course_data: a.assignment_type === 'course' ? !!a.training_courses : false,
    has_quiz_data: a.assignment_type === 'quiz' ? !!a.quizzes : false
  })));
  
  const activeAssignments = assignments.filter(a => 
    a.status === 'pending' || a.status === 'in_progress'
  );
  
  console.log('LearningDashboard: Active assignments filtered:', activeAssignments.length, activeAssignments.map(a => ({
    id: a.id,
    title: a.content_title,
    status: a.status,
    type: a.assignment_type,
    is_external: a.assignment_type === 'course' ? !!a.training_courses?.is_external : false
  })));
  
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const overallProgress = assignments.length > 0 
    ? (completedCount / assignments.length) * 100 
    : 0;

  const priorityAssignment = activeAssignments.find(a => a.priority === 'high') || 
                            activeAssignments[0];

  console.log('LearningDashboard: Progress calculation:', {
    totalAssignments: assignments.length,
    completedCount,
    overallProgress: Math.round(overallProgress),
    activeCount: activeAssignments.length,
    priorityAssignment: priorityAssignment ? {
      id: priorityAssignment.id,
      title: priorityAssignment.content_title,
      priority: priorityAssignment.priority
    } : null
  });

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 border-0 shadow-lg">
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">My Learning Dashboard</h2>
            <p className="text-muted-foreground">
              Continue your learning journey • {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <TrendingUp className="h-3 w-3" />
              {Math.round(overallProgress)}% Complete
            </Badge>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{completedCount} of {assignments.length} completed</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Continue Learning Section */}
        {priorityAssignment ? (
          <Card className="border-l-4 border-l-primary bg-card/50">
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-primary">Continue Learning</span>
                    {priorityAssignment.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">High Priority</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{priorityAssignment.content_title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {priorityAssignment.assignment_type} • {priorityAssignment.status.replace('_', ' ')}
                  </p>
                  {priorityAssignment.due_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due: {format(new Date(priorityAssignment.due_date), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => onViewAssignment(priorityAssignment)}
                  className="gap-2"
                >
                  {priorityAssignment.status === 'pending' ? 'Start' : 'Continue'} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {priorityAssignment.progress && (
                <Progress value={priorityAssignment.progress} className="h-1" />
              )}
            </div>
          </Card>
        ) : assignments.length > 0 ? (
          <Card className="bg-card/50 border-dashed">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground">
                  Great job! You've completed all your assigned training.
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-primary">{activeAssignments.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-success">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-accent">
              {assignments.filter(a => a.priority === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onViewAllAssignments}
            className="flex-1 gap-2"
          >
            <BookOpen className="h-4 w-4" />
            View All Assignments
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LearningDashboard;