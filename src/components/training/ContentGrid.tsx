import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  BookOpen, 
  PenTool, 
  MoreHorizontal, 
  Edit, 
  BarChart, 
  Search,
  Filter,
  Grid,
  List,
  Clock,
  Users,
  CheckCircle2
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

interface ContentGridProps {
  courses: Course[];
  quizzes: Quiz[];
  coursesLoading: boolean;
  quizzesLoading: boolean;
  canManageContent: boolean;
  onEditCourse: (course: Course) => void;
  onEditQuiz: (quiz: Quiz) => void;
  onViewResults: (quiz: Quiz) => void;
}

const ContentGrid: React.FC<ContentGridProps> = ({
  courses,
  quizzes,
  coursesLoading,
  quizzesLoading,
  canManageContent,
  onEditCourse,
  onEditQuiz,
  onViewResults
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'courses' | 'quizzes'>('courses');

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-card/50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Training Content</h3>
            <p className="text-sm text-muted-foreground">
              Browse available courses and quizzes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses and quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <Button
            variant={activeTab === 'courses' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('courses')}
            className="rounded-b-none gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Courses ({courses.length})
          </Button>
          <Button
            variant={activeTab === 'quizzes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('quizzes')}
            className="rounded-b-none gap-2"
          >
            <PenTool className="h-4 w-4" />
            Quizzes ({quizzes.length})
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'courses' && (
            <div className="space-y-4">
              {coursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredCourses.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                  : 'space-y-3'
                }>
                  {filteredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      viewMode={viewMode}
                      canManageContent={canManageContent}
                      onEdit={() => onEditCourse(course)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No courses found</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              {quizzesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredQuizzes.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                  : 'space-y-3'
                }>
                  {filteredQuizzes.map((quiz) => (
                    <QuizCard
                      key={quiz.id}
                      quiz={quiz}
                      viewMode={viewMode}
                      canManageContent={canManageContent}
                      onEdit={() => onEditQuiz(quiz)}
                      onViewResults={() => onViewResults(quiz)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <PenTool className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No quizzes found</p>
                  {searchTerm && (
                    <p className="text-sm mt-2">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// Course Card Component
const CourseCard: React.FC<{
  course: Course;
  viewMode: 'grid' | 'list';
  canManageContent: boolean;
  onEdit: () => void;
}> = ({ course, viewMode, canManageContent, onEdit }) => {
  if (viewMode === 'list') {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold">{course.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {course.description}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {course.difficulty_level || 'Beginner'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {course.training_modules?.length || 0} modules
                </span>
                {!course.is_active && (
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                )}
              </div>
            </div>
          </div>
          {canManageContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
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
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{course.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {course.difficulty_level || 'Beginner'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {course.training_modules?.length || 0} modules
            </span>
            {!course.is_active && (
              <Badge variant="outline" className="text-xs">Inactive</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Quiz Card Component
const QuizCard: React.FC<{
  quiz: Quiz;
  viewMode: 'grid' | 'list';
  canManageContent: boolean;
  onEdit: () => void;
  onViewResults: () => void;
}> = ({ quiz, viewMode, canManageContent, onEdit, onViewResults }) => {
  const questionCount = quiz.quiz_questions?.length || 0;
  // @ts-ignore - quiz may have module_id property for standalone detection
  const isStandalone = !quiz.module_id;
  
  if (viewMode === 'list') {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <PenTool className="h-6 w-6 text-accent" />
            </div>
            <div className="space-y-1 flex-1">
              <h4 className="font-semibold">{quiz.title}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge 
                  variant={questionCount === 0 ? "destructive" : "secondary"} 
                  className="text-xs"
                >
                  {questionCount} questions
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${isStandalone ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-blue-300 text-blue-700 bg-blue-50'}`}
                >
                  {isStandalone ? '⚡ Standalone' : '📚 Module'}
                </Badge>
                <span>•</span>
                <span>{quiz.passing_score}% to pass</span>
                {questionCount === 0 && (
                  <span className="text-warning font-medium">⚠️ Needs questions</span>
                )}
              </div>
            </div>
          </div>
          {canManageContent && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Quiz
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onViewResults}>
                  <BarChart className="h-4 w-4 mr-2" />
                  View Results
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow group">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
            <PenTool className="h-6 w-6 text-accent" />
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
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Quiz
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onViewResults}>
                  <BarChart className="h-4 w-4 mr-2" />
                  View Results
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">{quiz.title}</h4>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant={questionCount === 0 ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {questionCount} questions
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${isStandalone ? 'border-purple-300 text-purple-700 bg-purple-50' : 'border-blue-300 text-blue-700 bg-blue-50'}`}
            >
              {isStandalone ? '⚡ Standalone' : '📚 Module'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {quiz.passing_score}% to pass
            </span>
          </div>
          {questionCount === 0 && (
            <p className="text-xs text-warning">⚠️ Quiz needs questions</p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ContentGrid;