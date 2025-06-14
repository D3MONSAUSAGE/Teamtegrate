
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

const ChatSoundSettings: React.FC = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleSound} title="Sound Settings">
      {soundEnabled ? (
        <Volume2 className="h-5 w-5" />
      ) : (
        <VolumeX className="h-5 w-5" />
      )}
    </Button>
  );
};

export default ChatSoundSettings;
