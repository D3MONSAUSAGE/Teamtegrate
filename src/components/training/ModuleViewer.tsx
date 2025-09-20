import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video, 
  PlayCircle,
  BookOpen,
  Award,
  Lock,
  Unlock,
  Download,
  Eye,
  File
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Module {
  id?: string;
  title: string;
  description: string;
  content?: string;
  content_type: 'text' | 'video' | 'mixed' | 'file' | 'text_file' | 'video_file' | 'mixed_file';
  youtube_video_id?: string;
  video_url?: string; // Contains YouTube video ID
  module_order: number;
  duration_minutes?: number;
  file_path?: string;
  file_name?: string;
  file_size?: number;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
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

interface ModuleViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
  quiz?: Quiz | null;
  courseTitle?: string;
  onQuizStart?: () => void;
  onModuleComplete?: () => void;
}

const ModuleViewer: React.FC<ModuleViewerProps> = ({ 
  open, 
  onOpenChange, 
  module, 
  quiz, 
  courseTitle,
  onQuizStart,
  onModuleComplete 
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  // Load user progress when module changes
  useEffect(() => {
    if (module?.id && user?.id && open) {
      loadUserProgress();
    }
  }, [module?.id, user?.id, open]);

  const loadUserProgress = async () => {
    if (!module?.id || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_id', module.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        setProgress(data);
        setVideoProgress(data.video_progress_percentage || 0);
        setIsVideoCompleted((data.video_progress_percentage || 0) >= 90);
      }
    } catch (error) {
      console.error('Error loading user progress:', error);
    }
  };

  const updateVideoProgress = async (progressPercentage: number) => {
    if (!module?.id || !user?.id || !user?.organizationId) return;

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

      // If video is 90% or more complete, mark as completed
      if (progressPercentage >= 90 && !isVideoCompleted) {
        progressData.video_completed_at = new Date().toISOString();
        progressData.completed_at = new Date().toISOString();
        setIsVideoCompleted(true);
        toast.success('Video completed! Quiz is now available.');
      }

      const { error } = await supabase
        .from('user_training_progress')
        .upsert(progressData, {
          onConflict: 'user_id,course_id,module_id'
        });

      if (error) throw error;

      setVideoProgress(progressPercentage);
      
      // Update local progress state
      setProgress(prev => ({
        user_id: user.id,
        course_id: moduleData.course_id,
        module_id: module.id!,
        organization_id: user.organizationId,
        status: progressPercentage >= 90 ? 'completed' : 'in_progress',
        progress_percentage: Math.round(progressPercentage),
        video_progress_percentage: Math.round(progressPercentage),
        video_completed_at: progressPercentage >= 90 ? new Date().toISOString() : prev?.video_completed_at,
        last_accessed_at: new Date().toISOString(),
        started_at: prev?.started_at || new Date().toISOString(),
        completed_at: progressPercentage >= 90 ? new Date().toISOString() : prev?.completed_at
      }));

    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  const handleVideoProgress = (progressPercentage: number) => {
    // Throttle updates to avoid too many database calls
    if (Math.abs(progressPercentage - videoProgress) >= 5) {
      updateVideoProgress(progressPercentage);
    }
  };

  const handleVideoComplete = () => {
    updateVideoProgress(100);
  };

  const handleQuizStart = () => {
    if (!isVideoCompleted && (module?.content_type === 'video' || module?.content_type === 'mixed')) {
      toast.error('Please complete the video before taking the quiz.');
      return;
    }
    onQuizStart?.();
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-5 w-5 text-blue-500" />;
      case 'mixed':
        return <PlayCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  if (!module) return null;

  const hasVideo = module.content_type === 'video' || module.content_type === 'mixed';
  const hasText = module.content_type === 'text' || module.content_type === 'mixed';
  const canTakeQuiz = !hasVideo || isVideoCompleted;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getContentTypeIcon(module.content_type)}
            <div>
              <DialogTitle className="text-xl">{module.title}</DialogTitle>
              {courseTitle && (
                <p className="text-sm text-muted-foreground">{courseTitle}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Module Description */}
            {module.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Module Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{module.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Video Content */}
            {hasVideo && (module.video_url || module.youtube_video_id) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-5 w-5 text-blue-500" />
                      Training Video
                    </CardTitle>
                    <Badge variant={isVideoCompleted ? "default" : "secondary"}>
                      {Math.round(videoProgress)}% Complete
                    </Badge>
                  </div>
                  {videoProgress > 0 && (
                    <div className="space-y-2">
                      <Progress 
                        value={videoProgress} 
                        className="h-2"
                      />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {isVideoCompleted ? 'Video completed!' : `${Math.round(videoProgress)}% watched`}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <VideoPlayer
                    youtubeVideoId={module.video_url || module.youtube_video_id || ''}
                    title={module.title}
                    onProgress={handleVideoProgress}
                    onComplete={handleVideoComplete}
                  />
                </CardContent>
              </Card>
            )}

            {/* Text Content */}
            {hasText && module.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-500" />
                    Learning Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-muted-foreground">
                      {module.content}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quiz Section */}
            {quiz && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Knowledge Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{quiz.title}</h4>
                      {quiz.description && (
                        <p className="text-sm text-muted-foreground">{quiz.description}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div>Passing Score: {quiz.passing_score}%</div>
                      <div>Max Attempts: {quiz.max_attempts}</div>
                      {quiz.time_limit_minutes && (
                        <div>Time Limit: {quiz.time_limit_minutes} min</div>
                      )}
                    </div>
                  </div>

                  {/* Quiz Access Status */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {canTakeQuiz ? (
                      <>
                        <Unlock className="h-5 w-5 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-700">Quiz Available</p>
                          <p className="text-xs text-muted-foreground">
                            You can now take the quiz to complete this module.
                          </p>
                        </div>
                        <Button onClick={handleQuizStart} className="ml-auto">
                          Start Quiz
                        </Button>
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5 text-yellow-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-yellow-700">Quiz Locked</p>
                          <p className="text-xs text-muted-foreground">
                            Complete the video (90% minimum) to unlock the quiz.
                          </p>
                        </div>
                        <Button disabled variant="secondary">
                          Quiz Locked
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ModuleViewer;