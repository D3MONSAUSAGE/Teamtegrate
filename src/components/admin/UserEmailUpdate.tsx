import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UserEmailUpdate = () => {
  const [userId, setUserId] = useState('4541b9f9-f44e-4887-ae8d-abae3e3105c6'); // Deybi's ID
  const [newEmail, setNewEmail] = useState('deybigudiel@guanatostacos.com');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdateEmail = async () => {
    if (!userId || !newEmail) {
      toast({
        title: "Error",
        description: "Both User ID and New Email are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call the admin function directly through RPC
      const { data, error } = await supabase.rpc('admin_update_user_email', {
        target_user_id: userId,
        new_email: newEmail
      });

      if (error) {
        console.error('Error updating user email:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to update email",
          variant: "destructive"
        });
        return;
      }

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        toast({
          title: "Success",
          description: `Email updated successfully to ${(data as any).new_email}`,
        });
      } else {
        toast({
          title: "Error", 
          description: (data as any)?.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error updating user email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update User Email</CardTitle>
        <CardDescription>
          Admin tool to update user email addresses when needed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium mb-1">
            User ID
          </label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
          />
        </div>
        <div>
          <label htmlFor="newEmail" className="block text-sm font-medium mb-1">
            New Email
          </label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter new email address"
          />
        </div>
        <Button 
          onClick={handleUpdateEmail} 
          disabled={isLoading || !userId || !newEmail}
          className="w-full"
        >
          {isLoading ? 'Updating...' : 'Update Email'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserEmailUpdate;