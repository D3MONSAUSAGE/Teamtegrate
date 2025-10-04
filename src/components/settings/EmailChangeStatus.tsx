import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface EmailChangeStatusProps {
  currentEmail: string;
  pendingEmail?: string;
  onResendConfirmation?: () => Promise<void>;
}

export const EmailChangeStatus = ({ 
  currentEmail, 
  pendingEmail,
  onResendConfirmation 
}: EmailChangeStatusProps) => {
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!canResend && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const handleResendConfirmation = async () => {
    if (!pendingEmail) return;
    
    setIsResending(true);
    setCanResend(false);
    setCountdown(60);

    try {
      // Request to resend the confirmation email by updating to the same new email
      const { error } = await supabase.auth.updateUser({
        email: pendingEmail,
      });

      if (error) throw error;

      toast.success('Confirmation email resent! Check your inbox.');
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      toast.error(error.message || 'Failed to resend confirmation email');
      setCanResend(true);
    } finally {
      setIsResending(false);
    }
  };

  if (!pendingEmail) return null;

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <Clock className="h-4 w-4 text-amber-500" />
      <AlertTitle className="text-amber-500">Email Change Pending</AlertTitle>
      <AlertDescription className="space-y-3 mt-2">
        <div className="text-sm space-y-1">
          <p className="font-medium">
            Current email: <span className="text-foreground">{currentEmail}</span>
          </p>
          <p className="font-medium">
            New email: <span className="text-foreground">{pendingEmail}</span>
          </p>
        </div>
        
        <div className="bg-background/50 rounded-md p-3 space-y-2">
          <p className="text-sm font-medium flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Action Required:</span>
          </p>
          <ol className="text-sm space-y-1 ml-6 list-decimal">
            <li>Check your new email inbox: <strong>{pendingEmail}</strong></li>
            <li>Open the confirmation email from us</li>
            <li>Click the confirmation link</li>
            <li>Your email will be updated immediately</li>
          </ol>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Didn't receive the email? Check spam folder.
          </p>
          
          {onResendConfirmation && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendConfirmation}
              disabled={!canResend || isResending}
              className="text-xs"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : !canResend ? (
                <>
                  <Clock className="mr-1 h-3 w-3" />
                  Resend in {countdown}s
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Resend Email
                </>
              )}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
