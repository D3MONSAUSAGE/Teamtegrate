
import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Palette, TreePine, Flower, Building, Waves, Rocket } from 'lucide-react';

interface FocusSettingsProps {
  duration: number;
  onDurationChange: (duration: number) => void;
  animationType: 'forest' | 'garden' | 'city' | 'ocean' | 'space';
  onAnimationTypeChange: (type: 'forest' | 'garden' | 'city' | 'ocean' | 'space') => void;
}

const FocusSettings: React.FC<FocusSettingsProps> = ({
  duration,
  onDurationChange,
  animationType,
  onAnimationTypeChange
}) => {
  const animationOptions = [
    { value: 'forest', label: 'Enchanted Forest', icon: TreePine, description: 'Watch trees grow in a magical forest' },
    { value: 'garden', label: 'Blooming Garden', icon: Flower, description: 'Cultivate beautiful flowers' },
    { value: 'city', label: 'Rising Metropolis', icon: Building, description: 'Build a thriving cityscape' },
    { value: 'ocean', label: 'Ocean Depths', icon: Waves, description: 'Grow coral reefs underwater' },
    { value: 'space', label: 'Cosmic Journey', icon: Rocket, description: 'Develop planets in space' }
  ];

  const currentAnimation = animationOptions.find(opt => opt.value === animationType);

  return (
    <Card className="p-6 glass-card">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Focus Settings</h3>
          <p className="text-sm text-muted-foreground">
            Customize your focus experience
          </p>
        </div>

        {/* Duration Setting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Focus Duration</Label>
          </div>
          
          <div className="space-y-2">
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
              <span className="font-medium text-primary">{duration} minutes</span>
              <span>2 hours</span>
            </div>
          </div>
        </div>

        {/* Animation Theme Setting */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Growth Theme</Label>
          </div>
          
          <Select value={animationType} onValueChange={onAnimationTypeChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {currentAnimation && (
                    <>
                      <currentAnimation.icon className="h-4 w-4" />
                      <span>{currentAnimation.label}</span>
                    </>
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {animationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-start gap-3 py-1">
                    <option.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Duration Presets */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-4 gap-2">
            {[15, 25, 45, 60].map((preset) => (
              <button
                key={preset}
                onClick={() => onDurationChange(preset)}
                className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                  duration === preset
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-border hover:bg-muted'
                }`}
              >
                {preset}m
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Current Selection:</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentAnimation && <currentAnimation.icon className="h-3 w-3" />}
              <span className="text-sm font-medium">{currentAnimation?.label}</span>
            </div>
            <span className="text-sm font-medium text-primary">{duration} min</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default FocusSettings;
