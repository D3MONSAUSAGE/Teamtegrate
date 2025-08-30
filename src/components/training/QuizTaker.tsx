import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useSubmitQuizAttempt } from '@/hooks/useTrainingData';

interface QuizQuestion {
  id: string;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
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
}

interface QuizResults {
  score: number;
  maxScore: number;
  passed: boolean;
  answers: Record<string, string>;
  timeSpent: number;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, onComplete, onExit }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : null
  );
  const [startTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const submitAttempt = useSubmitQuizAttempt();

  // Safety checks for quiz data
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Error</CardTitle>
          <CardDescription>This quiz has no questions available.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onExit}>Return to Course</Button>
        </CardContent>
      </Card>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  // Additional safety check for current question
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
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = (): QuizResults => {
    let score = 0;
    const maxScore = quiz.questions.reduce((sum, q) => sum + (q?.points || 0), 0);

    quiz.questions.forEach(question => {
      if (!question) return;
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        score += question.points || 0;
      }
    });

    const passed = maxScore > 0 ? (score / maxScore) * 100 >= quiz.passingScore : false;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return {
      score,
      maxScore,
      passed,
      answers,
      timeSpent
    };
  };

  const handleSubmit = async () => {
    const quizResults = calculateResults();
    setResults(quizResults);
    setShowResults(true);
    
    try {
      // Transform answers to array format for database
      const transformedAnswers = quiz.questions.map(question => ({
        question_id: question.id,
        answer: answers[question.id] || ''
      }));
      
      await submitAttempt.mutateAsync({
        quizId: quiz.id,
        answers: transformedAnswers,
        score: quizResults.score,
        maxScore: quizResults.maxScore,
        passed: quizResults.passed,
        timeSpent: quizResults.timeSpent
      });
      
      onComplete(quizResults);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    }
  };

  const renderQuestion = () => {
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
  };

  if (showResults && results) {
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
              : 'You did not meet the passing score. You can try again.'
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
                Percentage (Need {quiz.passingScore}% to pass)
              </div>
            </div>
          </div>

          <div className="text-center">
            <Badge variant={results.passed ? "default" : "destructive"} className="text-sm">
              {results.passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>

          <div className="flex justify-center">
            <Button onClick={onExit}>
              {results.passed ? 'Continue to Next Module' : 'Return to Course'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <CardDescription>{quiz.description}</CardDescription>
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
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Question {currentQuestion + 1}
            <Badge variant="outline" className="ml-2">
              {currentQ.points} {currentQ.points === 1 ? 'point' : 'points'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-base">
            {currentQ.questionText}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderQuestion()}
        </CardContent>
      </Card>

      {/* Navigation */}
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
          <Button variant="outline" onClick={onExit}>
            Exit Quiz
          </Button>
          
          {currentQuestion === quiz.questions.length - 1 ? (
            <Button 
              onClick={handleSubmit} 
              disabled={submitAttempt.isPending}
              className="gap-2"
            >
              {submitAttempt.isPending ? 'Submitting...' : 'Submit Quiz'}
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              disabled={!answers[currentQ.id]}
              className="gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;