import React from 'react';
import { Card } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import ManagementPanel from './ManagementPanel';
import ContentGrid from './ContentGrid';
import { OnboardingDashboard } from './OnboardingDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  BookOpen, 
  Users, 
  BarChart3,
  UserPlus,
  Shield
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  training_modules?: any[];
  is_active: boolean;
}

interface Quiz {
  id: string;
  title: string;
  quiz_questions?: any[];
  passing_score: number;
}

interface TrainingManagementTabProps {
  courses: Course[];
  quizzes: Quiz[];
  coursesLoading: boolean;
  quizzesLoading: boolean;
  canManageContent: boolean;
  onCreateCourse: () => void;
  onCreateQuiz: () => void;
  onEditCourse: (course: Course) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onViewResults: (quiz: Quiz) => void;
  onAssignContent: () => void;
  onViewAnalytics: () => void;
  onStartOnboarding: () => void;
  onRetrainingSettings?: () => void;
  onManageAssignments?: () => void;
  onManageCompliance?: () => void;
  onCertificateReview?: () => void;
}

const TrainingManagementTab: React.FC<TrainingManagementTabProps> = ({
  courses,
  quizzes,
  coursesLoading,
  quizzesLoading,
  canManageContent,
  onCreateCourse,
  onCreateQuiz,
  onEditCourse,
  onEditQuiz,
  onViewResults,
  onAssignContent,
  onViewAnalytics,
  onStartOnboarding,
  onRetrainingSettings,
  onManageAssignments,
  onManageCompliance,
  onCertificateReview
}) => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Training Management Center</h2>
        <p className="text-muted-foreground">
          Manage training content, assignments, and monitor progress across your organization
        </p>
      </div>

      {/* Management Overview */}
      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Management
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Content Library
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Management Center Tab */}
        <TabsContent value="management" className="space-y-6">
          <div className="animate-fade-in">
            <ManagementPanel
              onCreateCourse={onCreateCourse}
              onCreateQuiz={onCreateQuiz}
              onAssignContent={onAssignContent}
              onViewAnalytics={onViewAnalytics}
              onStartOnboarding={onStartOnboarding}
              onRetrainingSettings={onRetrainingSettings}
              onManageAssignments={onManageAssignments}
              onManageCompliance={onManageCompliance}
              onCertificateReview={onCertificateReview}
              userRole={user?.role || 'user'}
            />
          </div>

          {/* Quick Stats for Managers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{courses.length}</div>
                  <div className="text-sm text-muted-foreground">Active Courses</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{quizzes.length}</div>
                  <div className="text-sm text-muted-foreground">Assessment Quizzes</div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {courses.reduce((acc, course) => acc + (course.training_modules?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Training Modules</div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Content Library Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="animate-fade-in">
            <ContentGrid
              courses={courses}
              quizzes={quizzes}
              coursesLoading={coursesLoading}
              quizzesLoading={quizzesLoading}
              canManageContent={canManageContent}
              onEditCourse={onEditCourse}
              onEditQuiz={onEditQuiz}
              onViewResults={onViewResults}
            />
          </div>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <div className="animate-fade-in">
            <OnboardingDashboard />
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="animate-fade-in">
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Advanced Analytics</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics dashboard is available through the management panel
                  </p>
                </div>
                <div className="flex justify-center">
                  {onViewAnalytics && (
                    <button
                      onClick={onViewAnalytics}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Open Analytics Dashboard
                    </button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingManagementTab;