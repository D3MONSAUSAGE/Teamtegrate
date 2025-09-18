import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { syncProfileData } from '@/contexts/auth/authOperations';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileSyncButtonProps {
  hasInconsistency?: boolean;
  authEmail?: string;
  dbEmail?: string;
}

const ProfileSyncButton: React.FC<ProfileSyncButtonProps> = ({ 
  hasInconsistency, 
  authEmail, 
  dbEmail 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await syncProfileData();
      // Refresh the page after successful sync to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasInconsistency) return null;

  return (
    <div className="space-y-4">
      <Alert className="border-warning/20 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm">
          <div className="space-y-1">
            <p><strong>Profile data inconsistency detected:</strong></p>
            <p>• Login shows: <code className="bg-background/50 px-1 rounded">{authEmail}</code></p>
            <p>• Database shows: <code className="bg-background/50 px-1 rounded">{dbEmail}</code></p>
            <p className="mt-2 text-xs text-muted-foreground">
              This can happen when email confirmation is pending. Click "Sync Profile" to fix this.
            </p>
          </div>
        </AlertDescription>
      </Alert>
      
      <Button
        onClick={handleSync}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Syncing...' : 'Sync Profile Data'}
      </Button>
    </div>
  );
};

export default ProfileSyncButton;