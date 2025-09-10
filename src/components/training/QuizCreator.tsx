import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, PenTool, MessageSquare, Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useTrainingCourses, useTrainingModules, useCreateQuiz } from '@/hooks/useTrainingData';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  question_text: string;
  question_type: 'multiple_choice' | 'short_answer';
  options?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

interface QuizCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ open, onOpenChange }) => {
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    module_id: '',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: null as number | null
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const { user } = useAuth();
  const { data: courses = [] } = useTrainingCourses();
  const { data: modules = [] } = useTrainingModules(selectedCourse);
  const createQuizMutation = useCreateQuiz();

  const validateQuiz = () => {
    const errors: string[] = [];
    
    if (!quizData.title.trim()) {
      errors.push('Quiz title is required');
    }
    
    if (!isStandalone && !quizData.module_id) {
      errors.push('Please select a module for module-based quizzes');
    }
    
    if (questions.length === 0) {
      errors.push('At least one question is required');
    }
    
    questions.forEach((question, index) => {
      if (!question.question_text.trim()) {
        errors.push(`Question ${index + 1} text is required`);
      }
      
      if (!question.correct_answer.trim()) {
        errors.push(`Question ${index + 1} must have a correct answer`);
      }
      
      if (question.question_type === 'multiple_choice') {
        const validOptions = question.options?.filter(opt => opt.trim()) || [];
        if (validOptions.length < 2) {
          errors.push(`Question ${index + 1} needs at least 2 valid options`);
        }
        
        if (!question.options?.includes(question.correct_answer)) {
          errors.push(`Question ${index + 1} correct answer must match one of the options`);
        }
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      explanation: ''
    }]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = [...(updated[questionIndex].options || []), ''];
    setQuestions(updated);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questions];
    updated[questionIndex].options![optionIndex] = value;
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options!.filter((_, i) => i !== optionIndex);
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateQuiz()) {
      return;
    }

    try {
      const quizPayload = {
        ...quizData,
        module_id: isStandalone ? null : quizData.module_id,
        organization_id: user?.organizationId
      };
      
      await createQuizMutation.mutateAsync({
        quiz: quizPayload,
        questions: questions
      });
      
      // Reset form
      setQuizData({
        title: '',
        description: '',
        module_id: '',
        passing_score: 70,
        max_attempts: 3,
        time_limit_minutes: null
      });
      setQuestions([]);
      setSelectedCourse('');
      setValidationErrors([]);
      setShowPreview(false);
      setIsStandalone(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create quiz:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
              <PenTool className="h-5 w-5 text-emerald-600" />
            </div>
            Create New Quiz
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              disabled={questions.length === 0}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{questions.length} questions</span>
              </div>
              {quizData.time_limit_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>{quizData.time_limit_minutes}min</span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert className="border-destructive/50 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Please fix the following issues:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Indicator */}
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Quiz Creation Progress</span>
                  <span>{Math.round(((quizData.title ? 1 : 0) + (isStandalone || quizData.module_id ? 1 : 0) + (questions.length > 0 ? 2 : 0)) / 4 * 100)}%</span>
                </div>
                <Progress 
                  value={((quizData.title ? 1 : 0) + (isStandalone || quizData.module_id ? 1 : 0) + (questions.length > 0 ? 2 : 0)) / 4 * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className={quizData.title ? 'text-green-600' : ''}>✓ Title</span>
                  <span className={isStandalone || quizData.module_id ? 'text-green-600' : ''}>✓ {isStandalone ? 'Standalone' : 'Module'}</span>
                  <span className={questions.length > 0 ? 'text-green-600' : ''}>✓ Questions</span>
                  <span className={validationErrors.length === 0 && questions.length > 0 ? 'text-green-600' : ''}>✓ Ready</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {showPreview ? (
            /* Quiz Preview */
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2 p-6 bg-muted/50 rounded-lg">
                  <h3 className="text-xl font-semibold">{quizData.title || 'Untitled Quiz'}</h3>
                  <p className="text-muted-foreground">{quizData.description || 'No description provided'}</p>
                  <div className="flex justify-center gap-4 text-sm">
                    <Badge variant="outline">{questions.length} questions</Badge>
                    <Badge variant="outline">{quizData.passing_score}% to pass</Badge>
                    <Badge variant="outline">{quizData.max_attempts} max attempts</Badge>
                    {quizData.time_limit_minutes && (
                      <Badge variant="outline">{quizData.time_limit_minutes} minutes</Badge>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <Card key={index} className="border-l-4 border-l-emerald-500">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">Q{index + 1}: {question.question_text || 'Question text not set'}</h4>
                            <Badge variant="secondary">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
                          </div>
                          
                          {question.question_type === 'multiple_choice' && (
                            <div className="space-y-2">
                              {question.options?.map((option, i) => (
                                <div key={i} className={`p-2 rounded border ${
                                  option === question.correct_answer ? 'bg-green-50 border-green-200' : ''
                                }`}>
                                  {String.fromCharCode(65 + i)}. {option || `Option ${i + 1} (empty)`}
                                  {option === question.correct_answer && ' ✓'}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {question.question_type === 'short_answer' && (
                            <div className="p-2 bg-muted rounded">
                              Expected answer: {question.correct_answer || 'Not set'}
                            </div>
                          )}
                          
                          {question.explanation && (
                            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No questions to preview. Add some questions first.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Quiz Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quiz Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quiz Type Selection */}
                  <div className="space-y-3">
                    <Label>Quiz Type</Label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={!isStandalone ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setIsStandalone(false);
                          setQuizData({ ...quizData, module_id: '' });
                          if (validationErrors.length > 0) validateQuiz();
                        }}
                        className="gap-2"
                      >
                        📚 Module Quiz
                      </Button>
                      <Button
                        type="button"
                        variant={isStandalone ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setIsStandalone(true);
                          setQuizData({ ...quizData, module_id: '' });
                          setSelectedCourse('');
                          if (validationErrors.length > 0) validateQuiz();
                        }}
                        className="gap-2"
                      >
                        ⚡ Standalone Quiz
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isStandalone 
                        ? "Create an independent quiz not tied to any course or module" 
                        : "Create a quiz that belongs to a specific course module"
                      }
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Quiz Title *</Label>
                      <Input
                        id="title"
                        value={quizData.title}
                        onChange={(e) => {
                          setQuizData({ ...quizData, title: e.target.value });
                          if (validationErrors.length > 0) validateQuiz();
                        }}
                        placeholder="Enter quiz title"
                        className={!quizData.title && validationErrors.length > 0 ? 'border-destructive' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passing-score">Passing Score (%)</Label>
                      <Input
                        id="passing-score"
                        type="number"
                        value={quizData.passing_score}
                        onChange={(e) => setQuizData({ ...quizData, passing_score: parseInt(e.target.value) || 70 })}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={quizData.description}
                      onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                      placeholder="Enter quiz description"
                      rows={3}
                    />
                  </div>

                  {!isStandalone && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="course">Course *</Label>
                        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                          <SelectTrigger className={!selectedCourse && validationErrors.length > 0 ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map((course: any) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="module">Module *</Label>
                        <Select 
                          value={quizData.module_id} 
                          onValueChange={(value) => {
                            setQuizData({ ...quizData, module_id: value });
                            if (validationErrors.length > 0) validateQuiz();
                          }}
                        >
                          <SelectTrigger className={!quizData.module_id && validationErrors.length > 0 ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select module" />
                          </SelectTrigger>
                          <SelectContent>
                            {modules.map((module: any) => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="max-attempts">Max Attempts</Label>
                    <Input
                      id="max-attempts"
                      type="number"
                      value={quizData.max_attempts}
                      onChange={(e) => setQuizData({ ...quizData, max_attempts: parseInt(e.target.value) || 3 })}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time-limit">Time Limit (minutes, optional)</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      value={quizData.time_limit_minutes || ''}
                      onChange={(e) => setQuizData({ ...quizData, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="No time limit"
                      min="1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Questions */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">Questions ({questions.length})</CardTitle>
                      {questions.length === 0 && (
                        <p className="text-sm text-muted-foreground">Add at least one question to create the quiz</p>
                      )}
                    </div>
                    <Button onClick={addQuestion} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="border-l-4 border-l-emerald-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Question {questionIndex + 1}</Badge>
                            <Select
                              value={question.question_type}
                              onValueChange={(value: 'multiple_choice' | 'short_answer') => 
                                updateQuestion(questionIndex, 'question_type', value)
                              }
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="short_answer">Short Answer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(questionIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question Text *</Label>
                          <Textarea
                            value={question.question_text}
                            onChange={(e) => {
                              updateQuestion(questionIndex, 'question_text', e.target.value);
                              if (validationErrors.length > 0) validateQuiz();
                            }}
                            placeholder="Enter your question"
                            rows={2}
                            className={!question.question_text && validationErrors.length > 0 ? 'border-destructive' : ''}
                          />
                        </div>

                        {question.question_type === 'multiple_choice' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Answer Options *</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addOption(questionIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Option
                              </Button>
                            </div>
                            {question.options?.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => {
                                    updateOption(questionIndex, optionIndex, e.target.value);
                                    if (validationErrors.length > 0) validateQuiz();
                                  }}
                                  placeholder={`Option ${optionIndex + 1}`}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuestion(questionIndex, 'correct_answer', option)}
                                  className={question.correct_answer === option ? 'bg-emerald-100 border-emerald-300' : ''}
                                >
                                  {question.correct_answer === option ? '✓' : 'Set as Correct'}
                                </Button>
                                {question.options!.length > 2 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(questionIndex, optionIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.question_type === 'short_answer' && (
                          <div className="space-y-2">
                            <Label>Correct Answer *</Label>
                            <Input
                              value={question.correct_answer}
                              onChange={(e) => {
                                updateQuestion(questionIndex, 'correct_answer', e.target.value);
                                if (validationErrors.length > 0) validateQuiz();
                              }}
                              placeholder="Enter the correct answer"
                              className={!question.correct_answer && validationErrors.length > 0 ? 'border-destructive' : ''}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={question.points}
                              onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                              min="1"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Explanation (optional)</Label>
                            <Input
                              value={question.explanation}
                              onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                              placeholder="Explain the correct answer"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No questions added yet</p>
                      <p className="text-sm mt-2">Click "Add Question" above to create your first question.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {questions.length === 0 ? (
              <span className="text-amber-600">⚠️ Add at least one question to create the quiz</span>
            ) : validationErrors.length > 0 ? (
              <span className="text-destructive">⚠️ Please fix validation errors above</span>
            ) : (
              <span className="text-green-600">✅ Quiz is ready to be created</span>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!quizData.title || (!isStandalone && !quizData.module_id) || questions.length === 0 || validationErrors.length > 0 || createQuizMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {createQuizMutation.isPending ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizCreator;