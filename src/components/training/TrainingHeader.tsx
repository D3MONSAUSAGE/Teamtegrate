import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Plus,
  Settings,
  Download,
  PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useTrainingStats } from '@/hooks/useTrainingData';

interface TrainingHeaderProps {
  onCreateCourse: () => void;
  onCreateQuiz: () => void;
  onExportData?: () => void;
  onSettings?: () => void;
  onManageAssignments?: () => void;
}

const TrainingHeader: React.FC<TrainingHeaderProps> = ({
  onCreateCourse,
  onCreateQuiz,
  onExportData,
  onSettings,
  onManageAssignments
}) => {
  const { user } = useAuth();
  const { data: organization } = useOrganization();
  const { data: stats } = useTrainingStats();

  const canCreateContent = user && ['superadmin', 'admin', 'manager'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Main Header Card */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-background via-background/95 to-muted/30 shadow-2xl">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-500/5 via-blue-500/5 to-indigo-500/5 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Training Center Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                    <GraduationCap className="h-12 w-12 text-emerald-600" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-teal-500 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Training Center
                  </h1>
                  <div className="flex items-center gap-4 text-lg">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
                    </div>
                    <div className="hidden sm:block w-px h-5 bg-border" />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-teal-500" />
                      <span>Learning & Development</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-emerald-600 group-hover:scale-110 transition-transform duration-200">
                    {stats?.total_courses || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Training Courses</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-teal-600 group-hover:scale-110 transition-transform duration-200">
                    {stats?.total_quizzes || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Active Quizzes</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-cyan-600 group-hover:scale-110 transition-transform duration-200">
                    {stats?.completion_rate || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Completion Rate</div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-3xl lg:text-4xl font-bold text-blue-600 group-hover:scale-110 transition-transform duration-200">
                    {stats?.total_attempts || 0}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Quiz Attempts</div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-4 min-w-fit">
              {canCreateContent && (
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={onCreateCourse} 
                    size="lg" 
                    className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Create Course
                    </div>
                  </Button>
                  
                  <Button 
                    onClick={onCreateQuiz} 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-teal-200 hover:border-teal-300 hover:bg-teal-50 dark:border-teal-800 dark:hover:border-teal-700 dark:hover:bg-teal-950/20"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Button>
                  
                  {onManageAssignments && (
                    <Button 
                      onClick={onManageAssignments} 
                      size="lg" 
                      variant="outline"
                      className="border-2 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Assignments
                    </Button>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                {onExportData && (
                  <Button variant="outline" size="lg" onClick={onExportData} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
                {onSettings && (
                  <Button variant="outline" size="lg" onClick={onSettings} className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {user?.role}
                  </Badge>
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TrainingHeader;