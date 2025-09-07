import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  Shield,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface QuizAttemptFallbackViewProps {
  selectedAttempt: any;
  quiz: any;
  quizData: any;
  quizError: any;
  overrides: any[];
  getAnswerStatus: (userAnswer: string, question: any) => boolean;
  isAdmin: boolean;
  handleOverrideClick: (question: any, userAnswer: any) => void;
  handleRemoveOverride: (overrideId: string) => Promise<void>;
  deleteOverrideMutation: any;
}

const QuizAttemptFallbackView: React.FC<QuizAttemptFallbackViewProps> = ({
  selectedAttempt,
  quiz,
  quizData,
  quizError,
  overrides,
  getAnswerStatus,
  isAdmin,
  handleOverrideClick,
  handleRemoveOverride,
  deleteOverrideMutation
}) => {
  const [manualQuestions, setManualQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Enhanced direct question fetching with multiple strategies
  useEffect(() => {
    const fetchQuestionsDirectly = async () => {
      if (!quizData?.quizId || quiz?.quiz_questions?.length > 0) return;
      
      setLoadingQuestions(true);
      try {
        console.log('📋 Attempting direct quiz_questions fetch for quiz:', quizData.quizId);
        
        // Strategy 1: Direct quiz_questions fetch
        let { data: questions, error } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizData.quizId)
          .order('question_order', { ascending: true });

        if (error || !questions?.length) {
          console.warn('⚠️ Direct questions fetch failed/empty, trying alternative approach:', error?.message);
          
          // Strategy 2: Fetch via quiz table with questions
          const { data: quizWithQuestions, error: quizError } = await supabase
            .from('quizzes')
            .select(`
              id,
              title,
              quiz_questions(*)
            `)
            .eq('id', quizData.quizId)
            .single();
          
          if (quizError) {
            console.error('❌ Alternative quiz fetch also failed:', quizError);
          } else {
            console.log('✅ Got questions via quiz table:', quizWithQuestions?.quiz_questions?.length || 0);
            questions = quizWithQuestions?.quiz_questions || [];
          }
        }
        
        if (questions?.length) {
          console.log('✅ Successfully fetched questions:', {
            count: questions.length,
            firstQuestionPreview: questions[0] ? {
              id: questions[0].id,
              type: questions[0].question_type,
              text: questions[0].question_text?.substring(0, 50) + '...'
            } : null
          });
          setManualQuestions(questions);
        } else {
          console.warn('⚠️ No questions found for quiz:', quizData.quizId);
        }
      } catch (error) {
        console.error('❌ Exception in fetchQuestionsDirectly:', error);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestionsDirectly();
  }, [quizData?.quizId, quiz?.quiz_questions?.length]);

  const questionsToUse = quiz?.quiz_questions?.length > 0 ? quiz.quiz_questions : manualQuestions;
  const hasQuestions = questionsToUse?.length > 0;

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

    const isCorrect = getAnswerStatus(userAnswer?.answer || '', question);
    return {
      score: isCorrect ? question.points : 0,
      isOverridden: false,
      override: null,
      originalScore: isCorrect ? question.points : 0
    };
  };

  return (
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
            <p className="text-2xl font-bold">{Math.round((selectedAttempt.score / selectedAttempt.max_score) * 100)}%</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Points:</span>
            <p className="text-2xl font-bold">{selectedAttempt.score}/{selectedAttempt.max_score}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Status:</span>
            <p className={`text-2xl font-bold ${selectedAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAttempt.passed ? 'PASSED' : 'FAILED'}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Date:</span>
            <p className="text-lg font-bold">{format(new Date(selectedAttempt.started_at), 'MMM d')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Data Loading Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Quiz Hook:</strong> {quiz ? '✅ Success' : '❌ Failed'}</p>
              <p><strong>Quiz ID:</strong> <code className="text-xs bg-white px-1 rounded">{quizData?.quizId}</code></p>
              <p><strong>Quiz Title:</strong> {quiz?.title || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Hook Questions:</strong> {quiz?.quiz_questions?.length || 0}</p>
              <p><strong>Direct Questions:</strong> {manualQuestions.length}</p>
              <p><strong>Loading:</strong> {loadingQuestions ? '⏳ Yes' : '✅ No'}</p>
            </div>
          </div>
          {quizError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {quizError.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Display */}
      {hasQuestions ? (
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Questions & Answers ({questionsToUse.length} questions)
            </h3>
            
            {questionsToUse.map((question: any, index: number) => {
              const userAnswer = selectedAttempt.answers?.find((a: any) => a.question_id === question.id);
              const scoreInfo = getQuestionScore(question, userAnswer);
              const isCorrect = !scoreInfo.isOverridden && scoreInfo.score > 0;

              return (
                <Card key={question.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        Question {index + 1} of {questionsToUse.length}
                        {scoreInfo.isOverridden && (
                        <Shield className="h-4 w-4 text-orange-600" />
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
                        {question.question_type?.replace('_', ' ') || 'Unknown Type'}
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
        </ScrollArea>
      ) : (
        <>
          {/* Error/No Questions State */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-700 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">
                  {loadingQuestions ? 'Loading questions...' : 'Quiz questions not available'}
                </p>
                <p className="text-sm text-yellow-700">
                  {loadingQuestions ? 'Attempting to load quiz questions directly from database.' :
                   !quiz ? 'Quiz not found in database.' : 
                   !quiz.quiz_questions && manualQuestions.length === 0 ? 'Quiz exists but has no questions configured.' :
                   quiz.quiz_questions?.length === 0 && manualQuestions.length === 0 ? 'Quiz has no questions.' :
                   'Unknown issue loading questions.'}
                </p>
                <div className="mt-2 space-y-1 text-xs text-yellow-600">
                  <p>Quiz ID: <code className="bg-yellow-100 px-1 rounded">{quizData?.quizId}</code></p>
                  {quiz && <p>Quiz Title: {quiz.title}</p>}
                  {quizError && <p>Error: {quizError.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Raw Answers Fallback */}
          {selectedAttempt.answers?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Raw Answers ({selectedAttempt.answers.length} answers)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedAttempt.answers.map((answer: any, idx: number) => (
                    <div key={answer.question_id || idx} className="p-3 rounded border bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            Question ID: <code className="bg-white px-1 rounded text-xs">{answer.question_id}</code>
                          </p>
                          <p className="font-medium text-gray-900">{answer.answer || 'No answer provided'}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Answer #{idx + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default QuizAttemptFallbackView;