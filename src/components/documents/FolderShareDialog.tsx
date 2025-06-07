
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, X, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface FolderShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderShared?: () => void;
}

interface SharedUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const FolderShareDialog: React.FC<FolderShareDialogProps> = ({
  open,
  onOpenChange,
  folderName,
  onFolderShared
}) => {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  React.useEffect(() => {
    if (open && folderName) {
      fetchSharedUsers();
    }
  }, [open, folderName]);

  const fetchSharedUsers = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_folders')
        .select(`
          id,
          created_at,
          shared_with_user_id,
          users!shared_folders_shared_with_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('folder_name', folderName)
        .eq('owner_id', user.id);

      if (error) throw error;

      const users = data?.map((item: any) => ({
        id: item.id,
        email: item.users.email,
        name: item.users.name,
        created_at: item.created_at
      })) || [];

      setSharedUsers(users);
    } catch (error) {
      console.error('Error fetching shared users:', error);
      toast({
        title: "Error",
        description: "Failed to load shared users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!email.trim() || !user) return;

    setIsSharing(true);
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        toast({
          title: "User not found",
          description: "No user found with this email address",
          variant: "destructive"
        });
        return;
      }

      if (userData.id === user.id) {
        toast({
          title: "Invalid sharing",
          description: "You cannot share a folder with yourself",
          variant: "destructive"
        });
        return;
      }

      // Check if already shared
      const { data: existingShare } = await supabase
        .from('shared_folders')
        .select('id')
        .eq('folder_name', folderName)
        .eq('owner_id', user.id)
        .eq('shared_with_user_id', userData.id)
        .single();

      if (existingShare) {
        toast({
          title: "Already shared",
          description: "This folder is already shared with this user",
          variant: "destructive"
        });
        return;
      }

      // Create the share
      const { error: shareError } = await supabase
        .from('shared_folders')
        .insert({
          folder_name: folderName,
          owner_id: user.id,
          shared_with_user_id: userData.id
        });

      if (shareError) throw shareError;

      toast({
        title: "Folder shared",
        description: `Folder "${folderName}" has been shared with ${userData.email}`
      });

      setEmail('');
      fetchSharedUsers();
      onFolderShared?.();
    } catch (error) {
      console.error('Error sharing folder:', error);
      toast({
        title: "Error",
        description: "Failed to share folder",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string, userEmail: string) => {
    try {
      const { error } = await supabase
        .from('shared_folders')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Share removed",
        description: `Removed access for ${userEmail}`
      });

      fetchSharedUsers();
      onFolderShared?.();
    } catch (error) {
      console.error('Error removing share:', error);
      toast({
        title: "Error",
        description: "Failed to remove share",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share "{folderName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Share with user (enter email)</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleShare()}
              />
              <Button 
                onClick={handleShare} 
                disabled={!email.trim() || isSharing}
                size="sm"
              >
                {isSharing ? 'Sharing...' : 'Share'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Currently shared with:</Label>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : sharedUsers.length === 0 ? (
              <p className="text-sm text-gray-500">Not shared with anyone yet</p>
            ) : (
              <div className="space-y-2">
                {sharedUsers.map((sharedUser) => (
                  <div key={sharedUser.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{sharedUser.name}</p>
                        <p className="text-xs text-gray-500">{sharedUser.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveShare(sharedUser.id, sharedUser.email)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FolderShareDialog;
