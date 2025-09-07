import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubmitQuizAttempt } from '@/hooks/useTrainingData';
import { useQuizQuestions } from '@/hooks/useQuizQuestions';
import { evaluateShortAnswer } from '@/utils/quiz/evaluateShortAnswer';
import QuizDiagnostics from './QuizDiagnostics';

interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: any;
  correctAnswer: string;
  points: number;
  explanation?: string;
}

interface QuizTakerProps {
  quiz: {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    maxAttempts: number;
    timeLimitMinutes?: number;
    questions: QuizQuestion[];
  };
  onComplete: (results: QuizResults) => void;
  onExit: () => void;
  currentAttempts?: number;
  hasNextModule?: boolean;
  onRetakeQuiz?: () => void;
}

interface QuizResults {
  score: number;
  maxScore: number;
  passed: boolean;
  answers: Record<string, string>;
  timeSpent: number;
}

// ALL HOOKS MUST BE AT THE TOP - No conditional hooks allowed
const QuizTaker: React.FC<QuizTakerProps> = ({ 
  quiz, 
  onComplete, 
  onExit, 
  currentAttempts = 0,
  hasNextModule = true,
  onRetakeQuiz
}) => {
  // ALL hooks must be at the top level - no conditional hooks
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null
  );
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // All hooks must be called unconditionally
  const submitAttempt = useSubmitQuizAttempt();
  const { data: directQuestions, isLoading: questionsLoading, refetch: refetchQuestions } = useQuizQuestions(quiz.id);

  // Memoized computed values to avoid recalculation
  const availableQuestions = useMemo(() => {
    if (quiz.questions?.length > 0) {
      return quiz.questions;
    }
    
    return (directQuestions || []).map(q => ({
      id: q.id,
      questionText: q.question_text,
      questionType: q.question_type as 'multiple_choice' | 'true_false' | 'short_answer',
      options: q.options,
      correctAnswer: q.correct_answer,
      points: q.points,
      explanation: q.explanation
    }));
  }, [quiz.questions, directQuestions]);

  const hasQuestions = availableQuestions.length > 0;
  
  const effectiveQuiz = useMemo(() => ({
    ...quiz,
    questions: availableQuestions
  }), [quiz, availableQuestions]);

  const currentQ = hasQuestions ? effectiveQuiz.questions[currentQuestion] : null;
  const progress = hasQuestions ? ((currentQuestion + 1) / effectiveQuiz.questions.length) * 100 : 0;

  // Initialize answers effect
  useEffect(() => {
    if (effectiveQuiz.questions && effectiveQuiz.questions.length > 0) {
      const initialAnswers: Record<string, string> = {};
      effectiveQuiz.questions.forEach(question => {
        if (question?.id) {
          initialAnswers[question.id] = '';
        }
      });
      setAnswers(initialAnswers);
      console.log('🎯 QuizTaker: Initialized answers for all questions:', initialAnswers);
    }
  }, [effectiveQuiz.questions]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  // Utility functions
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleAnswerChange = useCallback((value: string) => {
    if (currentQ?.id) {
      setAnswers(prev => ({
        ...prev,
        [currentQ.id]: value
      }));
    }
  }, [currentQ?.id]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < effectiveQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, effectiveQuiz.questions.length]);

  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }, [currentQuestion]);

  const calculateResults = useCallback((): QuizResults => {
    let score = 0;
    const maxScore = effectiveQuiz.questions.reduce((sum, q) => sum + (q?.points || 0), 0);

    effectiveQuiz.questions.forEach(question => {
      if (!question) return;
      const userAnswer = answers[question.id] ?? '';

      let isCorrect = false;
      switch (question.questionType) {
        case 'short_answer': {
          const opts = (question as any).options || {};
          const mergedOpts = {
            ...opts,
            acceptedAnswers: Array.isArray(opts?.acceptedAnswers)
              ? opts.acceptedAnswers
              : [],
          };
          isCorrect = evaluateShortAnswer(userAnswer, question.correctAnswer, mergedOpts);
          break;
        }
        case 'true_false':
        case 'multiple_choice':
        default:
          isCorrect = userAnswer === question.correctAnswer;
      }

      if (isCorrect) {
        score += question.points || 0;
      }
    });

    const passed = maxScore > 0 ? (score / maxScore) * 100 >= effectiveQuiz.passingScore : false;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return {
      score,
      maxScore,
      passed,
      answers,
      timeSpent
    };
  }, [effectiveQuiz.questions, effectiveQuiz.passingScore, answers, startTime]);

  const handleSubmit = useCallback(async () => {
    const quizResults = calculateResults();
    setResults(quizResults);
    setShowResults(true);
    
    try {
      // Ensure all questions have entries
      const completeAnswers: Record<string, string> = {};
      effectiveQuiz.questions.forEach(question => {
        if (question?.id) {
          completeAnswers[question.id] = answers[question.id] || '';
        }
      });
      
      // Transform answers to array format for database
      const transformedAnswers = effectiveQuiz.questions.map(question => ({
        question_id: question.id,
        answer: completeAnswers[question.id] || ''
      }));
      
      console.log('📤 QuizTaker: Submitting complete answers:', transformedAnswers);
      
      await submitAttempt.mutateAsync({
        quizId: effectiveQuiz.id,
        answers: transformedAnswers,
        score: quizResults.score,
        maxScore: quizResults.maxScore,
        passed: quizResults.passed,
        timeSpent: quizResults.timeSpent
      });
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  }, [calculateResults, effectiveQuiz.questions, effectiveQuiz.id, answers, submitAttempt]);

  const handleResultsComplete = useCallback(() => {
    if (results) {
      onComplete(results);
    }
  }, [results, onComplete]);

  const renderQuestion = useCallback(() => {
    if (!currentQ) return null;

    switch (currentQ.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {(currentQ.options ?? []).length > 0 ? (currentQ.options ?? []).map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="cursor-pointer flex-1"
                >
                  {option}
                </Label>
              </div>
            )) : (
              <div className="text-muted-foreground text-sm">No options provided</div>
            )}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={answers[currentQ.id] || ''}
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'short_answer':
        return (
          <Textarea
            value={answers[currentQ.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            className="min-h-[100px]"
          />
        );

      default:
        return null;
    }
  }, [currentQ, answers, handleAnswerChange]);

  // Loading state
  if (questionsLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Quiz Questions...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Fetching quiz questions...</p>
              <Progress value={75} className="w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // No questions available
  if (!hasQuestions) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Quiz Questions Not Available
            </CardTitle>
            <CardDescription>
              {quiz.questions?.length === 0 && !directQuestions?.length 
                ? "This quiz has no questions configured."
                : "Unable to load quiz questions. This may be a temporary issue."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>What's happening?</strong> {quiz.questions?.length === 0 && !directQuestions?.length 
                  ? "This quiz was created but doesn't contain any questions yet. An administrator needs to add questions before students can take this quiz."
                  : "The quiz questions couldn't be loaded. This might be due to a temporary network issue or data synchronization problem."}
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <Button onClick={onExit} variant="outline">
                Return to Course
              </Button>
              <Button 
                onClick={() => refetchQuestions()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Loading
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Show Diagnostics
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {showDiagnostics && (
          <QuizDiagnostics 
            quizId={quiz.id} 
            onReload={() => refetchQuestions()} 
          />
        )}
      </div>
    );
  }
  
  // Invalid current question
  if (!currentQ) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Error</CardTitle>
          <CardDescription>Unable to load the current question.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onExit}>Return to Course</Button>
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (showResults && results) {
    const remainingAttempts = effectiveQuiz.maxAttempts - currentAttempts;
    const canRetake = remainingAttempts > 0;

    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {results.passed ? (
              <CheckCircle className="h-16 w-16 text-success" />
            ) : (
              <XCircle className="h-16 w-16 text-destructive" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {results.passed ? 'Congratulations!' : 'Quiz Complete'}
          </CardTitle>
          <CardDescription>
            {results.passed 
              ? 'You have successfully passed the quiz!'
              : canRetake 
                ? `You did not meet the passing score. You have ${remainingAttempts} attempts remaining.`
                : 'You did not meet the passing score. No more attempts available.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">
                {results.score}/{results.maxScore}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {Math.round((results.score / results.maxScore) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Percentage (Need {effectiveQuiz.passingScore}% to pass)
              </div>
            </div>
          </div>

          <div className="text-center">
            <Badge variant={results.passed ? "default" : "destructive"} className="text-sm">
              {results.passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>

          <div className="flex justify-center gap-3">
            {results.passed ? (
              <>
                <Button variant="outline" onClick={canRetake && onRetakeQuiz ? onRetakeQuiz : onExit}>
                  {canRetake && onRetakeQuiz ? 'Retake Course' : 'Return to Course'}
                </Button>
                <Button onClick={handleResultsComplete}>
                  {hasNextModule ? 'Continue to Next Module' : 'Close Course'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={onExit}>
                  Return to Course
                </Button>
                <Button 
                  onClick={handleResultsComplete} 
                  disabled={!canRetake}
                >
                  {canRetake ? 'Try Again' : 'No Attempts Left'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main quiz interface
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{effectiveQuiz.title}</CardTitle>
              <CardDescription>{effectiveQuiz.description}</CardDescription>
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 300 ? "text-destructive font-semibold" : ""}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Question {currentQuestion + 1} of {effectiveQuiz.questions.length}</span>
              <div className="flex items-center gap-2">
                <span>{Math.round(progress)}% complete</span>
                {answers[currentQ.id] && answers[currentQ.id].trim() !== '' ? (
                  <Badge variant="default" className="text-xs px-2 py-0">Answered</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs px-2 py-0">Unanswered</Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentQ.questionText}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderQuestion()}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentQuestion === effectiveQuiz.questions.length - 1 ? (
                <Button onClick={handleSubmit} className="gap-2">
                  Submit Quiz
                </Button>
              ) : (
                <Button onClick={nextQuestion} className="gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Question Progress</span>
            <span>{effectiveQuiz.questions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length} of {effectiveQuiz.questions.length} answered</span>
          </div>
          <div className="grid grid-cols-10 gap-2">
            {effectiveQuiz.questions.map((question, index) => (
              <Button
                key={question.id}
                variant={currentQuestion === index ? "default" : "outline"}
                size="sm"
                className={`w-full h-8 ${
                  answers[question.id] && answers[question.id].trim() !== ''
                    ? currentQuestion === index 
                      ? "bg-primary" 
                      : "bg-success hover:bg-success/90"
                    : ""
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaker;