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
import { Loader2, Plus, Trash2, GripVertical, Video, FileText, PlayCircle, File } from "lucide-react";
import { useUpdateCourse, useDeleteCourse } from "@/hooks/useTrainingData";
import { notifications } from '@/lib/notifications';
import { extractYouTubeVideoId, isValidVideoInput, parseVideoInput } from "@/lib/youtube";
import ModuleFileUploader from './ModuleFileUploader';

interface Module {
  id?: string;
  title: string;
  description: string;
  module_order: number;
  content?: string;
  content_type?: 'text' | 'video' | 'mixed' | 'file' | 'text_file' | 'video_file' | 'mixed_file';
  video_url?: string;
  video_source?: 'youtube' | 'google_drive' | 'direct_link';
  file_path?: string;
  file_name?: string;
  file_size?: number;
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
      console.log('CourseEditor: Loading course data', course);
      setFormData({
        title: course.title || '',
        description: course.description || '',
        difficulty: course.difficulty_level ? (course.difficulty_level.charAt(0).toUpperCase() + course.difficulty_level.slice(1)) : 'Beginner',
        duration_hours: course.estimated_duration_minutes ? Math.round(course.estimated_duration_minutes / 60) : 1,
        is_active: course.is_active ?? true
      });
      
      // Load existing modules with smart content type inference
      const loadedModules = course.training_modules?.map((mod: any, index: number) => {
        console.log(`CourseEditor: Processing module ${index}`, mod);
        
        // Intelligently infer content_type if missing
        let contentType = mod.content_type;
        const hasVideo = mod.video_url && mod.video_url.trim() !== '';
        const hasText = mod.text_content && mod.text_content.trim() !== '';
        const hasFile = mod.file_path && mod.file_path.trim() !== '';
        
        if (!contentType || !['text', 'video', 'mixed', 'file', 'text_file', 'video_file', 'mixed_file'].includes(contentType)) {
          if (hasVideo && hasText && hasFile) {
            contentType = 'mixed_file';
          } else if (hasVideo && hasFile) {
            contentType = 'video_file';  
          } else if (hasText && hasFile) {
            contentType = 'text_file';
          } else if (hasVideo && hasText) {
            contentType = 'mixed';
          } else if (hasVideo) {
            contentType = 'video';
          } else if (hasFile) {
            contentType = 'file';
          } else {
            contentType = 'text';
          }
          console.log(`CourseEditor: Inferred content_type: ${contentType} for module ${index}`);
        }
        
        // For existing modules with video URLs, preserve the full URL in the input
        const videoValue = mod.video_url || '';
        const videoSource = mod.video_source || 'youtube';
        
        const moduleData = {
          id: mod.id,
          title: mod.title || '',
          description: mod.description || '',
          module_order: mod.module_order || index + 1,
          content: mod.text_content || '',
          content_type: contentType as 'text' | 'video' | 'mixed' | 'file' | 'text_file' | 'video_file' | 'mixed_file',
          video_url: videoValue,
          video_source: videoSource as 'youtube' | 'google_drive' | 'direct_link',
          file_path: mod.file_path || '',
          file_name: mod.file_name || '',
          file_size: mod.file_size || 0
        };
        
        console.log(`CourseEditor: Final module data for ${index}`, moduleData);
        return moduleData;
      }) || [];
      
      console.log('CourseEditor: Setting modules', loadedModules);
      setModules(loadedModules);
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
      
      notifications.success('Course updated successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating course:', error);
      notifications.error('Failed to update course');
    }
  };

  const handleDelete = async () => {
    if (!course?.id) return;

    try {
      await deleteCourseMutation.mutateAsync(course.id);
      notifications.success('Course deleted successfully!');
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting course:', error);
      notifications.error('Failed to delete course');
    }
  };

  const addModule = () => {
    const newModule: Module = {
      title: '',
      description: '',
      module_order: modules.length + 1,
      content: '',
      content_type: 'text',
      video_url: '',
      video_source: 'youtube',
      file_path: '',
      file_name: '',
      file_size: 0
    };
    setModules([...modules, newModule]);
  };

  const updateModule = (index: number, field: keyof Module, value: string | number) => {
    const updatedModules = [...modules];
    
    // Handle video URL inputs - detect source and validate
    if (field === 'video_url' && typeof value === 'string') {
      const videoInfo = parseVideoInput(value);
      if (videoInfo) {
        updatedModules[index] = { 
          ...updatedModules[index], 
          video_url: value,
          video_source: videoInfo.source
        };
      } else {
        // Invalid video input, just store the value for user to fix
        updatedModules[index] = { ...updatedModules[index], [field]: value };
      }
    } else {
      updatedModules[index] = { ...updatedModules[index], [field]: value };
    }
    
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
                          {(module.content_type === 'mixed' || module.content_type === 'mixed_file') && <PlayCircle className="h-4 w-4 text-purple-500" />}
                          {(module.content_type === 'file' || module.content_type === 'text_file' || module.content_type === 'video_file') && <File className="h-4 w-4 text-green-500" />}
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
                            onValueChange={(value: 'text' | 'video' | 'mixed' | 'file' | 'text_file' | 'video_file' | 'mixed_file') => updateModule(index, 'content_type', value)}
                          >
                           <SelectTrigger>
                             <SelectValue placeholder="Select content type" />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="text">Text Only</SelectItem>
                             <SelectItem value="video">Video Only</SelectItem> 
                             <SelectItem value="file">File Only</SelectItem>
                             <SelectItem value="mixed">Text + Video</SelectItem>
                             <SelectItem value="text_file">Text + File</SelectItem>
                             <SelectItem value="video_file">Video + File</SelectItem>
                             <SelectItem value="mixed_file">Text + Video + File</SelectItem>
                           </SelectContent>
                         </Select>
                      </div>
                      
                      {(module.content_type === 'video' || module.content_type === 'mixed' || module.content_type === 'video_file' || module.content_type === 'mixed_file') && (
                        <div className="space-y-1">
                          <Label>Video URL</Label>
                           <Input
                             value={module.video_url || ''}
                             onChange={(e) => updateModule(index, 'video_url', e.target.value)}
                             placeholder="Enter video URL (YouTube, Google Drive, or direct link)"
                           />
                           <p className="text-xs text-muted-foreground">
                             Supports YouTube, Google Drive videos, and direct video links.
                           </p>
                           {module.video_source && (
                             <p className="text-xs text-primary">
                               Detected source: {module.video_source.replace('_', ' ')}
                             </p>
                           )}
                         </div>
                      )}
                      
                      {(module.content_type === 'file' || module.content_type === 'text_file' || module.content_type === 'video_file' || module.content_type === 'mixed_file') && (
                        <div className="space-y-1">
                          <Label>Training File</Label>
                          <ModuleFileUploader
                            onFileUploaded={(filePath, fileName, fileSize, fileUrl) => {
                              updateModule(index, 'file_path', filePath);
                              updateModule(index, 'file_name', fileName);
                              updateModule(index, 'file_size', fileSize);
                            }}
                            onFileRemoved={() => {
                              updateModule(index, 'file_path', '');
                              updateModule(index, 'file_name', '');
                              updateModule(index, 'file_size', 0);
                            }}
                            existingFile={module.file_path ? {
                              fileName: module.file_name || '',
                              filePath: module.file_path,
                              fileSize: module.file_size || 0
                            } : undefined}
                            moduleId={module.id}
                            organizationId={course?.organization_id || ''}
                            disabled={updateCourseMutation.isPending}
                          />
                        </div>
                      )}
                      
                      {(module.content_type === 'text' || module.content_type === 'mixed' || module.content_type === 'text_file' || module.content_type === 'mixed_file') && (
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