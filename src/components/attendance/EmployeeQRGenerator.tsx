import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, RefreshCw, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import QRCode from 'qrcode';
import { toast } from 'sonner';

interface EmployeeQRGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenType: 'clock_in' | 'clock_out';
}

export const EmployeeQRGenerator: React.FC<EmployeeQRGeneratorProps> = ({
  open,
  onOpenChange,
  tokenType
}) => {
  const { user } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-attendance-qr', {
        body: { tokenType, expirationSeconds: 30 }
      });

      if (functionError) {
        // Parse detailed error from edge function
        const errorMessage = functionError.message || 'Unknown error';
        const errorDetails = data?.error || data?.details || errorMessage;
        throw new Error(errorDetails);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      // Generate QR code image
      const qrImageUrl = await QRCode.toDataURL(data.token, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      setQrDataUrl(qrImageUrl);
      setTokenData(data);
      setCountdown(data.expirationSeconds);

    } catch (err: any) {
      console.error('QR generation error:', err);
      
      // Extract error details from edge function response
      let userMessage = 'Failed to generate QR code';
      
      if (err?.context?.body) {
        const errorData = err.context.body;
        userMessage = errorData.details || errorData.error || userMessage;
      } else if (err?.message) {
        userMessage = err.message;
      }
      
      // Provide specific guidance based on error type
      if (userMessage.includes('Already clocked in')) {
        userMessage = 'You are already clocked in. Please clock out first.';
      } else if (userMessage.includes('No active time entry')) {
        userMessage = 'You are not clocked in. Please clock in first.';
      } else if (userMessage.includes('No active schedule')) {
        userMessage = 'No schedule for today. Contact your manager or check attendance settings.';
      }
      
      setError(userMessage);
      toast.error(userMessage);
    } finally {
      setLoading(false);
    }
  }, [user, tokenType]);

  // Generate QR when dialog opens
  useEffect(() => {
    if (open && !qrDataUrl) {
      generateQR();
    }
  }, [open, generateQR, qrDataUrl]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-refresh when expired
  useEffect(() => {
    if (countdown === 0 && open && qrDataUrl) {
      generateQR();
    }
  }, [countdown, open, qrDataUrl, generateQR]);

  const handleRefresh = () => {
    setQrDataUrl('');
    setTokenData(null);
    generateQR();
  };

  const handleClose = () => {
    setQrDataUrl('');
    setTokenData(null);
    setCountdown(0);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {tokenType === 'clock_in' ? 'Clock In QR Code' : 'Clock Out QR Code'}
          </DialogTitle>
          <DialogDescription>
            Scan this QR code at any wall-mounted scanner station to {tokenType === 'clock_in' ? 'clock in' : 'clock out'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <User className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">{user?.name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating QR code...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4 py-12">
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-sm text-center text-muted-foreground max-w-xs">{error}</p>
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : qrDataUrl ? (
              <div className="relative">
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className="w-full max-w-xs rounded-lg border-4 border-primary/20 shadow-lg"
                />
                
                {/* Countdown Overlay */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32">
                  <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full border-2 ${
                    countdown <= 10 
                      ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                      : 'bg-primary/10 border-primary/30 text-primary'
                  } shadow-lg backdrop-blur-sm`}>
                    <Clock className="h-4 w-4" />
                    <span className="font-bold text-lg">{countdown}s</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Instructions */}
          {qrDataUrl && !error && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <p className="text-muted-foreground">
                  Hold your phone steady in front of the scanner station camera
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-600 mt-0.5" />
                <p className="text-muted-foreground">
                  QR code expires in {countdown} seconds for security
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <RefreshCw className="h-4 w-4 text-blue-600 mt-0.5" />
                <p className="text-muted-foreground">
                  Code will auto-refresh when expired
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Code
            </Button>
            <Button 
              onClick={handleClose} 
              variant="secondary" 
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};