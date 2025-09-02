import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Calendar } from 'lucide-react';
import { OnboardingStageFormData } from '@/types/onboarding';

interface StagesStepProps {
  data: OnboardingStageFormData[];
  onChange: (data: OnboardingStageFormData[]) => void;
}

export function StagesStep({ data, onChange }: StagesStepProps) {
  const addStage = () => {
    const newStage: OnboardingStageFormData = {
      title: '',
      description: '',
      order_index: data.length,
      due_offset_days: (data.length + 1) * 7, // Default to weekly intervals
    };
    onChange([...data, newStage]);
  };

  const updateStage = (index: number, updates: Partial<OnboardingStageFormData>) => {
    const newData = data.map((stage, i) => 
      i === index ? { ...stage, ...updates } : stage
    );
    onChange(newData);
  };

  const removeStage = (index: number) => {
    if (data.length <= 1) return; // Keep at least one stage
    const newData = data.filter((_, i) => i !== index);
    // Reorder indices
    newData.forEach((stage, i) => {
      stage.order_index = i;
    });
    onChange(newData);
  };

  const moveStage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= data.length) return;
    
    const newData = [...data];
    const [movedStage] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedStage);
    
    // Update order indices
    newData.forEach((stage, i) => {
      stage.order_index = i;
    });
    onChange(newData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Onboarding Stages</h3>
        <p className="text-muted-foreground">
          Break down the onboarding process into logical phases or time periods
        </p>
      </div>

      <div className="space-y-4">
        {data.map((stage, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="cursor-move p-1 hover:bg-muted rounded">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                      {index + 1}
                    </div>
                    <Label className="text-sm font-medium">Stage {index + 1}</Label>
                  </div>
                  <Input
                    value={stage.title}
                    onChange={(e) => updateStage(index, { title: e.target.value })}
                    placeholder="e.g., Week 1: Getting Started, Orientation Phase"
                    className="font-medium"
                  />
                </div>
                {data.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStage(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Textarea
                  id={`description-${index}`}
                  value={stage.description || ''}
                  onChange={(e) => updateStage(index, { description: e.target.value })}
                  placeholder="What happens during this stage? What should employees expect?"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`timeframe-${index}`}>Timeframe Label</Label>
                  <Input
                    id={`timeframe-${index}`}
                    value={stage.timeframe_label || ''}
                    onChange={(e) => updateStage(index, { timeframe_label: e.target.value })}
                    placeholder="e.g., Week 1, First Month, Days 1-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`due-days-${index}`}>Due Days After Start</Label>
                  <Input
                    id={`due-days-${index}`}
                    type="number"
                    min="1"
                    value={stage.due_offset_days || ''}
                    onChange={(e) => updateStage(index, { 
                      due_offset_days: parseInt(e.target.value) || undefined 
                    })}
                    placeholder="7"
                  />
                </div>
              </div>

              {/* Stage Movement Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveStage(index, index - 1)}
                  disabled={index === 0}
                >
                  Move Up
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moveStage(index, index + 1)}
                  disabled={index === data.length - 1}
                >
                  Move Down
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <Button variant="outline" onClick={addStage}>
            Add Another Stage
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Most templates have 2-4 stages
          </p>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">🎯 Stage Planning Tips</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Each stage should have a clear focus (orientation, training, integration)</li>
          <li>• Consider the employee's learning capacity - don't overload early stages</li>
          <li>• Build in time for feedback and adjustment between stages</li>
          <li>• Later stages should focus on independence and role-specific skills</li>
        </ul>
      </div>
    </div>
  );
}