import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Edit, 
  FileText, 
  PlayCircle, 
  BookOpen, 
  CheckSquare, 
  Users, 
  Clock,
  GripVertical,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { OnboardingStepFormData, OnboardingStepType } from '@/types/onboardingSteps';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface VisualStepBuilderProps {
  steps: OnboardingStepFormData[];
  onChange: (steps: OnboardingStepFormData[]) => void;
  stageIndex: number;
}

const stepTypeConfig = {
  document: { label: 'Document/Policy', icon: FileText, color: 'bg-blue-100 text-blue-800 border-blue-200' },
  video: { label: 'Video Content', icon: PlayCircle, color: 'bg-purple-100 text-purple-800 border-purple-200' },
  course: { label: 'Training Course', icon: BookOpen, color: 'bg-green-100 text-green-800 border-green-200' },
  quiz: { label: 'Quiz/Assessment', icon: CheckSquare, color: 'bg-orange-100 text-orange-800 border-orange-200' },
  task: { label: 'Task/Activity', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  meeting: { label: 'Meeting/Interview', icon: Users, color: 'bg-pink-100 text-pink-800 border-pink-200' },
  approval: { label: 'Approval Required', icon: CheckSquare, color: 'bg-red-100 text-red-800 border-red-200' },
};

export function VisualStepBuilder({ steps, onChange, stageIndex }: VisualStepBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const addStep = () => {
    const newStep: OnboardingStepFormData = {
      title: '',
      description: '',
      step_type: 'document',
      is_required: true,
      estimated_duration_minutes: 30,
      due_offset_days: 1,
      prerequisites: [],
      content: [],
      requirements: [],
    };
    onChange([...steps, newStep]);
    setEditingIndex(steps.length);
  };

  const updateStep = (index: number, updates: Partial<OnboardingStepFormData>) => {
    const newSteps = steps.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    );
    onChange(newSteps);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onChange(newSteps);
    setEditingIndex(null);
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= steps.length) return;
    
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    onChange(newSteps);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h4 className="font-medium text-muted-foreground mb-2">No steps in this stage yet</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Add the first step to get started
        </p>
        <Button onClick={addStep} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add First Step
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const config = stepTypeConfig[step.step_type];
        const Icon = config.icon;
        const isEditing = editingIndex === index;
        const isExpanded = expandedSteps.has(index);

        return (
          <Card key={index} className={`relative transition-all ${isEditing ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="cursor-move p-1 hover:bg-muted rounded">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                
                <div className={`px-2 py-1 rounded-full border ${config.color} flex items-center gap-1 text-xs font-medium`}>
                  <Icon className="h-3 w-3" />
                  {config.label}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(index, { title: e.target.value })}
                      placeholder="Step title..."
                      className="font-medium"
                      autoFocus
                    />
                  ) : (
                    <h4 className="font-medium">
                      {step.title || `Untitled Step ${index + 1}`}
                    </h4>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {step.is_required && (
                    <Badge variant="secondary" className="text-xs">Required</Badge>
                  )}
                  {step.estimated_duration_minutes && (
                    <Badge variant="outline" className="text-xs">
                      {step.estimated_duration_minutes}min
                    </Badge>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(isEditing ? null : index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Collapsible open={isExpanded || isEditing}>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Step Type</Label>
                          <Select
                            value={step.step_type}
                            onValueChange={(value: OnboardingStepType) => 
                              updateStep(index, { step_type: value })
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

                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={step.estimated_duration_minutes || ''}
                            onChange={(e) => updateStep(index, { 
                              estimated_duration_minutes: parseInt(e.target.value) || undefined 
                            })}
                            placeholder="30"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={step.description || ''}
                          onChange={(e) => updateStep(index, { description: e.target.value })}
                          placeholder="Describe what the employee needs to do..."
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={step.is_required}
                            onCheckedChange={(checked) => updateStep(index, { is_required: checked })}
                          />
                          <Label>Required Step</Label>
                        </div>

                        <div className="space-y-2">
                          <Label>Due Days After Stage Start</Label>
                          <Input
                            type="number"
                            value={step.due_offset_days || ''}
                            onChange={(e) => updateStep(index, { 
                              due_offset_days: parseInt(e.target.value) || undefined 
                            })}
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingIndex(null)}
                        >
                          Done Editing
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {step.description && (
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      )}
                      <div className="flex gap-2 text-xs">
                        {step.due_offset_days && (
                          <Badge variant="outline">Due: {step.due_offset_days} days</Badge>
                        )}
                        {step.content && step.content.length > 0 && (
                          <Badge variant="outline">{step.content.length} content items</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Movement controls */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveStep(index, index - 1)}
                      disabled={index === 0}
                    >
                      Move Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveStep(index, index + 1)}
                      disabled={index === steps.length - 1}
                    >
                      Move Down
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-6">
          <Button variant="outline" onClick={addStep}>
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}