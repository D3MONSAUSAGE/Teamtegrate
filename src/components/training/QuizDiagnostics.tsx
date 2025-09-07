import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useQuiz } from '@/hooks/useTrainingData';
import { useQuizQuestions, useQuizQuestionCount } from '@/hooks/useQuizQuestions';

interface QuizDiagnosticsProps {
  quizId: string;
  onReload?: () => void;
}

/**
 * Quiz Data Diagnostics Panel
 * Helps debug quiz question retrieval issues by showing detailed data status
 */
const QuizDiagnostics: React.FC<QuizDiagnosticsProps> = ({ quizId, onReload }) => {
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuiz(quizId);
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuizQuestions(quizId);
  const { data: questionCount } = useQuizQuestionCount(quizId);

  const embeddedQuestions = quiz?.quiz_questions || [];
  const directQuestions = questions || [];
  
  const hasEmbeddedQuestions = embeddedQuestions.length > 0;
  const hasDirectQuestions = directQuestions.length > 0;
  const questionsMatch = embeddedQuestions.length === directQuestions.length;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          Quiz Data Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quiz Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Quiz Data</h4>
            <div className="flex items-center gap-2">
              {quizLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : quizError ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : quiz ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {quizLoading ? 'Loading...' : 
                 quizError ? 'Error' : 
                 quiz ? 'Loaded' : 'Not Found'}
              </span>
            </div>
            {quiz && (
              <div className="text-xs text-muted-foreground">
                ID: {quiz.id}<br />
                Title: {quiz.title}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Embedded Questions</h4>
            <div className="flex items-center gap-2">
              {hasEmbeddedQuestions ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={hasEmbeddedQuestions ? "default" : "destructive"}>
                {embeddedQuestions.length} questions
              </Badge>
            </div>
            {!hasEmbeddedQuestions && (
              <p className="text-xs text-red-600">
                PostgREST embed may be failing
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Direct Questions</h4>
            <div className="flex items-center gap-2">
              {questionsLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : questionsError ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : hasDirectQuestions ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-500" />
              )}
              <Badge variant={hasDirectQuestions ? "default" : "outline"}>
                {directQuestions.length} questions
              </Badge>
            </div>
            {questionCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                DB Count: {questionCount}
              </p>
            )}
          </div>
        </div>

        {/* Data Consistency Check */}
        <div className="p-3 rounded-lg border">
          <h4 className="font-medium mb-2">Data Consistency</h4>
          <div className="flex items-center gap-2">
            {questionsMatch && hasDirectQuestions ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">Questions data is consistent</span>
              </>
            ) : !hasDirectQuestions ? (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">No questions found in database</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700">
                  Embedded: {embeddedQuestions.length}, Direct: {directQuestions.length}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Error Details */}
        {(quizError || questionsError) && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Error Details</h4>
            {quizError && (
              <p className="text-sm text-red-700 mb-1">
                Quiz Error: {quizError.message}
              </p>
            )}
            {questionsError && (
              <p className="text-sm text-red-700">
                Questions Error: {questionsError.message}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReload}
            className="gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Reload Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('🔍 Quiz Diagnostics:', {
                quizId,
                quiz,
                embeddedQuestions,
                directQuestions,
                questionCount,
                quizError,
                questionsError
              });
            }}
          >
            Log Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizDiagnostics;