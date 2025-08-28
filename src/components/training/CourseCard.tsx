import React from 'react';
import { Play, CheckCircle, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
    modules: number;
    progress?: number;
    enrolled?: boolean;
    thumbnail?: string;
  };
  onEnroll?: (courseId: string) => void;
  onContinue?: (courseId: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, onEnroll, onContinue }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-success text-success-foreground';
      case 'intermediate': return 'bg-warning text-warning-foreground';
      case 'advanced': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleButtonClick = () => {
    if (course.enrolled) {
      onContinue?.(course.id);
    } else {
      onEnroll?.(course.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Badge className={getDifficultyColor(course.difficulty)}>
            {course.difficulty}
          </Badge>
          {course.enrolled && course.progress === 100 && (
            <CheckCircle className="h-5 w-5 text-success" />
          )}
        </div>
        
        {course.thumbnail && (
          <div className="w-full h-32 bg-muted rounded-md mb-2 flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        
        <CardTitle className="text-lg">{course.title}</CardTitle>
        <CardDescription>{course.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>{course.modules} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{course.duration} min</span>
          </div>
        </div>
        
        {course.enrolled && typeof course.progress === 'number' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        )}
        
        <Button 
          className="w-full gap-2" 
          variant={course.enrolled ? "default" : "outline"}
          onClick={handleButtonClick}
        >
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
  );
};

export default CourseCard;