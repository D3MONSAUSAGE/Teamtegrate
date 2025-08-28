import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, BookOpen, GraduationCap, PenTool, Users, BarChart, UserPlus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import TrainingHeader from '@/components/training/TrainingHeader';
import TrainingStatsCards from '@/components/training/TrainingStatsCards';
import QuizCreator from '@/components/training/QuizCreator';
import CourseCreator from '@/components/training/CourseCreator';
import CourseEditor from '@/components/training/CourseEditor';
import QuizEditor from '@/components/training/QuizEditor';
import QuizResults from '@/components/training/QuizResults';
import UserAssignment from '@/components/training/UserAssignment';
import MyAssignments from '@/components/training/MyAssignments';
import ModernSectionCard from '@/components/dashboard/ModernSectionCard';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTrainingCourses, useQuizzes, useTrainingAssignments } from '@/hooks/useTrainingData';

const TrainingPage = () => {
  const { user, loading } = useAuth();
  const [isQuizCreatorOpen, setIsQuizCreatorOpen] = useState(false);
  const [isCourseCreatorOpen, setIsCourseCreatorOpen] = useState(false);
  const [isCourseEditorOpen, setIsCourseEditorOpen] = useState(false);
  const [isQuizEditorOpen, setIsQuizEditorOpen] = useState(false);
  const [isQuizResultsOpen, setIsQuizResultsOpen] = useState(false);
  const [isUserAssignmentOpen, setIsUserAssignmentOpen] = useState(false);
  const [isMyAssignmentsOpen, setIsMyAssignmentsOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  const { data: courses = [], isLoading: coursesLoading } = useTrainingCourses();
  const { data: allQuizzes = [], isLoading: quizzesLoading } = useQuizzes();
  const { data: assignments = [] } = useTrainingAssignments();

  const canManageContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  // Show loading state while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-emerald-600" />
              <div className="absolute inset-0 h-16 w-16 mx-auto rounded-full bg-emerald-600/20 animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Loading Training Center</h3>
            <p className="text-muted-foreground">Please wait while we load your training dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if user exists
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="p-6 flex items-center justify-center min-h-screen">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to access the training center.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleCreateCourse = () => {
    setIsCourseCreatorOpen(true);
  };

  const handleCreateQuiz = () => {
    setIsQuizCreatorOpen(true);
  };

  const handleViewResults = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsQuizResultsOpen(true);
  };

  const handleAssignContent = () => {
    setIsUserAssignmentOpen(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setIsCourseEditorOpen(true);
  };

  const handleEditQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setIsQuizEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="p-3 sm:p-6 space-y-8 max-w-7xl mx-auto">
        {/* Professional Header */}
        <div className="animate-fade-in">
          <TrainingHeader 
            onCreateCourse={handleCreateCourse}
            onCreateQuiz={handleCreateQuiz}
          />
        </div>
        
        {/* Enhanced Stats Cards */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <ModernSectionCard
            title="Training Statistics"
            subtitle="Real-time learning metrics and performance indicators"
            icon={GraduationCap}
            gradient="from-emerald-500/10 via-teal-500/10 to-cyan-500/10"
            noPadding
          >
            <div className="p-6">
              <TrainingStatsCards />
            </div>
          </ModernSectionCard>
        </div>
        
        {/* My Assignments Section - Always Visible */}
        <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
          <ModernSectionCard
            title="My Training Assignments"
            subtitle={assignments.length > 0 ? 
              `${assignments.filter(a => a.status === 'pending').length} pending, ${assignments.filter(a => a.status === 'in_progress').length} in progress` :
              "No assignments yet"
            }
            icon={GraduationCap}
            gradient="from-violet-500/10 via-purple-500/10 to-indigo-500/10"
            headerAction={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMyAssignmentsOpen(true)}
                className="gap-2"
              >
                <GraduationCap className="h-4 w-4" />
                View All
              </Button>
            }
          >
            {assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.slice(0, 3).map((assignment: any) => (
                  <div key={assignment.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">{assignment.content_title}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {assignment.assignment_type} • {assignment.status.replace('_', ' ')}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {assignment.priority} priority
                        </span>
                        {assignment.due_date && (
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No training assignments yet.</p>
                <p className="text-sm mt-2">When assignments are created, they'll appear here.</p>
              </div>
            )}
          </ModernSectionCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8">
          {/* Training Content */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8 space-y-8 lg:space-y-0">
            <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <ModernSectionCard
                title="Training Courses"
                subtitle="Available learning paths and modules"
                icon={BookOpen}
                gradient="from-blue-500/10 via-indigo-500/10 to-purple-500/10"
              >
                {coursesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : courses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course: any) => (
                      <div key={course.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow group">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">{course.title}</h3>
                              <p className="text-sm text-muted-foreground">{course.description}</p>
                            </div>
                            {canManageContent && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Course
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                              {course.difficulty_level || 'Beginner'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {course.training_modules?.length || 0} modules
                            </span>
                            {!course.is_active && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No training courses available yet.</p>
                  </div>
                )}
              </ModernSectionCard>
            </div>
            
            <div className="space-y-8">
              <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
                <ModernSectionCard
                  title="Active Quizzes"
                  subtitle="Assessment and evaluation tools"
                  icon={PenTool}
                  gradient="from-green-500/10 via-emerald-500/10 to-teal-500/10"
                  headerAction={
                    canManageContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsUserAssignmentOpen(true)}
                        className="gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign
                      </Button>
                    )
                  }
                >
                  {quizzesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                    </div>
                  ) : allQuizzes.length > 0 ? (
                     <div className="space-y-3">
                       {allQuizzes.slice(0, 5).map((quiz: any) => (
                         <div key={quiz.id} className="p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors group">
                           <div className="flex items-center justify-between">
                             <div className="space-y-1 flex-1">
                               <h4 className="text-sm font-medium text-foreground">{quiz.title}</h4>
                               <p className="text-xs text-muted-foreground">
                                 {quiz.quiz_questions?.length || 0} questions • {quiz.passing_score}% to pass
                               </p>
                             </div>
                             {canManageContent && (
                               <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <DropdownMenu>
                                   <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" size="sm">
                                       <MoreHorizontal className="h-3 w-3" />
                                     </Button>
                                   </DropdownMenuTrigger>
                                   <DropdownMenuContent align="end">
                                     <DropdownMenuItem onClick={() => handleEditQuiz(quiz)}>
                                       <Edit className="h-4 w-4 mr-2" />
                                       Edit Quiz
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleViewResults(quiz)}>
                                       <BarChart className="h-4 w-4 mr-2" />
                                       View Results
                                     </DropdownMenuItem>
                                   </DropdownMenuContent>
                                 </DropdownMenu>
                               </div>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PenTool className="h-8 w-8 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No quizzes available yet.</p>
                    </div>
                  )}
                </ModernSectionCard>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
                <ModernSectionCard
                  title="Learning Progress"
                  subtitle="Track your development journey"
                  icon={Users}
                  gradient="from-orange-500/10 via-red-500/10 to-pink-500/10"
                >
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Progress tracking coming soon.</p>
                  </div>
                </ModernSectionCard>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <QuizCreator 
        open={isQuizCreatorOpen}
        onOpenChange={setIsQuizCreatorOpen}
      />
      
      <CourseCreator 
        open={isCourseCreatorOpen}
        onOpenChange={setIsCourseCreatorOpen}
      />
      
      <CourseEditor 
        open={isCourseEditorOpen}
        onOpenChange={setIsCourseEditorOpen}
        course={selectedCourse}
      />
      
      <QuizEditor 
        open={isQuizEditorOpen}
        onOpenChange={setIsQuizEditorOpen}
        quiz={selectedQuiz}
      />
      
      <QuizResults 
        open={isQuizResultsOpen}
        onOpenChange={setIsQuizResultsOpen}
        quizId={selectedQuiz?.id}
        quizTitle={selectedQuiz?.title}
      />
      
      <UserAssignment 
        open={isUserAssignmentOpen}
        onOpenChange={setIsUserAssignmentOpen}
      />
      
      <MyAssignments 
        open={isMyAssignmentsOpen}
        onOpenChange={setIsMyAssignmentsOpen}
      />
    </div>
  );
};

export default TrainingPage;