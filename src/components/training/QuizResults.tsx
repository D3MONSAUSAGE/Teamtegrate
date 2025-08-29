import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart, 
  Users, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  Download,
  User,
  Calendar
} from 'lucide-react';
import { useQuizResultsWithNames } from '@/hooks/useTrainingData';
import { format } from 'date-fns';

interface QuizResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId?: string;
  quizTitle?: string;
}

const QuizResults: React.FC<QuizResultsProps> = ({ 
  open, 
  onOpenChange, 
  quizId, 
  quizTitle 
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { data: attempts = [], isLoading } = useQuizResultsWithNames(quizId);

  if (!quizId) return null;

  // Calculate statistics
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(attempt => attempt.passed).length;
  const failedAttempts = totalAttempts - passedAttempts;
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.max_score * 100), 0) / totalAttempts)
    : 0;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  // Get unique users
  const uniqueUsers = Array.from(new Set(attempts.map(attempt => attempt.user_id)));
  const userStats = uniqueUsers.map(userId => {
    const userAttempts = attempts.filter(attempt => attempt.user_id === userId);
    const bestAttempt = userAttempts.reduce((best, current) => 
      (current.score / current.max_score) > (best.score / best.max_score) ? current : best
    );
    const latestAttempt = userAttempts.sort((a, b) => 
      new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    )[0];
    
    return {
      userId,
      attempts: userAttempts.length,
      bestScore: Math.round((bestAttempt.score / bestAttempt.max_score) * 100),
      latestScore: Math.round((latestAttempt.score / latestAttempt.max_score) * 100),
      passed: latestAttempt.passed,
      lastAttempt: latestAttempt.started_at
    };
  });

  const exportResults = () => {
    const csvData = attempts.map(attempt => ({
      'Employee Name': attempt.users?.name || 'Unknown',
      'Email': attempt.users?.email || 'N/A',
      'Role': attempt.users?.role || 'N/A',
      'Score': `${attempt.score}/${attempt.max_score}`,
      'Percentage': `${Math.round((attempt.score / attempt.max_score) * 100)}%`,
      'Passed': attempt.passed ? 'Yes' : 'No',
      'Started At': format(new Date(attempt.started_at), 'yyyy-MM-dd HH:mm:ss'),
      'Completed At': attempt.completed_at ? format(new Date(attempt.completed_at), 'yyyy-MM-dd HH:mm:ss') : 'Incomplete',
      'Attempt Number': attempt.attempt_number
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${quizTitle?.replace(/\s+/g, '-').toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <BarChart className="h-5 w-5 text-purple-600" />
              </div>
              Quiz Results: {quizTitle}
            </DialogTitle>
            <Button onClick={exportResults} size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="individual">Individual Results</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalAttempts}</p>
                      <p className="text-sm text-muted-foreground">Total Attempts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{passedAttempts}</p>
                      <p className="text-sm text-muted-foreground">Passed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{failedAttempts}</p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{averageScore}%</p>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pass Rate Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Pass Rate Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Pass Rate</span>
                    <span>{passRate}%</span>
                  </div>
                  <Progress value={passRate} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Unique Users:</span>
                    <span className="ml-2 font-semibold">{uniqueUsers.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Attempts per User:</span>
                    <span className="ml-2 font-semibold">
                      {uniqueUsers.length > 0 ? Math.round(totalAttempts / uniqueUsers.length * 10) / 10 : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {attempts
                      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                      .slice(0, 10)
                      .map((attempt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="p-1 rounded bg-gray-100">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{attempt.users?.name || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">
                                {attempt.users?.role} • {format(new Date(attempt.started_at), 'MMM d, HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={attempt.passed ? "default" : "destructive"}>
                              {Math.round((attempt.score / attempt.max_score) * 100)}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Individual User Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {userStats.map((user, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-semibold">{attempts.find(a => a.user_id === user.userId)?.users?.name || 'Unknown User'}</p>
                              <p className="text-sm text-muted-foreground">
                                {attempts.find(a => a.user_id === user.userId)?.users?.role} • Last attempt: {format(new Date(user.lastAttempt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={user.passed ? "default" : "destructive"}>
                            {user.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Attempts:</span>
                            <span className="ml-2 font-semibold">{user.attempts}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Best Score:</span>
                            <span className="ml-2 font-semibold">{user.bestScore}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latest Score:</span>
                            <span className="ml-2 font-semibold">{user.latestScore}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Attempt History</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {attempts
                      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
                      .map((attempt, index) => (
                        <div key={index} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Attempt #{attempt.attempt_number}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={attempt.passed ? "default" : "destructive"}>
                                {Math.round((attempt.score / attempt.max_score) * 100)}%
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {attempt.score}/{attempt.max_score} points
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{attempt.users?.name || 'Unknown User'} ({attempt.users?.role})</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(attempt.started_at), 'MMM d, yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuizResults;