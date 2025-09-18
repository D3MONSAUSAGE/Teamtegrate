import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { canManageUser } from '@/contexts/auth/roleUtils';

interface ProfileInfoFormProps {
  user: { id: string; name: string; email: string; role: string };
  name: string;
  setName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  onSave: () => Promise<void>;
  isLoading: boolean;
  targetUserId?: string; // For when editing another user's profile
}

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  user,
  name,
  setName,
  email,
  setEmail,
  onSave,
  isLoading,
  targetUserId
}) => {
  console.log("ProfileInfoForm rendering");
  const { user: currentUser } = useAuth();
  
  // Determine if current user can edit this profile
  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id;
  const canEdit = isOwnProfile || (currentUser && canManageUser(currentUser.role as any, user.role as any));
  
  return (
    <div className="flex-1 space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          readOnly={!canEdit}
          className={`bg-background dark:bg-[#181928]/70 w-full text-ellipsis ${
            !canEdit ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={!canEdit}
          className={`bg-background dark:bg-[#181928]/70 w-full text-ellipsis ${
            !canEdit ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          placeholder="Enter your email address"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          defaultValue={user.role === "manager" ? "Manager" : user.role === "admin" ? "Admin" : user.role === "superadmin" ? "Super Admin" : "User"}
          readOnly
          className="bg-background dark:bg-[#181928]/70 w-full opacity-60 cursor-not-allowed"
        />
      </div>
      {canEdit && (
        <div className="flex justify-end mt-4">
          <button
            onClick={onSave}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Profile
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileInfoForm;
