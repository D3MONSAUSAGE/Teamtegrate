import React from 'react';
import { Plus, BookOpen, Award, Clock, Users, Play, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TrainingPage = () => {
  const { user, hasRoleAccess } = useAuth();
  const isAdmin = hasRoleAccess('manager');

  const mockCourses = [
    {
      id: '1',
      title: 'Workplace Safety Fundamentals',
      description: 'Essential safety protocols and procedures for all employees',
      difficulty: 'beginner',
      duration: 45,
      modules: 4,
      progress: 75,
      enrolled: true,
      thumbnail: null,
    },
    {
      id: '2',
      title: 'Leadership Development',
      description: 'Advanced leadership skills and management techniques',
      difficulty: 'advanced',
      duration: 120,
      modules: 8,
      progress: 0,
      enrolled: false,
      thumbnail: null,
    },
    {
      id: '3',
      title: 'Data Privacy & Security',
      description: 'Understanding GDPR, data protection, and cybersecurity basics',
      difficulty: 'intermediate',
      duration: 90,
      modules: 6,
      progress: 100,
      enrolled: true,
      thumbnail: null,
    },
  ];

  const stats = {
    totalCourses: 3,
    completedCourses: 1,
    inProgressCourses: 1,
    totalHours: 4.2,
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success text-success-foreground';
      case 'intermediate': return 'bg-warning text-warning-foreground';
      case 'advanced': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Center</h1>
          <p className="text-muted-foreground">
            Develop your skills with our comprehensive training courses
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Course
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressCourses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="my-courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          <TabsTrigger value="all-courses">All Courses</TabsTrigger>
          {isAdmin && <TabsTrigger value="manage">Manage</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-courses" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input placeholder="Search courses..." className="sm:max-w-sm" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCourses
              .filter(course => course.enrolled)
              .map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <Badge className={getDifficultyColor(course.difficulty)}>
                        {course.difficulty}
                      </Badge>
                      {course.progress === 100 && (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{course.modules} modules</span>
                      <span>{course.duration} min</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <Button className="w-full gap-2">
                      <Play className="h-4 w-4" />
                      {course.progress === 0 ? 'Start Course' : 'Continue'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="all-courses" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input placeholder="Search all courses..." className="sm:max-w-sm" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge className={getDifficultyColor(course.difficulty)}>
                      {course.difficulty}
                    </Badge>
                    {course.enrolled && course.progress === 100 && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{course.modules} modules</span>
                    <span>{course.duration} min</span>
                  </div>
                  {course.enrolled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  )}
                  <Button className="w-full gap-2" variant={course.enrolled ? "default" : "outline"}>
                    {course.enrolled ? (
                      <>
                        <Play className="h-4 w-4" />
                        {course.progress === 0 ? 'Start Course' : 'Continue'}
                      </>
                    ) : (
                      'Enroll Now'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="manage" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Course Management</h3>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Course
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Admin Features</CardTitle>
                <CardDescription>
                  Manage courses, track employee progress, and create learning paths
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <BookOpen className="h-5 w-5" />
                    <span>Course Builder</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-5 w-5" />
                    <span>User Progress</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Award className="h-5 w-5" />
                    <span>Certificates</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TrainingPage;