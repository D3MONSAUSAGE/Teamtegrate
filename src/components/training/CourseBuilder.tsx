import React, { useState } from 'react';
import { Plus, Save, Video, FileText, HelpCircle, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';

interface Module {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz';
  content: {
    youtubeId?: string;
    textContent?: string;
    quiz?: {
      title: string;
      questions: Array<{
        id: string;
        text: string;
        type: 'multiple_choice' | 'true_false' | 'short_answer';
        options?: string[];
        correctAnswer: string;
      }>;
    };
  };
  order: number;
}

interface CourseBuilderProps {
  courseId?: string;
  initialData?: {
    title: string;
    description: string;
    difficulty: string;
    modules: Module[];
  };
  onSave: (courseData: any) => void;
  onCancel: () => void;
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({
  courseId,
  initialData,
  onSave,
  onCancel
}) => {
  const [courseTitle, setCourseTitle] = useState(initialData?.title || '');
  const [courseDescription, setCourseDescription] = useState(initialData?.description || '');
  const [courseDifficulty, setCourseDifficulty] = useState(initialData?.difficulty || 'beginner');
  const [modules, setModules] = useState<Module[]>(initialData?.modules || []);
  const [isActive, setIsActive] = useState(true);

  const addModule = (type: 'video' | 'text' | 'quiz') => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: `New ${type} module`,
      description: '',
      type,
      content: {},
      order: modules.length
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, ...updates } : module
    ));
  };

  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(module => module.id !== moduleId));
  };

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    const moduleIndex = modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const newModules = [...modules];
    const targetIndex = direction === 'up' ? moduleIndex - 1 : moduleIndex + 1;

    if (targetIndex >= 0 && targetIndex < modules.length) {
      [newModules[moduleIndex], newModules[targetIndex]] = [newModules[targetIndex], newModules[moduleIndex]];
      setModules(newModules);
    }
  };

  const handleSave = () => {
    const courseData = {
      id: courseId,
      title: courseTitle,
      description: courseDescription,
      difficulty: courseDifficulty,
      isActive,
      modules: modules.map((module, index) => ({ ...module, order: index }))
    };
    onSave(courseData);
  };

  const renderModuleContent = (module: Module) => {
    switch (module.type) {
      case 'video':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`youtube-${module.id}`}>YouTube Video ID</Label>
              <Input
                id={`youtube-${module.id}`}
                placeholder="e.g., dQw4w9WgXcQ"
                value={module.content.youtubeId || ''}
                onChange={(e) => updateModule(module.id, {
                  content: { ...module.content, youtubeId: e.target.value }
                })}
              />
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`text-${module.id}`}>Content</Label>
              <Textarea
                id={`text-${module.id}`}
                placeholder="Enter the text content for this module..."
                value={module.content.textContent || ''}
                onChange={(e) => updateModule(module.id, {
                  content: { ...module.content, textContent: e.target.value }
                })}
                className="min-h-[200px]"
              />
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`quiz-title-${module.id}`}>Quiz Title</Label>
              <Input
                id={`quiz-title-${module.id}`}
                placeholder="Enter quiz title..."
                value={module.content.quiz?.title || ''}
                onChange={(e) => updateModule(module.id, {
                  content: {
                    ...module.content,
                    quiz: {
                      ...module.content.quiz,
                      title: e.target.value,
                      questions: module.content.quiz?.questions || []
                    }
                  }
                })}
              />
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {courseId ? 'Edit Course' : 'Create New Course'}
          </h1>
          <p className="text-muted-foreground">
            Build engaging training content with videos, text, and quizzes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!courseTitle.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Save Course
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>
                Basic information about your training course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="course-title">Course Title</Label>
                <Input
                  id="course-title"
                  placeholder="Enter course title..."
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="course-description">Description</Label>
                <Textarea
                  id="course-description"
                  placeholder="Describe what learners will gain from this course..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="course-difficulty">Difficulty Level</Label>
                <Select value={courseDifficulty} onValueChange={setCourseDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Course Modules</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => addModule('video')}>
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button variant="outline" size="sm" onClick={() => addModule('text')}>
                <FileText className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button variant="outline" size="sm" onClick={() => addModule('quiz')}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Quiz
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {modules.map((module, index) => (
              <Card key={module.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <Badge variant="outline">
                        {module.type}
                      </Badge>
                      <div>
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(module.id, { title: e.target.value })}
                          className="font-medium border-none shadow-none p-0 h-auto"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveModule(module.id, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveModule(module.id, 'down')}
                        disabled={index === modules.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteModule(module.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Module description..."
                    value={module.description}
                    onChange={(e) => updateModule(module.id, { description: e.target.value })}
                    className="text-sm"
                  />
                </CardHeader>
                <CardContent>
                  {renderModuleContent(module)}
                </CardContent>
              </Card>
            ))}

            {modules.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground">No modules yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add your first module to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Settings</CardTitle>
              <CardDescription>
                Configure course availability and access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="course-active">Active Course</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this course available to learners
                  </p>
                </div>
                <Switch
                  id="course-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseBuilder;