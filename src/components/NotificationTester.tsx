import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useSoundSettings } from '@/hooks/useSoundSettings';
import { useChatSounds } from '@/hooks/useChatSounds';
import { playAppSound } from '@/utils/chatSounds';
import { toast } from 'sonner';

/**
 * Component for testing notification sounds and system integration
 * Only shows for development/testing purposes
 */
const NotificationTester: React.FC = () => {
  const soundSettings = useSoundSettings();
  const { playMessageSound, playBuzzSound, enableSounds } = useChatSounds();

  const testNotificationSound = async (type: 'success' | 'error' | 'status-change') => {
    enableSounds();
    try {
      await playAppSound(type, soundSettings.volume);
      toast.success(`${type} sound played!`);
    } catch (error) {
      toast.error(`${type} sound failed: ${error}`);
    }
  };

  const testChatSound = async () => {
    enableSounds();
    try {
      await playMessageSound();
      toast.success('Chat sound played!');
    } catch (error) {
      toast.error(`Chat sound failed: ${error}`);
    }
  };

  const testBuzzSound = async () => {
    enableSounds();
    await playBuzzSound();
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Sound Tester
        </CardTitle>
        <CardDescription>
          Test different notification sounds and system integration (Development only)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            onClick={() => testNotificationSound('success')}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Success
          </Button>
          
          <Button
            variant="outline"
            onClick={() => testNotificationSound('error')}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Error
          </Button>
          
          <Button
            variant="outline"
            onClick={() => testNotificationSound('status-change')}
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Status Change
          </Button>
          
          <Button
            variant="outline"
            onClick={testChatSound}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Chat Message
          </Button>
          
          <Button
            variant="outline"
            onClick={testBuzzSound}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Buzz/Poke
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p><strong>Sound Settings:</strong> {soundSettings.enabled ? 'Enabled' : 'Disabled'} | Volume: {Math.round(soundSettings.volume * 100)}%</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTester;