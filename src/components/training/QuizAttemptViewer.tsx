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
  MousePointer
} from 'lucide-react';
import { useQuizAttempts, useQuizzes } from '@/hooks/useTrainingData';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { evaluateShortAnswer } from '@/utils/quiz/evaluateShortAnswer';

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
  
  const { data: attempts = [], isLoading: attemptsLoading } = useQuizAttempts(
    quizData?.quizId, 
    quizData?.assignment?.assigned_to
  );
  
  const { data: quizzes = [] } = useQuizzes();
  const quiz = quizzes.find(q => q.id === quizData?.quizId);

  // Auto-select the most recent attempt when attempts load
  useEffect(() => {
    if (attempts.length > 0 && !selectedAttempt) {
      // Sort by attempt number and select the most recent (highest number)
      const mostRecentAttempt = attempts.sort((a, b) => b.attempt_number - a.attempt_number)[0];
      setSelectedAttempt(mostRecentAttempt);
    }
  }, [attempts, selectedAttempt]);

  const getAnswerStatus = (userAnswer: string, question: any) => {
    if (!question) return false;
    if (question.question_type === 'short_answer') {
      return evaluateShortAnswer(userAnswer || '', question.correct_answer || '', question.options || {});
    }
    return (userAnswer || '') === (question.correct_answer || '');
  };

  const exportAttemptToPDF = (attempt: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

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
    yPosition += 8;
    pdf.text(`Score: ${attempt.score}/${attempt.max_score} (${Math.round((attempt.score / attempt.max_score) * 100)}%)`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Status: ${attempt.passed ? 'PASSED' : 'FAILED'}`, 20, yPosition);
    yPosition += 15;

    // Questions and Answers
    pdf.setFontSize(14);
    pdf.text('Questions and Answers:', 20, yPosition);
    yPosition += 10;

    if (quiz?.quiz_questions && attempt.answers) {
      quiz.quiz_questions.forEach((question: any, index: number) => {
        const userAnswer = attempt.answers.find((a: any) => a.question_id === question.id);
        const isCorrect = getAnswerStatus(userAnswer?.answer || '', question);
        console.log('🔍 PDF Export - Question', index + 1, ':', {
          questionId: question.id,
          userAnswer: userAnswer?.answer,
          correctAnswer: question.correct_answer,
          questionType: question.question_type,
          isCorrect
        });

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
        pdf.text(`Status: ${isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`Points: ${isCorrect ? question.points : 0}/${question.points}`, 25, yPosition);
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

    // Save the PDF
    const fileName = `${quizData?.employeeName}-quiz-attempt-${attempt.attempt_number}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);
  };

  const exportAttemptToCSV = (attempt: any) => {
    if (!quiz?.quiz_questions || !attempt.answers) return;

    const csvData = quiz.quiz_questions.map((question: any, index: number) => {
      const userAnswer = attempt.answers.find((a: any) => a.question_id === question.id);
      const isCorrect = getAnswerStatus(userAnswer?.answer || '', question);
      console.log('🔍 CSV Export - Question', index + 1, ':', {
        questionId: question.id,
        userAnswer: userAnswer?.answer,
        correctAnswer: question.correct_answer,
        questionType: question.question_type,
        isCorrect
      });
      
      return {
        'Question Number': index + 1,
        'Question Text': question.question_text,
        'Question Type': question.question_type,
        'Your Answer': userAnswer?.answer || 'No answer provided',
        'Correct Answer': question.correct_answer,
        'Status': isCorrect ? 'Correct' : 'Incorrect',
        'Points Earned': isCorrect ? question.points : 0,
        'Points Possible': question.points,
        'Explanation': question.explanation || 'No explanation provided'
      };
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
            {selectedAttempt && quiz?.quiz_questions ? (
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
                      
                      console.log('🔍 Question Analysis - Q' + (index + 1) + ':', {
                        questionId: question.id,
                        questionType: question.question_type,
                        userAnswer: userAnswer?.answer || 'No answer provided',
                        correctAnswer: question.correct_answer || question.correctAnswer,
                        isCorrect,
                        points: question.points
                      });
                      
                      return (
                        <Card key={question.id} className={`border-l-4 ${
                          isCorrect ? 'border-l-green-500 bg-green-50/50' : 'border-l-red-500 bg-red-50/50'
                        }`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">
                                Question {index + 1} of {quiz.quiz_questions.length}
                              </CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge variant={isCorrect ? 'default' : 'destructive'}>
                                  {isCorrect ? `+${question.points}` : '0'} / {question.points} pts
                                </Badge>
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                              </div>
                            </div>
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
            ) : (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Select an attempt to view details</p>
                <p className="text-sm text-muted-foreground">
                  Click on an attempt from the list to see question-by-question breakdown.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default QuizAttemptViewer;