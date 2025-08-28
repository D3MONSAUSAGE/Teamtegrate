import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, PenTool, MessageSquare } from 'lucide-react';
import { useTrainingCourses, useTrainingModules, useCreateQuiz } from '@/hooks/useTrainingData';

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
  
  const { data: courses = [] } = useTrainingCourses();
  const { data: modules = [] } = useTrainingModules(selectedCourse);
  const createQuizMutation = useCreateQuiz();

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
    if (!quizData.title || !quizData.module_id || questions.length === 0) {
      return;
    }

    try {
      await createQuizMutation.mutateAsync({
        quiz: quizData,
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
        </DialogHeader>

        <div className="space-y-6">
          {/* Quiz Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Quiz Title</Label>
                  <Input
                    id="title"
                    value={quizData.title}
                    onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                    placeholder="Enter quiz title"
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger>
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
                  <Label htmlFor="module">Module</Label>
                  <Select value={quizData.module_id} onValueChange={(value) => setQuizData({ ...quizData, module_id: value })}>
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
                <CardTitle className="text-lg">Questions ({questions.length})</CardTitle>
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
                      <Label>Question Text</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(questionIndex, 'question_text', e.target.value)}
                        placeholder="Enter your question"
                        rows={2}
                      />
                    </div>

                    {question.question_type === 'multiple_choice' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Answer Options</Label>
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
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
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
                        <Label>Correct Answer</Label>
                        <Input
                          value={question.correct_answer}
                          onChange={(e) => updateQuestion(questionIndex, 'correct_answer', e.target.value)}
                          placeholder="Enter the correct answer"
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
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No questions added yet. Click "Add Question" to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!quizData.title || !quizData.module_id || questions.length === 0 || createQuizMutation.isPending}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {createQuizMutation.isPending ? 'Creating...' : 'Create Quiz'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizCreator;