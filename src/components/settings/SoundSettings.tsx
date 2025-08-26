import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { useChatSounds } from '@/hooks/useChatSounds';
import { playAppSound } from '@/utils/chatSounds';

const SoundSettings: React.FC = () => {
  const { enabled, volume, setEnabled, setVolume } = useSoundSettings();
  const { enableSounds } = useChatSounds();

  const handleVolumeChange = ([newVolume]: number[]) => {
    setVolume(newVolume);
  };

  const testSound = async (soundType: 'success' | 'error' | 'status-change' = 'success') => {
    enableSounds();
    try {
      await playAppSound(soundType, volume);
    } catch (error) {
      console.log('Test sound failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {enabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Sound Settings
        </CardTitle>
        <CardDescription>
          Configure notification sounds and volume levels for all app notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-base">Enable Sounds</div>
            <div className="text-sm text-muted-foreground">
              Turn on/off all notification sounds
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Volume: {Math.round(volume * 100)}%
                </label>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Test Sounds</div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('success')}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Success
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('error')}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Error
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testSound('status-change')}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Notification
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SoundSettings;