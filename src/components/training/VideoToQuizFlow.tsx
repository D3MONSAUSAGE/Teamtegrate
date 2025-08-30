import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Award, 
  ArrowRight,
  Video,
  BookOpen,
  Lock,
  Unlock,
  RotateCcw
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { enhancedNotifications } from '@/utils/enhancedNotifications';

interface Module {
  id: string;
  title: string;
  description?: string;
  content?: string;
  content_type: 'text' | 'video' | 'mixed';
  youtube_video_id?: string;
  duration_minutes?: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
}

interface VideoToQuizFlowProps {
  module: Module;
  quiz?: Quiz;
  onQuizStart: () => void;
  onModuleComplete?: () => void;
  className?: string;
}

interface UserProgress {
  user_id: string;
  course_id: string;
  module_id?: string;
  status: string;
  progress_percentage: number;
  video_progress_percentage: number;
  video_completed_at?: string;
  started_at?: string;
  completed_at?: string;
  last_accessed_at: string;
  organization_id: string;
}

const VideoToQuizFlow: React.FC<VideoToQuizFlowProps> = ({
  module,
  quiz,
  onQuizStart,
  onModuleComplete,
  className = ""
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState<'intro' | 'video' | 'quiz-ready' | 'quiz' | 'complete'>('intro');

  useEffect(() => {
    if (module.id && user?.id) {
      loadProgress();
    }
  }, [module.id, user?.id]);

  useEffect(() => {
    determineCurrentStep();
  }, [progress, module.content_type]);

  const loadProgress = async () => {
    if (!module.id || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setProgress(data);
        setIsVideoCompleted((data.video_progress_percentage || 0) >= 90);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const determineCurrentStep = () => {
    if (!progress) {
      setCurrentStep('intro');
      return;
    }

    if (progress.status === 'completed') {
      setCurrentStep('complete');
    } else if (isVideoCompleted && quiz) {
      setCurrentStep('quiz-ready');
    } else if (module.content_type === 'video' || module.content_type === 'mixed') {
      if (progress.video_progress_percentage > 0) {
        setCurrentStep('video');
      } else {
        setCurrentStep('intro');
      }
    } else {
      // Text-only module goes straight to quiz
      setCurrentStep('quiz-ready');
    }
  };

  const updateVideoProgress = async (progressPercentage: number) => {
    if (!module.id || !user?.id || !user?.organizationId) return;

    try {
      // We need to get the course_id to update progress
      const { data: moduleData } = await supabase
        .from('training_modules')
        .select('course_id')
        .eq('id', module.id)
        .single();

      if (!moduleData?.course_id) return;

      const progressData: any = {
        user_id: user.id,
        course_id: moduleData.course_id,
        module_id: module.id,
        organization_id: user.organizationId,
        video_progress_percentage: Math.round(progressPercentage),
        video_watch_time_seconds: Math.round((progressPercentage / 100) * (module.duration_minutes || 0) * 60),
        status: progressPercentage >= 90 ? 'completed' : 'in_progress',
        progress_percentage: Math.round(progressPercentage),
        last_accessed_at: new Date().toISOString()
      };

      if (progressPercentage >= 90 && !isVideoCompleted) {
        progressData.video_completed_at = new Date().toISOString();
        progressData.completed_at = new Date().toISOString();
        setIsVideoCompleted(true);
        enhancedNotifications.success('Video completed! You can now take the quiz.');
      }

      const { error } = await supabase
        .from('user_training_progress')
        .upsert(progressData, {
          onConflict: 'user_id,course_id,module_id'
        });

      if (error) throw error;

      setProgress({
        user_id: user.id,
        course_id: moduleData.course_id,
        module_id: module.id,
        organization_id: user.organizationId,
        status: progressPercentage >= 90 ? 'completed' : 'in_progress',
        progress_percentage: Math.round(progressPercentage),
        video_progress_percentage: Math.round(progressPercentage),
        video_completed_at: progressPercentage >= 90 ? new Date().toISOString() : progress?.video_completed_at,
        last_accessed_at: new Date().toISOString(),
        started_at: progress?.started_at || new Date().toISOString(),
        completed_at: progressPercentage >= 90 ? new Date().toISOString() : progress?.completed_at
      });

    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  const handleVideoProgress = (progressPercentage: number) => {
    if (Math.abs(progressPercentage - (progress?.video_progress_percentage || 0)) >= 5) {
      updateVideoProgress(progressPercentage);
    }
  };

  const handleVideoComplete = () => {
    updateVideoProgress(100);
  };

  const handleQuizStart = () => {
    if (!isVideoCompleted && (module.content_type === 'video' || module.content_type === 'mixed')) {
      enhancedNotifications.error('Please complete the video before taking the quiz.');
      return;
    }
    setCurrentStep('quiz');
    onQuizStart();
  };

  const restartVideo = () => {
    setCurrentStep('video');
  };

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'video':
        if (isVideoCompleted) return 'completed';
        if ((progress?.video_progress_percentage || 0) > 0) return 'in-progress';
        return 'pending';
      case 'quiz':
        if (progress?.status === 'completed') return 'completed';
        if (isVideoCompleted || module.content_type === 'text') return 'available';
        return 'locked';
      default:
        return 'pending';
    }
  };

  const renderIntroStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {module.title}
        </CardTitle>
        {module.description && (
          <p className="text-muted-foreground">{module.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Learning Path Overview */}
        <div className="space-y-3">
          <h4 className="font-medium">Learning Path:</h4>
          <div className="flex items-center gap-4">
            {(module.content_type === 'video' || module.content_type === 'mixed') && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Video className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm">Watch Video</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            {quiz && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Award className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-sm">Take Quiz</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Text Content */}
        {(module.content_type === 'text' || module.content_type === 'mixed') && module.content && (
          <div className="space-y-2">
            <h4 className="font-medium">Learning Materials:</h4>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-muted-foreground">
                  {module.content}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          {module.content_type === 'text' ? (
            <Button onClick={handleQuizStart} className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Start Quiz
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep('video')} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Learning
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderVideoStep = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            {module.title}
          </CardTitle>
          <Badge variant={isVideoCompleted ? "default" : "secondary"}>
            {Math.round(progress?.video_progress_percentage || 0)}% Complete
          </Badge>
        </div>
        {(progress?.video_progress_percentage || 0) > 0 && (
          <div className="space-y-2">
            <Progress value={progress?.video_progress_percentage || 0} className="h-2" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {isVideoCompleted ? 'Video completed!' : `${Math.round(progress?.video_progress_percentage || 0)}% watched`}
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {module.youtube_video_id && (
          <VideoPlayer
            youtubeVideoId={module.youtube_video_id}
            title={module.title}
            onProgress={handleVideoProgress}
            onComplete={handleVideoComplete}
          />
        )}

        {isVideoCompleted && quiz && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-green-800">Video Complete!</p>
                <p className="text-sm text-green-600">You can now proceed to the quiz.</p>
              </div>
              <Button onClick={handleQuizStart} className="ml-auto">
                Take Quiz
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderQuizReadyStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          Ready for Quiz
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="grid grid-cols-2 gap-4">
          {(module.content_type === 'video' || module.content_type === 'mixed') && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Video Complete</p>
                <p className="text-xs text-muted-foreground">100% watched</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Unlock className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Quiz Available</p>
              <p className="text-xs text-muted-foreground">Ready to start</p>
            </div>
          </div>
        </div>

        {quiz && (
          <div className="space-y-3">
            <h4 className="font-medium">{quiz.title}</h4>
            {quiz.description && (
              <p className="text-sm text-muted-foreground">{quiz.description}</p>
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Passing Score: {quiz.passing_score}%</span>
              <span>Max Attempts: {quiz.max_attempts}</span>
              {quiz.time_limit_minutes && (
                <span>Time Limit: {quiz.time_limit_minutes} min</span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between">
          {(module.content_type === 'video' || module.content_type === 'mixed') && (
            <Button variant="outline" onClick={restartVideo} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Rewatch Video
            </Button>
          )}
          <Button onClick={handleQuizStart} className="ml-auto flex items-center gap-2">
            <Award className="h-4 w-4" />
            Start Quiz
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          Module Complete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-6">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Congratulations!</h3>
          <p className="text-muted-foreground mb-4">
            You have successfully completed "{module.title}"
          </p>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {(module.content_type === 'video' || module.content_type === 'mixed') && (
              <div className="text-center">
                <Video className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                <p className="text-sm font-medium">Video</p>
                <p className="text-xs text-green-600">✓ Complete</p>
              </div>
            )}
            {quiz && (
              <div className="text-center">
                <Award className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                <p className="text-sm font-medium">Quiz</p>
                <p className="text-xs text-green-600">✓ Passed</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {(module.content_type === 'video' || module.content_type === 'mixed') && (
            <Button variant="outline" onClick={restartVideo} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Rewatch Video
            </Button>
          )}
          {onModuleComplete && (
            <Button onClick={onModuleComplete} className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Continue Learning
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {currentStep === 'intro' && renderIntroStep()}
      {currentStep === 'video' && renderVideoStep()}
      {currentStep === 'quiz-ready' && renderQuizReadyStep()}
      {currentStep === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default VideoToQuizFlow;