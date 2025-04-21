
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AccountSettingsSection = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      <div className="bg-card dark:bg-[#1f2133] p-6 rounded-lg border border-border dark:border-gray-800 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input 
            id="current-password" 
            type="password"
            className="bg-background dark:bg-[#181928]/70" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input 
            id="new-password" 
            type="password"
            className="bg-background dark:bg-[#181928]/70"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input 
            id="confirm-password" 
            type="password"
            className="bg-background dark:bg-[#181928]/70"
          />
        </div>
        
        <Button variant="destructive" className="mt-2">Delete Account</Button>
      </div>
    </div>
  );
};

export default AccountSettingsSection;
