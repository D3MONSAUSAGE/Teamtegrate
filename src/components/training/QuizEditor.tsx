import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, GripVertical, Eye } from "lucide-react";
import { useUpdateQuiz, useDeleteQuiz, useTrainingModules } from "@/hooks/useTrainingData";
import { enhancedNotifications } from "@/utils/enhancedNotifications";

interface QuizQuestion {
  id?: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
  question_order: number;
}

interface QuizEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quiz?: any;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ open, onOpenChange, quiz }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module_id: '',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: null as number | null
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const updateQuizMutation = useUpdateQuiz();
  const deleteQuizMutation = useDeleteQuiz();
  
  // Debug logging to understand quiz structure
  useEffect(() => {
    if (quiz && open) {
      console.log('🔍 QuizEditor: Quiz data structure:', {
        quiz,
        training_modules: quiz.training_modules,
        course_id_path: quiz?.training_modules?.course_id,
        module_id: quiz.module_id
      });
    }
  }, [quiz, open]);
  
  // Get course ID from quiz to fetch modules - Fixed path
  const courseId = quiz?.training_modules?.course_id;
  const { data: modules = [] } = useTrainingModules(courseId);

  useEffect(() => {
    if (quiz && open) {
      console.log('📝 QuizEditor: Loading form data for quiz:', quiz.id);
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        module_id: quiz.module_id || '',
        passing_score: quiz.passing_score || 70,
        max_attempts: quiz.max_attempts || 3,
        time_limit_minutes: quiz.time_limit_minutes
      });
      
      // Load existing questions
      setQuestions(quiz.quiz_questions?.map((q: any, index: number) => ({
        id: q.id,
        question_text: q.question_text || '',
        question_type: q.question_type || 'multiple_choice',
        options: q.options || [],
        correct_answer: q.correct_answer || '',
        points: q.points || 1,
        explanation: q.explanation || '',
        question_order: q.question_order || index + 1
      })) || []);
    } else if (!open) {
      // Reset form when modal closes
      setFormData({
        title: '',
        description: '',
        module_id: '',
        passing_score: 70,
        max_attempts: 3,
        time_limit_minutes: null
      });
      setQuestions([]);
      setPreviewMode(false);
    }
  }, [quiz, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quiz?.id) return;

    try {
      await updateQuizMutation.mutateAsync({
        quizId: quiz.id,
        quiz: formData,
        questions: questions
      });
      
      enhancedNotifications.success('Quiz updated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating quiz:', error);
      enhancedNotifications.error('Failed to update quiz');
    }
  };

  const handleDelete = async () => {
    if (!quiz?.id) return;

    try {
      await deleteQuizMutation.mutateAsync(quiz.id);
      enhancedNotifications.success('Quiz deleted successfully!');
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      enhancedNotifications.error('Failed to delete quiz');
    }
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 1,
      explanation: '',
      question_order: questions.length + 1
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    // Reorder remaining questions
    updatedQuestions.forEach((question, i) => {
      question.question_order = i + 1;
    });
    setQuestions(updatedQuestions);
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    const options = [...(updatedQuestions[questionIndex].options || [])];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };

  const renderQuestionForm = (question: QuizQuestion, index: number) => (
    <Card key={index}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
            Question {question.question_order}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeQuestion(index)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Question Text</Label>
          <Textarea
            value={question.question_text}
            onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
            placeholder="Enter your question"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label>Question Type</Label>
            <Select
              value={question.question_type}
              onValueChange={(value) => updateQuestion(index, 'question_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="true_false">True/False</SelectItem>
                <SelectItem value="short_answer">Short Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Points</Label>
            <Input
              type="number"
              min="1"
              value={question.points}
              onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Correct Answer</Label>
            {question.question_type === 'multiple_choice' ? (
              <Select
                value={question.correct_answer}
                onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select correct option" />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option, i) => (
                    <SelectItem key={i} value={option} disabled={!option.trim()}>
                      Option {i + 1}: {option || 'Empty'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : question.question_type === 'true_false' ? (
              <Select
                value={question.correct_answer}
                onValueChange={(value) => updateQuestion(index, 'correct_answer', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">True</SelectItem>
                  <SelectItem value="false">False</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={question.correct_answer}
                onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                placeholder="Enter correct answer"
              />
            )}
          </div>
        </div>

        {/* Options for multiple choice */}
        {question.question_type === 'multiple_choice' && (
          <div className="space-y-2">
            <Label>Answer Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.options?.map((option, optionIndex) => (
                <Input
                  key={optionIndex}
                  value={option}
                  onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Explanation (Optional)</Label>
          <Textarea
            value={question.explanation || ''}
            onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
            placeholder="Explain the correct answer"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );

  if (!quiz) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Edit Quiz</DialogTitle>
                <DialogDescription>
                  Modify quiz settings and questions
                </DialogDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
            </div>
          </DialogHeader>

          {previewMode ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">{formData.title}</h3>
                <p className="text-muted-foreground">{formData.description}</p>
                <div className="flex justify-center gap-4 text-sm">
                  <Badge variant="outline">{questions.length} questions</Badge>
                  <Badge variant="outline">{formData.passing_score}% to pass</Badge>
                  {formData.time_limit_minutes && (
                    <Badge variant="outline">{formData.time_limit_minutes} minutes</Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium">Q{index + 1}: {question.question_text}</h4>
                          <Badge variant="secondary">{question.points} pt{question.points !== 1 ? 's' : ''}</Badge>
                        </div>
                        
                        {question.question_type === 'multiple_choice' && (
                          <div className="space-y-2">
                            {question.options?.map((option, i) => (
                              <div key={i} className={`p-2 rounded border ${
                                option === question.correct_answer ? 'bg-green-50 border-green-200' : ''
                              }`}>
                                {String.fromCharCode(65 + i)}. {option}
                                {option === question.correct_answer && ' ✓'}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {question.question_type === 'true_false' && (
                          <div className="flex gap-4">
                            <div className={`p-2 rounded border ${
                              question.correct_answer === 'true' ? 'bg-green-50 border-green-200' : ''
                            }`}>
                              True {question.correct_answer === 'true' && '✓'}
                            </div>
                            <div className={`p-2 rounded border ${
                              question.correct_answer === 'false' ? 'bg-green-50 border-green-200' : ''
                            }`}>
                              False {question.correct_answer === 'false' && '✓'}
                            </div>
                          </div>
                        )}
                        
                        {question.question_type === 'short_answer' && (
                          <div className="p-2 bg-muted rounded">
                            Expected answer: {question.correct_answer}
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
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter quiz title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="module">Module</Label>
                  <Select
                    value={formData.module_id}
                    onValueChange={(value) => setFormData({ ...formData, module_id: value })}
                  >
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Quiz description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passing_score">Passing Score (%)</Label>
                  <Input
                    id="passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_attempts">Max Attempts</Label>
                  <Input
                    id="max_attempts"
                    type="number"
                    min="1"
                    value={formData.max_attempts}
                    onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time_limit">Time Limit (minutes)</Label>
                  <Input
                    id="time_limit"
                    type="number"
                    min="1"
                    value={formData.time_limit_minutes || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="No limit"
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Quiz Questions</h3>
                  <Button type="button" onClick={addQuestion} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {questions.map((question, index) => renderQuestionForm(question, index))}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteQuizMutation.isPending}
                >
                  Delete Quiz
                </Button>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateQuizMutation.isPending}>
                  {updateQuizMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Quiz
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{quiz?.title}"? This action cannot be undone and will also delete all quiz attempts and results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteQuizMutation.isPending}
            >
              {deleteQuizMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuizEditor;