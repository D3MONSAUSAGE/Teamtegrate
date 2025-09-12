import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';
import { usePWAPrompt } from '@/hooks/usePWAPrompt';

/**
 * PWA Installation Prompt Component
 * Shows platform-specific installation prompts for better notification support
 */
export const PWAInstallPrompt: React.FC = () => {
  const {
    isPWA,
    isInstallable,
    showIOSPrompt,
    isIOSDevice,
    installPWA,
    hideIOSPrompt,
    hideAndroidPrompt
  } = usePWAPrompt();

  // Don't show if already installed as PWA
  if (isPWA) return null;

  // Android/Desktop install prompt
  if (isInstallable) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Download className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Install TeamTegrate</h3>
                <p className="text-sm text-muted-foreground">
                  Get better notifications and offline access
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={installPWA} size="sm">
                Install
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                onClick={hideAndroidPrompt}
                className="p-1 h-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // iOS Safari install prompt
  if (showIOSPrompt && isIOSDevice) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Share className="h-6 w-6 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">Add to Home Screen</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  For better notifications and faster access:
                </p>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Tap the <Share className="inline h-3 w-3" /> share button</li>
                  <li>2. Scroll down and tap "Add to Home Screen"</li>
                  <li>3. Tap "Add" to install</li>
                </ol>
              </div>
            </div>
            <Button
              variant="ghost" 
              size="sm"
              onClick={hideIOSPrompt}
              className="p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};