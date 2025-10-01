import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { useAuth } from '@/contexts/AuthContext';
import ManagementPanel from './ManagementPanel';
import ContentGrid from './ContentGrid';
import EmbeddedEmployeeRecords from './EmbeddedEmployeeRecords';
import AssignmentManagementDialog from './AssignmentManagementDialog';
import { ScrollableTabs, ScrollableTabsList, ScrollableTabsTrigger } from "@/components/ui/ScrollableTabs";
import { 
  Settings, 
  BookOpen, 
  Users, 
  BarChart3,
  UserPlus,
  Shield,
  UserCheck
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
  onRetrainingSettings?: () => void;
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
  onRetrainingSettings,
  onCertificateReview
}) => {
  const { user } = useAuth();
  const [assignmentManagementOpen, setAssignmentManagementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('management');

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
      <div className="space-y-6">
        <ScrollableTabs>
          <ScrollableTabsList>
            <ScrollableTabsTrigger 
              isActive={activeTab === 'management'}
              onClick={() => setActiveTab('management')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span>Management</span>
            </ScrollableTabsTrigger>
            <ScrollableTabsTrigger 
              isActive={activeTab === 'content'}
              onClick={() => setActiveTab('content')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Content Library</span>
            </ScrollableTabsTrigger>
            <ScrollableTabsTrigger 
              isActive={activeTab === 'records'}
              onClick={() => setActiveTab('records')}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Employee Records</span>
            </ScrollableTabsTrigger>
          </ScrollableTabsList>
        </ScrollableTabs>

        {/* Management Center Tab */}
        {activeTab === 'management' && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <ManagementPanel
                onCreateCourse={onCreateCourse}
                onCreateQuiz={onCreateQuiz}
                onAssignContent={onAssignContent}
                onViewAnalytics={onViewAnalytics}
                onRetrainingSettings={onRetrainingSettings}
                onCertificateReview={onCertificateReview}
                onManageAssignments={() => setAssignmentManagementOpen(true)}
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
          </div>
        )}

        {/* Content Library Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fade-in">
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
        )}

        {/* Employee Records Tab */}
        {activeTab === 'records' && (
          <div className="space-y-6 animate-fade-in">
            <EmbeddedEmployeeRecords />
          </div>
        )}

      </div>

      {/* Assignment Management Dialog */}
      <AssignmentManagementDialog
        open={assignmentManagementOpen}
        onOpenChange={setAssignmentManagementOpen}
      />
    </div>
  );
};

export default TrainingManagementTab;