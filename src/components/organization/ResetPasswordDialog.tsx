import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Key, Mail, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [error, setError] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTemporaryPassword(password);
  };

  const handleSendRecoveryLink = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          email: user.email,
          action: 'send_recovery_link'
        }
      });

      if (error) throw error;

      toast.success(`Password reset link sent to ${user.email}`);
      onOpenChange(false);
    } catch (err: any) {
      console.error('Failed to send recovery link:', err);
      setError(err.message || 'Failed to send password reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetTemporaryPassword = async () => {
    if (!temporaryPassword || temporaryPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          email: user.email,
          action: 'set_temporary_password',
          temporaryPassword: temporaryPassword
        }
      });

      if (error) throw error;

      toast.success(`Temporary password set for ${user.email}`);
      onOpenChange(false);
      setTemporaryPassword('');
    } catch (err: any) {
      console.error('Failed to set temporary password:', err);
      setError(err.message || 'Failed to set temporary password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Reset Password for {user?.name || user?.email}
          </DialogTitle>
          <DialogDescription>
            Choose how to reset this user's password. They will need to use the new credentials to log in.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="recovery-link" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recovery-link">Send Reset Link</TabsTrigger>
            <TabsTrigger value="temporary-password">Set Temporary Password</TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent value="recovery-link" className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>A secure reset link will be sent to {user?.email}</span>
            </div>
            
            <Button 
              onClick={handleSendRecoveryLink} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Password Reset Link
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="temporary-password" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">Temporary Password</Label>
              <div className="flex gap-2">
                <Input
                  id="temporaryPassword"
                  type="text"
                  value={temporaryPassword}
                  onChange={(e) => setTemporaryPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomPassword}
                  size="sm"
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters. The user will need to change this password on first login.
              </p>
            </div>

            <Button 
              onClick={handleSetTemporaryPassword} 
              disabled={isLoading || !temporaryPassword}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting Password...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Set Temporary Password
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;