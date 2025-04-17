
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Loader2 } from 'lucide-react';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';

interface AvatarUploadSectionProps {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  onAvatarUpdate: (url: string) => void;
}

export const AvatarUploadSection = ({ 
  userId, 
  userName, 
  avatarUrl, 
  onAvatarUpdate 
}: AvatarUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAvatar, uploading } = useAvatarUpload(userId);
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const url = await uploadAvatar(file);
    if (url) {
      onAvatarUpdate(url);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar className="h-24 w-24 border-2 border-gray-200">
        <AvatarImage src={avatarUrl || undefined} alt={userName} />
        <AvatarFallback className="text-xl">
          {userName?.substring(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      <div>
        <input
          ref={fileInputRef}
          id="avatar"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={uploading}
        />
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={triggerFileInput}
          disabled={uploading}
          className="flex items-center"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Change Avatar
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
