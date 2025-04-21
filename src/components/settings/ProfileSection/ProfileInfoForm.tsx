
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
}) => (
  <>
    <div className="flex-1 space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-background dark:bg-[#181928]/70"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          defaultValue={user.email}
          readOnly
          className="bg-background dark:bg-[#181928]/70"
        />
      </div>
    </div>
    <div className="space-y-2">
      <Label htmlFor="role">Role</Label>
      <Input
        id="role"
        defaultValue={user.role === "manager" ? "Manager" : "User"}
        readOnly
        className="bg-background dark:bg-[#181928]/70"
      />
    </div>
    <div className="flex justify-end">
      <Button
        onClick={onSave}
        disabled={isLoading}
        className="bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isLoading ? (
          <>Saving...</>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Save Profile
          </>
        )}
      </Button>
    </div>
  </>
);

export default ProfileInfoForm;
