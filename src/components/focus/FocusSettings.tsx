
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Trees, Flower, Building2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FocusSettingsProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  animationType: 'tree' | 'flower' | 'city';
  onAnimationTypeChange: (type: 'tree' | 'flower' | 'city') => void;
}

const FocusSettings: React.FC<FocusSettingsProps> = ({
  duration,
  onDurationChange,
  animationType,
  onAnimationTypeChange
}) => {
  const presetDurations = [15, 25, 45, 60];

  const animationOptions = [
    { type: 'tree' as const, icon: Trees, label: 'Tree Growth', description: 'Watch a tree grow from seed to full bloom' },
    { type: 'flower' as const, icon: Flower, label: 'Flower Bloom', description: 'See a beautiful flower blossom' },
    { type: 'city' as const, icon: Building2, label: 'City Builder', description: 'Build a city skyline as you focus' }
  ];

  return (
    <Card className="p-6 glass-card">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Focus Settings</h3>
      </div>

      {/* Duration Settings */}
      <div className="mb-6">
        <Label className="text-sm font-medium mb-3 block">Focus Duration</Label>
        
        {/* Preset buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {presetDurations.map((preset) => (
            <Button
              key={preset}
              variant={duration === preset ? "default" : "outline"}
              size="sm"
              onClick={() => onDurationChange(preset)}
              className="text-xs"
            >
              {preset} min
            </Button>
          ))}
        </div>

        {/* Custom slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Custom Duration</span>
            <span className="font-medium">{duration} minutes</span>
          </div>
          <Slider
            value={[duration]}
            onValueChange={(value) => onDurationChange(value[0])}
            max={120}
            min={5}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 min</span>
            <span>120 min</span>
          </div>
        </div>
      </div>

      {/* Animation Type */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Growth Animation</Label>
        <div className="space-y-2">
          {animationOptions.map(({ type, icon: Icon, label, description }) => (
            <div
              key={type}
              onClick={() => onAnimationTypeChange(type)}
              className={cn(
                "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200",
                animationType === type
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  animationType === type ? "bg-primary/20" : "bg-muted/20"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {description}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 p-3 rounded-lg bg-muted/30 border border-border/50">
        <div className="text-xs text-muted-foreground">
          <p className="font-medium mb-1">💡 Focus Tips:</p>
          <ul className="space-y-1 text-xs">
            <li>• Start with shorter sessions (15-25 min)</li>
            <li>• Take 5-minute breaks between sessions</li>
            <li>• Find a quiet environment</li>
            <li>• Turn off notifications</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};

export default FocusSettings;
