import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, X, BookOpen, GraduationCap, Video, FileText, PlayCircle } from 'lucide-react';
import { useCreateCourse } from '@/hooks/useTrainingData';
import { extractYouTubeVideoId, isValidYouTubeInput } from '@/lib/youtube';

interface Module {
  title: string;
  description: string;
  content: string;
  duration_minutes: number;
  module_order: number;
  content_type: 'text' | 'video' | 'mixed';
  youtube_video_id?: string;
}

interface CourseCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CourseCreator: React.FC<CourseCreatorProps> = ({ open, onOpenChange }) => {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner',
    duration_hours: 1,
    category: 'general',
    prerequisites: '',
    learning_objectives: '',
    is_active: true
  });
  
  const [modules, setModules] = useState<Module[]>([]);
  const createCourseMutation = useCreateCourse();

  const addModule = () => {
    setModules([...modules, {
      title: '',
      description: '',
      content: '',
      duration_minutes: 30,
      module_order: modules.length + 1,
      content_type: 'text',
      youtube_video_id: ''
    }]);
  };

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updated = [...modules];
    
    // Normalize YouTube video inputs to store just the video ID
    if (field === 'youtube_video_id' && typeof value === 'string') {
      const videoId = extractYouTubeVideoId(value);
      updated[index] = { ...updated[index], [field]: videoId || value };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setModules(updated);
  };

  const removeModule = (index: number) => {
    const updated = modules.filter((_, i) => i !== index);
    // Reorder remaining modules
    updated.forEach((module, i) => {
      module.module_order = i + 1;
    });
    setModules(updated);
  };

  const handleSubmit = async () => {
    if (!courseData.title || !courseData.description) {
      return;
    }

    try {
      await createCourseMutation.mutateAsync({
        course: courseData,
        modules: modules
      });
      
      // Reset form
      setCourseData({
        title: '',
        description: '',
        difficulty: 'beginner',
        duration_hours: 1,
        category: 'general',
        prerequisites: '',
        learning_objectives: '',
        is_active: true
      });
      setModules([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
              <GraduationCap className="h-5 w-5 text-blue-600" />
            </div>
            Create New Training Course
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={courseData.title}
                    onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
                    placeholder="Enter course title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select value={courseData.difficulty} onValueChange={(value) => setCourseData({ ...courseData, difficulty: value })}>
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  value={courseData.description}
                  onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                  placeholder="Describe what students will learn in this course"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={courseData.duration_hours}
                    onChange={(e) => setCourseData({ ...courseData, duration_hours: parseInt(e.target.value) || 1 })}
                    min="1"
                    step="0.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={courseData.category} onValueChange={(value) => setCourseData({ ...courseData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="soft-skills">Soft Skills</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Badge className={getDifficultyColor(courseData.difficulty)}>
                    {courseData.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea
                  id="objectives"
                  value={courseData.learning_objectives}
                  onChange={(e) => setCourseData({ ...courseData, learning_objectives: e.target.value })}
                  placeholder="List the key learning outcomes for this course"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prerequisites (optional)</Label>
                <Input
                  id="prerequisites"
                  value={courseData.prerequisites}
                  onChange={(e) => setCourseData({ ...courseData, prerequisites: e.target.value })}
                  placeholder="Any requirements before taking this course"
                />
              </div>
            </CardContent>
          </Card>

          {/* Course Modules */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Course Modules ({modules.length})</CardTitle>
                <Button onClick={addModule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <Card key={moduleIndex} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Module {moduleIndex + 1}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {module.duration_minutes} minutes
                        </span>
                        {module.content_type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                        {module.content_type === 'mixed' && <PlayCircle className="h-4 w-4 text-purple-500" />}
                        {(!module.content_type || module.content_type === 'text') && <FileText className="h-4 w-4 text-gray-500" />}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(moduleIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Module Title</Label>
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                          placeholder="Module title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={module.duration_minutes}
                          onChange={(e) => updateModule(moduleIndex, 'duration_minutes', parseInt(e.target.value) || 30)}
                          min="5"
                          step="5"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Module Description</Label>
                      <Textarea
                        value={module.description}
                        onChange={(e) => updateModule(moduleIndex, 'description', e.target.value)}
                        placeholder="Brief description of this module"
                        rows={2}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Content Type</Label>
                      <Select
                        value={module.content_type || 'text'}
                        onValueChange={(value: 'text' | 'video' | 'mixed') => updateModule(moduleIndex, 'content_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Only</SelectItem>
                          <SelectItem value="video">Video Only</SelectItem>
                          <SelectItem value="mixed">Text + Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(module.content_type === 'video' || module.content_type === 'mixed') && (
                      <div className="space-y-2">
                        <Label>YouTube Video</Label>
                        <Input
                          value={module.youtube_video_id || ''}
                          onChange={(e) => updateModule(moduleIndex, 'youtube_video_id', e.target.value)}
                          placeholder="Enter YouTube URL or video ID (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                        />
                        <p className="text-xs text-muted-foreground">
                          Paste the full YouTube URL or just the video ID. Both formats are supported.
                        </p>
                      </div>
                    )}

                    {(module.content_type === 'text' || module.content_type === 'mixed') && (
                      <div className="space-y-2">
                        <Label>Module Content</Label>
                        <Textarea
                          value={module.content}
                          onChange={(e) => updateModule(moduleIndex, 'content', e.target.value)}
                          placeholder="Detailed content, instructions, or materials for this module"
                          rows={4}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {modules.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No modules added yet. Click "Add Module" to get started.</p>
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
            disabled={!courseData.title || !courseData.description || createCourseMutation.isPending}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {createCourseMutation.isPending ? 'Creating...' : 'Create Course'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCreator;