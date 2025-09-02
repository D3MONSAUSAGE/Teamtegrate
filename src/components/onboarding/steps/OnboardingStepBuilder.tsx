import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, FileText, PlayCircle, BookOpen, CheckSquare, Users, Clock } from 'lucide-react';
import { useOnboardingSteps } from '@/hooks/onboarding/useOnboardingSteps';
import type { OnboardingStepFormData, OnboardingStepType } from '@/types/onboardingSteps';

interface OnboardingStepBuilderProps {
  templateId: string;
  stageId?: string;
  onClose?: () => void;
}

const stepTypeConfig = {
  document: { label: 'Document/Policy', icon: FileText, color: 'bg-blue-100 text-blue-800' },
  video: { label: 'Video Content', icon: PlayCircle, color: 'bg-purple-100 text-purple-800' },
  course: { label: 'Training Course', icon: BookOpen, color: 'bg-green-100 text-green-800' },
  quiz: { label: 'Quiz/Assessment', icon: CheckSquare, color: 'bg-orange-100 text-orange-800' },
  task: { label: 'Task/Activity', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  meeting: { label: 'Meeting/Interview', icon: Users, color: 'bg-pink-100 text-pink-800' },
  approval: { label: 'Approval Required', icon: CheckSquare, color: 'bg-red-100 text-red-800' },
};

export function OnboardingStepBuilder({ templateId, stageId, onClose }: OnboardingStepBuilderProps) {
  const { steps, createStep, isCreating } = useOnboardingSteps(templateId);
  
  const [formData, setFormData] = useState<OnboardingStepFormData>({
    title: '',
    description: '',
    step_type: 'document',
    is_required: true,
    estimated_duration_minutes: 30,
    due_offset_days: 1,
    prerequisites: [],
    content: [],
    requirements: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStep({
      templateId,
      stageId,
      stepData: formData,
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      step_type: 'document',
      is_required: true,
      estimated_duration_minutes: 30,
      due_offset_days: 1,
      prerequisites: [],
      content: [],
      requirements: [],
    });
    
    onClose?.();
  };

  const addContent = () => {
    setFormData(prev => ({
      ...prev,
      content: [...prev.content, {
        content_type: 'text',
        content_data: { text: '' }
      }]
    }));
  };

  const removeContent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index)
    }));
  };

  const updateContent = (index: number, updates: any) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      )
    }));
  };

  const availablePrerequisites = steps.filter(step => step.id !== 'current');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Onboarding Step
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Step Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Read Company Handbook"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="step_type">Step Type</Label>
                <Select
                  value={formData.step_type}
                  onValueChange={(value: OnboardingStepType) => 
                    setFormData(prev => ({ ...prev, step_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stepTypeConfig).map(([key, config]) => {
                      const Icon = config.icon;
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what the employee needs to do in this step..."
                rows={3}
              />
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_required: checked }))
                  }
                />
                <Label htmlFor="is_required">Required Step</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Est. Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.estimated_duration_minutes || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimated_duration_minutes: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="30"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="due_days">Due Days After Start</Label>
                <Input
                  id="due_days"
                  type="number"
                  value={formData.due_offset_days || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    due_offset_days: parseInt(e.target.value) || undefined 
                  }))}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Prerequisites */}
            {availablePrerequisites.length > 0 && (
              <div className="space-y-2">
                <Label>Prerequisites (steps that must be completed first)</Label>
                <div className="space-y-2">
                  {availablePrerequisites.map((step) => (
                    <div key={step.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`prereq-${step.id}`}
                        checked={formData.prerequisites.includes(step.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              prerequisites: [...prev.prerequisites, step.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              prerequisites: prev.prerequisites.filter(id => id !== step.id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`prereq-${step.id}`} className="text-sm">
                        {step.title}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Content Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Step Content</Label>
                <Button type="button" variant="outline" size="sm" onClick={addContent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>
              
              {formData.content.map((content, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <Select
                          value={content.content_type}
                          onValueChange={(value) => updateContent(index, { content_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text Content</SelectItem>
                            <SelectItem value="video">Video URL</SelectItem>
                            <SelectItem value="document">Document Link</SelectItem>
                            <SelectItem value="external_link">External Link</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {content.content_type === 'text' && (
                          <Textarea
                            value={content.content_data.text || ''}
                            onChange={(e) => updateContent(index, { 
                              content_data: { ...content.content_data, text: e.target.value }
                            })}
                            placeholder="Enter text content..."
                            rows={3}
                          />
                        )}
                        
                        {(content.content_type === 'video' || 
                          content.content_type === 'document' || 
                          content.content_type === 'external_link') && (
                          <div className="space-y-2">
                            <Input
                              value={content.content_data.url || ''}
                              onChange={(e) => updateContent(index, { 
                                content_data: { ...content.content_data, url: e.target.value }
                              })}
                              placeholder="Enter URL..."
                            />
                            <Input
                              value={content.content_data.title || ''}
                              onChange={(e) => updateContent(index, { 
                                content_data: { ...content.content_data, title: e.target.value }
                              })}
                              placeholder="Enter title..."
                            />
                          </div>
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContent(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Step'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}