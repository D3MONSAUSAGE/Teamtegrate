
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, ArrowLeft } from 'lucide-react';

interface ChatRoomAccessDeniedProps {
  roomName?: string;
  onBack?: () => void;
}

const ChatRoomAccessDenied: React.FC<ChatRoomAccessDeniedProps> = ({ 
  roomName, 
  onBack 
}) => {
  return (
    <div className="h-full flex items-center justify-center bg-muted/30 dark:bg-muted/10">
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Access Denied</h3>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this chat room
            {roomName && ` "${roomName}"`}. You need to be added as a participant to join the conversation.
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat Rooms
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatRoomAccessDenied;
