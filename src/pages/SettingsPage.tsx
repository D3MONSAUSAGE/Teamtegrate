import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SettingsPage = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) {
        toast.error('Failed to update profile: ' + error.message);
        return;
      }

      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* Profile Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
          <div className="bg-white p-6 rounded-lg border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  defaultValue={user?.email} 
                  readOnly 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                defaultValue={user?.role === 'manager' ? 'Manager' : 'User'} 
                readOnly 
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* App Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">App Settings</h2>
          <div className="bg-white p-6 rounded-lg border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="block mb-1">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive email notifications for task updates</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            
            <div>
              <Label className="block mb-2">Default Task Priority</Label>
              <RadioGroup defaultValue="medium">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="low" />
                  <Label htmlFor="low">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="high" />
                  <Label htmlFor="high">High</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reminders" className="block mb-1">Task Reminders</Label>
                <p className="text-sm text-gray-500">Get notifications before task deadlines</p>
              </div>
              <Switch id="reminders" defaultChecked />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Account Settings */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="bg-white p-6 rounded-lg border space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            
            <Button variant="destructive" className="mt-2">Delete Account</Button>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline">Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
