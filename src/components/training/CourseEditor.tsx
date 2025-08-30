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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, GripVertical, Video, FileText, PlayCircle } from "lucide-react";
import { useUpdateCourse, useDeleteCourse } from "@/hooks/useTrainingData";
import { enhancedNotifications } from "@/utils/enhancedNotifications";

interface Module {
  id?: string;
  title: string;
  description: string;
  module_order: number;
  content?: string;
  content_type?: 'text' | 'video' | 'mixed';
  youtube_video_id?: string;
}

interface CourseEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: any;
}

const CourseEditor: React.FC<CourseEditorProps> = ({ open, onOpenChange, course }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    duration_hours: 1,
    is_active: true
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();

  useEffect(() => {
    if (course && open) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        difficulty: course.difficulty_level ? (course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)) : 'Beginner',
        duration_hours: course.estimated_duration_minutes ? Math.round(course.estimated_duration_minutes / 60) : 1,
        is_active: course.is_active ?? true
      });
      
      // Load existing modules
      setModules(course.training_modules?.map((mod: any, index: number) => ({
        id: mod.id,
        title: mod.title || '',
        description: mod.description || '',
        module_order: mod.module_order || index + 1,
        content: mod.text_content || '',
        content_type: mod.content_type || 'text',
        youtube_video_id: mod.youtube_video_id || ''
      })) || []);
    }
  }, [course, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course?.id) return;

    try {
      await updateCourseMutation.mutateAsync({
        courseId: course.id,
        course: formData,
        modules: modules
      });
      
      enhancedNotifications.success('Course updated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating course:', error);
      enhancedNotifications.error('Failed to update course');
    }
  };

  const handleDelete = async () => {
    if (!course?.id) return;

    try {
      await deleteCourseMutation.mutateAsync(course.id);
      enhancedNotifications.success('Course deleted successfully!');
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting course:', error);
      enhancedNotifications.error('Failed to delete course');
    }
  };

  const addModule = () => {
    const newModule: Module = {
      title: '',
      description: '',
      module_order: modules.length + 1,
      content: '',
      content_type: 'text',
      youtube_video_id: ''
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, field: keyof Module, value: string | number) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
  };

  const removeModule = (index: number) => {
    const updatedModules = modules.filter((_, i) => i !== index);
    // Reorder remaining modules
    updatedModules.forEach((module, i) => {
      module.module_order = i + 1;
    });
    setModules(updatedModules);
  };

  const moveModule = (fromIndex: number, toIndex: number) => {
    const updatedModules = [...modules];
    const [movedModule] = updatedModules.splice(fromIndex, 1);
    updatedModules.splice(toIndex, 0, movedModule);
    
    // Update module orders
    updatedModules.forEach((module, i) => {
      module.module_order = i + 1;
    });
    setModules(updatedModules);
  };

  if (!course) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Modify course details and manage modules
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
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
                placeholder="Course description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Course Active</Label>
              </div>
            </div>

            {/* Modules Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Course Modules</h3>
                <Button type="button" onClick={addModule} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Module
                </Button>
              </div>

              {modules.map((module, index) => (
                <Card key={index}>
                   <CardHeader className="pb-3">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <CardTitle className="text-sm flex items-center gap-2">
                           <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                           Module {module.module_order}
                         </CardTitle>
                         {module.content_type === 'video' && <Video className="h-4 w-4 text-blue-500" />}
                         {module.content_type === 'mixed' && <PlayCircle className="h-4 w-4 text-purple-500" />}
                         {(!module.content_type || module.content_type === 'text') && <FileText className="h-4 w-4 text-gray-500" />}
                       </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeModule(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                     </div>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div className="space-y-1">
                         <Label>Module Title</Label>
                         <Input
                           value={module.title}
                           onChange={(e) => updateModule(index, 'title', e.target.value)}
                           placeholder="Module title"
                         />
                       </div>
                       <div className="space-y-1">
                         <Label>Module Description</Label>
                         <Input
                           value={module.description}
                           onChange={(e) => updateModule(index, 'description', e.target.value)}
                           placeholder="Brief description"
                         />
                       </div>
                     </div>
                     
                     <div className="space-y-1">
                       <Label>Content Type</Label>
                       <Select
                         value={module.content_type || 'text'}
                         onValueChange={(value: 'text' | 'video' | 'mixed') => updateModule(index, 'content_type', value)}
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
                       <div className="space-y-1">
                         <Label>YouTube Video ID</Label>
                         <Input
                           value={module.youtube_video_id || ''}
                           onChange={(e) => updateModule(index, 'youtube_video_id', e.target.value)}
                           placeholder="Enter YouTube video ID (e.g., dQw4w9WgXcQ)"
                         />
                         <p className="text-xs text-muted-foreground">
                           Extract the video ID from the YouTube URL. For example, from 
                           https://www.youtube.com/watch?v=dQw4w9WgXcQ, use "dQw4w9WgXcQ"
                         </p>
                       </div>
                     )}
                     
                     {(module.content_type === 'text' || module.content_type === 'mixed') && (
                       <div className="space-y-1">
                         <Label>Content</Label>
                         <Textarea
                           value={module.content || ''}
                           onChange={(e) => updateModule(index, 'content', e.target.value)}
                           placeholder="Module content"
                           rows={3}
                         />
                       </div>
                     )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteCourseMutation.isPending}
              >
                Delete Course
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateCourseMutation.isPending}>
                {updateCourseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{course?.title}"? This action cannot be undone and will also delete all associated modules and quizzes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseEditor;