import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from '@/components/ui/sonner';

interface ProfileInfoFormProps {
  user: { id: string; name: string; email: string; role: string };
  name: string;
  setName: (val: string) => void;
  onSave: () => Promise<void>;
  isLoading: boolean;
}

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  user,
  name,
  setName,
  onSave,
  isLoading
}) => {
  console.log("ProfileInfoForm rendering");
  
  return (
    <div className="flex-1 space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-background dark:bg-[#181928]/70 w-full text-ellipsis"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          defaultValue={user.email}
          readOnly
          className="bg-background dark:bg-[#181928]/70 w-full text-ellipsis"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          defaultValue={user.role === "manager" ? "Manager" : "User"}
          readOnly
          className="bg-background dark:bg-[#181928]/70 w-full"
        />
      </div>
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
    </div>
  );
};

export default ProfileInfoForm;
