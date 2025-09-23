import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, AlertCircle, Smartphone } from 'lucide-react';
import { checkCameraPermission, isMobileDevice, isIOSDevice } from '@/utils/deviceUtils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CameraPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export const CameraPermissionDialog: React.FC<CameraPermissionDialogProps> = ({
  open,
  onOpenChange,
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | 'checking'>('checking');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    if (open) {
      checkPermissionStatus();
    }
  }, [open]);

  const checkPermissionStatus = async () => {
    const state = await checkCameraPermission();
    setPermissionState(state);
    
    if (state === 'granted') {
      onPermissionGranted();
      onOpenChange(false);
    } else if (state === 'denied') {
      setShowInstructions(true);
    }
  };

  const handleRequestPermission = () => {
    onPermissionGranted(); // This will trigger the actual camera request in the parent
  };

  const handleDeny = () => {
    onPermissionDenied();
    onOpenChange(false);
  };

  const renderPermissionContent = () => {
    if (permissionState === 'checking') {
      return (
        <div className="text-center py-6">
          <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p>Checking camera permissions...</p>
        </div>
      );
    }

    if (permissionState === 'denied' || showInstructions) {
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access was denied. To scan barcodes, you'll need to enable camera permissions.
            </AlertDescription>
          </Alert>
          
          {isMobileDevice() && (
            <div className="space-y-3">
              <h4 className="font-semibold">How to enable camera access:</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                {isIOSDevice() ? (
                  <>
                    <p>• Tap the "aA" icon in Safari's address bar</p>
                    <p>• Select "Website Settings"</p>
                    <p>• Set Camera to "Allow"</p>
                  </>
                ) : (
                  <>
                    <p>• Tap the lock/info icon in your browser's address bar</p>
                    <p>• Find "Camera" permissions</p>
                    <p>• Change from "Blocked" to "Allow"</p>
                    <p>• Refresh the page</p>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDeny} className="flex-1">
              Enter Manually
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Camera className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Enable Camera Access</h3>
          <p className="text-muted-foreground mb-4">
            We need access to your camera to scan barcodes. Your privacy is important - we only use the camera for scanning.
          </p>
        </div>

        {isMobileDevice() && (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Your browser will ask for camera permission. Please tap "Allow" to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDeny} className="flex-1">
            Enter Manually
          </Button>
          <Button onClick={handleRequestPermission} className="flex-1">
            Allow Camera
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Scanner</DialogTitle>
          <DialogDescription>
            Scan barcodes quickly with your device's camera
          </DialogDescription>
        </DialogHeader>
        
        {renderPermissionContent()}
      </DialogContent>
    </Dialog>
  );
};