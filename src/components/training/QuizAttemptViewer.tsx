import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trophy,
  Download,
  FileText,
  Calendar,
  User,
  Target,
  AlertCircle,
  MousePointer,
  Shield,
  Edit3
} from 'lucide-react';
import { useQuizAttempts, useQuiz } from '@/hooks/useTrainingData';
import { useQuizOverrides, useDeleteQuizOverride } from '@/hooks/useQuizOverrides';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { evaluateShortAnswer } from '@/utils/quiz/evaluateShortAnswer';
import QuizOverrideDialog from './QuizOverrideDialog';

interface QuizAttemptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizData?: {
    quizId: string;
    employeeName: string;
    assignment?: any;
  };
}

const QuizAttemptViewer: React.FC<QuizAttemptViewerProps> = ({ 
  open, 
  onOpenChange, 
  quizData 
}) => {
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [overrideDialog, setOverrideDialog] = useState<{
    open: boolean;
    question?: any;
    userAnswer?: any;
    existingOverride?: any;
  }>({ open: false });

  const { user } = useAuth();
  const isAdmin = user && ['admin', 'superadmin', 'manager'].includes(user.role);
  
  const { data: attempts = [], isLoading: attemptsLoading } = useQuizAttempts(
    quizData?.quizId, 
    quizData?.assignment?.assigned_to
  );
  
  const { data: quiz, isLoading: quizLoading } = useQuiz(quizData?.quizId);
  
  // Fetch overrides for the selected attempt
  const { data: overrides = [] } = useQuizOverrides(selectedAttempt?.id);
  const deleteOverrideMutation = useDeleteQuizOverride();

  // Auto-select the most recent attempt when attempts load
  useEffect(() => {
    if (attempts.length > 0 && !selectedAttempt) {
      // Sort by attempt number and select the most recent (highest number)
      const mostRecentAttempt = attempts.sort((a, b) => b.attempt_number - a.attempt_number)[0];
      setSelectedAttempt(mostRecentAttempt);
    }
  }, [attempts, selectedAttempt]);

  // Get the final score for a question (considering overrides)
  const getQuestionScore = (question: any, userAnswer: any) => {
    const override = overrides.find(o => o.question_id === question.id);
    if (override) {
      return {
        score: override.override_score,
        isOverridden: true,
        override: override,
        originalScore: override.original_score
      };
    }

    // Calculate original score
    const isCorrect = getAnswerStatus(userAnswer?.answer || '', question);
    return {
      score: isCorrect ? question.points : 0,
      isOverridden: false,
      override: null,
      originalScore: isCorrect ? question.points : 0
    };
  };

  const getAnswerStatus = (userAnswer: string, question: any) => {
    if (!question) return false;
    
    // Handle both camelCase and snake_case property formats
    const correctAnswer = question.correctAnswer || question.correct_answer || '';
    const questionType = question.questionType || question.question_type || '';
    
    if (questionType === 'short_answer') {
      // Match QuizTaker's evaluation approach
      const opts = question.options || {};
      const mergedOpts = {
        ...opts,
        acceptedAnswers: Array.isArray(opts?.acceptedAnswers) ? opts.acceptedAnswers : [],
      };
      
      console.log('🔍 Evaluating short answer:', {
        userAnswer: userAnswer || '',
        correctAnswer,
        options: mergedOpts,
        questionId: question.id
      });
      
      return evaluateShortAnswer(userAnswer || '', correctAnswer, mergedOpts);
    }
    
    // For multiple choice and true/false, use exact matching
    return (userAnswer || '') === correctAnswer;
  };

  const handleOverrideClick = (question: any, userAnswer: any) => {
    const existingOverride = overrides.find(o => o.question_id === question.id);
    setOverrideDialog({
      open: true,
      question,
      userAnswer,
      existingOverride
    });
  };

  const handleRemoveOverride = async (overrideId: string) => {
    try {
      await deleteOverrideMutation.mutateAsync(overrideId);
    } catch (error) {
      console.error('Error removing override:', error);
    }
  };

  const exportAttemptToPDF = (attempt: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Get adjusted scores and overrides - handle both database function results and manual calculations
    const overrides = attempt.overrides || [];
    const hasOverrides = overrides.length > 0 || attempt.has_overrides;
    const finalScore = attempt.adjusted_score || attempt.score;
    const finalPassed = attempt.adjusted_passed !== undefined ? attempt.adjusted_passed : attempt.passed;
    const totalAdjustment = overrides.reduce((sum: number, override: any) => 
      sum + (override.override_score - override.original_score), 0) || attempt.total_adjustment || 0;

    // Header
    pdf.setFontSize(18);
    pdf.text('Quiz Attempt Details', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Employee and Quiz Info
    pdf.setFontSize(12);
    pdf.text(`Employee: ${quizData?.employeeName}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Quiz: ${quiz?.title || 'Unknown Quiz'}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Attempt: ${attempt.attempt_number}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Date: ${format(new Date(attempt.started_at), 'PPP')}`, 20, yPosition);
    yPosition += 12;

    // Score Information (Enhanced with overrides)
    pdf.setFontSize(12);
    pdf.text('Score Summary:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.text(`Original Score: ${attempt.score}/${attempt.max_score} (${Math.round((attempt.score / attempt.max_score) * 100)}%)`, 25, yPosition);
    yPosition += 6;
    
    if (hasOverrides) {
      pdf.text(`Manual Adjustments: ${totalAdjustment > 0 ? '+' : ''}${totalAdjustment} points`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Final Score: ${finalScore}/${attempt.max_score} (${Math.round((finalScore / attempt.max_score) * 100)}%)`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Override Count: ${overrides.length} question${overrides.length !== 1 ? 's' : ''}`, 25, yPosition);
      yPosition += 6;
    } else {
      pdf.text(`Final Score: ${finalScore}/${attempt.max_score} (${Math.round((finalScore / attempt.max_score) * 100)}%)`, 25, yPosition);
      yPosition += 6;
    }
    
    pdf.text(`Status: ${finalPassed ? 'PASSED' : 'FAILED'}`, 25, yPosition);
    yPosition += 15;

    // Questions and Answers
    pdf.setFontSize(14);
    pdf.text('Questions and Answers:', 20, yPosition);
    yPosition += 10;

    if (quiz?.quiz_questions && attempt.answers) {
      const overrideMap = overrides.reduce((acc: any, override: any) => {
        acc[override.question_id] = override;
        return acc;
      }, {});

      quiz.quiz_questions.forEach((question: any, index: number) => {
        const userAnswer = attempt.answers.find((a: any) => a.question_id === question.id);
        const originalCorrect = getAnswerStatus(userAnswer?.answer || '', question);
        const override = overrideMap[question.id];
        const finalCorrect = override ? override.override_score > 0 : originalCorrect;
        const originalPoints = originalCorrect ? question.points : 0;
        const finalPoints = override ? override.override_score : originalPoints;

        pdf.setFontSize(10);
        
        // Question
        const questionText = `Q${index + 1}: ${question.question_text}`;
        const questionLines = pdf.splitTextToSize(questionText, pageWidth - 40);
        questionLines.forEach((line: string) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 20, yPosition);
          yPosition += 6;
        });

        // Answer details
        yPosition += 2;
        pdf.text(`Your Answer: ${userAnswer?.answer || 'No answer provided'}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`Correct Answer: ${question.correct_answer}`, 25, yPosition);
        yPosition += 6;
        
        // Status with override indication
        if (override) {
          pdf.text(`Original Status: ${originalCorrect ? '✓ CORRECT' : '✗ INCORRECT'}`, 25, yPosition);
          yPosition += 6;
          pdf.text(`Final Status: ${finalCorrect ? '✓ CORRECT (Override)' : '✗ INCORRECT (Override)'}`, 25, yPosition);
          yPosition += 6;
          pdf.text(`Points: ${originalPoints} → ${finalPoints}/${question.points} (Manual Override)`, 25, yPosition);
          yPosition += 6;
          if (override.reason) {
            const reasonLines = pdf.splitTextToSize(`Reason: ${override.reason}`, pageWidth - 50);
            reasonLines.forEach((line: string) => {
              if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
              }
              pdf.text(line, 25, yPosition);
              yPosition += 6;
            });
          }
        } else {
          pdf.text(`Status: ${originalCorrect ? '✓ CORRECT' : '✗ INCORRECT'}`, 25, yPosition);
          yPosition += 6;
          pdf.text(`Points: ${originalPoints}/${question.points}`, 25, yPosition);
        }
        yPosition += 10;

        if (question.explanation) {
          const explanationLines = pdf.splitTextToSize(`Explanation: ${question.explanation}`, pageWidth - 50);
          explanationLines.forEach((line: string) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;
            }
            pdf.text(line, 25, yPosition);
            yPosition += 6;
          });
          yPosition += 5;
        }
      });
    }

    // Override summary section if there are overrides
    if (hasOverrides) {
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(14);
      pdf.text('Manual Score Adjustments:', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      overrides.forEach((override: any, index: number) => {
        const questionNumber = quiz?.quiz_questions?.findIndex((q: any) => q.id === override.question_id) + 1 || '?';
        pdf.text(`Question ${questionNumber}: ${override.original_score} → ${override.override_score} points`, 25, yPosition);
        yPosition += 6;
        if (override.reason) {
          pdf.text(`Reason: ${override.reason}`, 30, yPosition);
          yPosition += 6;
        }
        yPosition += 2;
      });
    }

    // Save the PDF
    const fileName = `${quizData?.employeeName}-quiz-attempt-${attempt.attempt_number}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  };

  const exportAttemptToCSV = (attempt: any) => {
    if (!quiz?.quiz_questions || !attempt.answers) return;

    // Get overrides for this attempt - handle both database function results and manual calculations
    const overrides = attempt.overrides || [];
    const overrideMap = overrides.reduce((acc: any, override: any) => {
      acc[override.question_id] = override;
      return acc;
    }, {});

    const csvData = quiz.quiz_questions.map((question: any, index: number) => {
      const userAnswer = attempt.answers.find((a: any) => a.question_id === question.id);
      const originalCorrect = getAnswerStatus(userAnswer?.answer || '', question);
      const override = overrideMap[question.id];
      const finalCorrect = override ? override.override_score > 0 : originalCorrect;
      
      console.log('🔍 CSV Export - Question', index + 1, ':', {
        questionId: question.id,
        userAnswer: userAnswer?.answer,
        correctAnswer: question.correct_answer,
        questionType: question.question_type,
        originalCorrect,
        hasOverride: !!override,
        finalCorrect
      });
      
      return {
        'Question Number': index + 1,
        'Question Text': question.question_text,
        'Question Type': question.question_type,
        'Your Answer': userAnswer?.answer || 'No answer provided',
        'Correct Answer': question.correct_answer,
        'Original Status': originalCorrect ? 'Correct' : 'Incorrect',
        'Final Status': finalCorrect ? 'Correct' : 'Incorrect',
        'Original Points': originalCorrect ? question.points : 0,
        'Final Points': override ? override.override_score : (originalCorrect ? question.points : 0),
        'Points Possible': question.points,
        'Manual Override': override ? 'Yes' : 'No',
        'Override Reason': override ? override.reason : 'N/A',
        'Explanation': question.explanation || 'No explanation provided'
      };
    });
    
    // Add summary row with proper override handling
    const totalOriginalPoints = csvData.reduce((sum, row) => sum + row['Original Points'], 0);
    const totalFinalPoints = csvData.reduce((sum, row) => sum + row['Final Points'], 0);
    const totalPossiblePoints = csvData.reduce((sum, row) => sum + row['Points Possible'], 0);
    const hasOverrides = attempt.has_overrides || (attempt.overrides && attempt.overrides.length > 0);
    
    csvData.push({
      'Question Number': 'SUMMARY' as any,
      'Question Text': `Total Score: ${totalFinalPoints}/${totalPossiblePoints} (${Math.round((totalFinalPoints/totalPossiblePoints)*100)}%)`,
      'Question Type': hasOverrides ? `Original: ${totalOriginalPoints}/${totalPossiblePoints}` : '',
      'Your Answer': '',
      'Correct Answer': '',
      'Original Status': '',
      'Final Status': '',
      'Original Points': totalOriginalPoints,
      'Final Points': totalFinalPoints,
      'Points Possible': totalPossiblePoints,
      'Manual Override': hasOverrides ? 'Yes' : 'No',
      'Override Reason': '',
      'Explanation': ''
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizData?.employeeName}-quiz-attempt-${attempt.attempt_number}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!quizData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <DialogTitle>Quiz Attempts: {quizData.employeeName}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {quiz?.title || `Quiz ID: ${quizData.quizId}`}
                </p>
              </div>
            </div>
            {selectedAttempt && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => exportAttemptToPDF(selectedAttempt)} 
                  size="sm" 
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  onClick={() => exportAttemptToCSV(selectedAttempt)} 
                  size="sm" 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="attempts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="attempts">All Attempts ({attempts.length})</TabsTrigger>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger value="details" disabled={!selectedAttempt}>
                    Attempt Details {selectedAttempt && `(#${selectedAttempt.attempt_number})`}
                  </TabsTrigger>
                </TooltipTrigger>
                {!selectedAttempt && (
                  <TooltipContent>
                    <p>Select an attempt below to view detailed results</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </TabsList>

          <TabsContent value="attempts" className="space-y-4">
            {/* Quiz Info */}
            {quiz && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Quiz Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Questions:</span>
                    <p className="font-semibold">{quiz.quiz_questions?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Passing Score:</span>
                    <p className="font-semibold">{quiz.passing_score}%</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Max Attempts:</span>
                    <p className="font-semibold">{quiz.max_attempts}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Time Limit:</span>
                    <p className="font-semibold">
                      {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No limit'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attempts List */}
            {attempts.length > 0 && (
              <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <MousePointer className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Click on any attempt below</span> to view detailed question-by-question results in the "Attempt Details" tab.
                </p>
              </div>
            )}
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {attempts.map((attempt) => (
                  <Card 
                    key={attempt.id} 
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedAttempt?.id === attempt.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 shadow-md' 
                        : 'hover:shadow-md hover:border-blue-200 hover:bg-blue-50/30'
                    }`}
                    onClick={() => setSelectedAttempt(attempt)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            attempt.passed ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {attempt.passed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">Attempt #{attempt.attempt_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(attempt.started_at), 'PPp')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                            {Math.round((attempt.score / attempt.max_score) * 100)}%
                          </Badge>
                          {attempt.passed && (
                            <Trophy className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Score:</span>
                          <p className="font-medium">{attempt.score}/{attempt.max_score}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Percentage:</span>
                          <p className="font-medium">{Math.round((attempt.score / attempt.max_score) * 100)}%</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className={`font-medium ${attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {attempt.passed ? 'PASSED' : 'FAILED'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Completed:</span>
                          <p className="font-medium">
                            {attempt.completed_at ? 
                              format(new Date(attempt.completed_at), 'MMM d, HH:mm') : 
                              'In progress'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {attempts.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">No Quiz Attempts Found</p>
                    <p className="text-sm text-muted-foreground">
                      This employee hasn't attempted this quiz yet.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {quizLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading quiz questions...</p>
                </div>
              </div>
            ) : selectedAttempt && quiz?.quiz_questions && quiz.quiz_questions.length > 0 ? (
              <ScrollArea className="h-[600px]">
                <div className="space-y-6">
                  {/* Attempt Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Attempt #{selectedAttempt.attempt_number} Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Final Score:</span>
                        <p className="text-2xl font-bold">
                          {Math.round((selectedAttempt.score / selectedAttempt.max_score) * 100)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Points:</span>
                        <p className="text-2xl font-bold">
                          {selectedAttempt.score}/{selectedAttempt.max_score}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <p className={`text-2xl font-bold ${
                          selectedAttempt.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedAttempt.passed ? 'PASSED' : 'FAILED'}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <p className="text-lg font-bold">
                          {format(new Date(selectedAttempt.started_at), 'MMM d')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                   {/* Question-by-Question Breakdown */}
                  <div className="space-y-4">
                    {quiz.quiz_questions.map((question: any, index: number) => {
                      const userAnswer = selectedAttempt.answers?.find((a: any) => a.question_id === question.id);
                      const isCorrect = getAnswerStatus(userAnswer?.answer || '', question);
                      const scoreInfo = getQuestionScore(question, userAnswer);
                      
                      console.log('🔍 Question Analysis - Q' + (index + 1) + ':', {
                        questionId: question.id,
                        questionType: question.question_type,
                        userAnswer: userAnswer?.answer || 'No answer provided',
                        correctAnswer: question.correct_answer || question.correctAnswer,
                        isCorrect,
                        points: question.points,
                        override: scoreInfo.override
                      });
                      
                      return (
                        <Card key={question.id} className={`border-l-4 ${
                          scoreInfo.isOverridden 
                            ? 'border-l-orange-500 bg-orange-50/50' 
                            : isCorrect 
                              ? 'border-l-green-500 bg-green-50/50' 
                              : 'border-l-red-500 bg-red-50/50'
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                Question {index + 1} of {quiz.quiz_questions.length}
                                {scoreInfo.isOverridden && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Shield className="h-4 w-4 text-orange-600" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Manually overridden by admin</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                {scoreInfo.isOverridden ? (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                                    Override: +{scoreInfo.score} / {question.points} pts
                                  </Badge>
                                ) : (
                                  <Badge variant={isCorrect ? 'default' : 'destructive'}>
                                    {isCorrect ? `+${question.points}` : '0'} / {question.points} pts
                                  </Badge>
                                )}
                                
                                {/* Admin Override Controls */}
                                {isAdmin && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleOverrideClick(question, userAnswer)}
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    {scoreInfo.isOverridden && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRemoveOverride(scoreInfo.override.id)}
                                        disabled={deleteOverrideMutation.isPending}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {scoreInfo.isOverridden ? (
                                  <Shield className="h-5 w-5 text-orange-600" />
                                ) : isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                            </div>

                            {/* Override Information */}
                            {scoreInfo.isOverridden && (
                              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                                <div className="flex items-start gap-2">
                                  <Shield className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-orange-800">Manual Override Applied</p>
                                    <p className="text-orange-700 mt-1">
                                      <span className="font-medium">Reason:</span> {scoreInfo.override.reason}
                                    </p>
                                    <p className="text-orange-600 text-xs mt-1">
                                      Original: {scoreInfo.originalScore}/{question.points} → Override: {scoreInfo.score}/{question.points}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="font-medium text-gray-900 mb-2">{question.question_text}</p>
                              <Badge variant="outline" className="text-xs">
                                {question.question_type.replace('_', ' ')}
                              </Badge>
                            </div>

                            {/* Multiple Choice Options */}
                            {question.question_type === 'multiple_choice' && question.options && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Options:</p>
                                {question.options.map((option: string, optionIndex: number) => (
                                  <div 
                                    key={optionIndex} 
                                    className={`p-2 rounded border text-sm ${
                                      option === question.correct_answer 
                                        ? 'bg-green-100 border-green-300 text-green-800' 
                                        : option === userAnswer?.answer 
                                        ? 'bg-red-100 border-red-300 text-red-800'
                                        : 'bg-gray-50 border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {String.fromCharCode(65 + optionIndex)}.
                                      </span>
                                      <span>{option}</span>
                                      {option === question.correct_answer && (
                                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                      )}
                                      {option === userAnswer?.answer && option !== question.correct_answer && (
                                        <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Answer Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Your Answer:</p>
                                <p className={`font-medium ${
                                  isCorrect ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {userAnswer?.answer || 'No answer provided'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Correct Answer:</p>
                                <p className="font-medium text-green-600">
                                  {question.correct_answer}
                                </p>
                              </div>
                            </div>

                            {/* Explanation */}
                            {question.explanation && (
                              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                                <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                                <p className="text-sm text-blue-700">{question.explanation}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            ) : (<>
              {!selectedAttempt ? (
                <div className="text-center py-12">
                  <MousePointer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Select an attempt to view details</p>
                  <p className="text-sm text-muted-foreground">Click on an attempt from the list to see the breakdown.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Attempt #{selectedAttempt.attempt_number} Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Final Score:</span>
                        <p className="text-2xl font-bold">{Math.round((selectedAttempt.score / selectedAttempt.max_score) * 100)}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Points:</span>
                        <p className="text-2xl font-bold">{selectedAttempt.score}/{selectedAttempt.max_score}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <p className={`text-2xl font-bold ${selectedAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>{selectedAttempt.passed ? 'PASSED' : 'FAILED'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <p className="text-lg font-bold">{format(new Date(selectedAttempt.started_at), 'MMM d')}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-700 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-800">Quiz questions not available</p>
                        <p className="text-sm text-yellow-700">
                          {!quiz ? 'Quiz not found in database.' : 
                           !quiz.quiz_questions ? 'Quiz exists but has no questions configured.' :
                           quiz.quiz_questions.length === 0 ? 'Quiz has no questions.' :
                           'Unknown issue loading questions.'}
                        </p>
                        <p className="text-sm text-yellow-600 mt-1">Quiz ID: {quizData?.quizId}</p>
                        {quiz && (
                          <p className="text-sm text-yellow-600">Quiz Title: {quiz.title}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedAttempt.answers?.length ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          Raw Answers
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedAttempt.answers.map((a: any, idx: number) => (
                            <div key={a.question_id || idx} className="p-2 rounded border text-sm flex items-center justify-between">
                              <span className="text-muted-foreground">Question ID: <span className="font-mono">{a.question_id}</span></span>
                              <span className="font-medium">{a.answer || 'No answer provided'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ) : null}

                  {(() => { 
                    console.warn('QuizAttemptViewer: Quiz questions debug info:', {
                      quizId: quizData?.quizId, 
                      quiz: quiz ? { 
                        id: quiz.id, 
                        title: quiz.title, 
                        questionsCount: quiz.quiz_questions?.length,
                        hasQuestions: !!quiz.quiz_questions
                      } : null,
                      selectedAttempt: selectedAttempt ? {
                        id: selectedAttempt.id,
                        attemptNumber: selectedAttempt.attempt_number
                      } : null
                    }); 
                    return null; 
                  })()}
                </div>
              )}
            </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Override Dialog */}
      <QuizOverrideDialog
        open={overrideDialog.open}
        onOpenChange={(open) => setOverrideDialog(prev => ({ ...prev, open }))}
        question={overrideDialog.question}
        userAnswer={overrideDialog.userAnswer}
        quizAttemptId={selectedAttempt?.id}
        existingOverride={overrideDialog.existingOverride}
      />
    </Dialog>
  );
};

export default QuizAttemptViewer;