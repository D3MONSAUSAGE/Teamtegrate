import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const usePWAPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  // Check if running as PWA
  const checkIsPWA = useCallback(() => {
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true ||
                     document.referrer.includes('android-app://');
    setIsPWA(isPWAMode);
    return isPWAMode;
  }, []);

  // Check if iOS device
  const isIOSDevice = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  // Check if iOS Safari
  const isIOSSafari = useCallback(() => {
    return isIOSDevice() && 
           /Safari/.test(navigator.userAgent) && 
           !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  }, [isIOSDevice]);

  // Show iOS install prompt
  const showIOSInstallPrompt = useCallback(() => {
    if (isIOSSafari() && !isPWA) {
      setShowIOSPrompt(true);
      return true;
    }
    return false;
  }, [isIOSSafari, isPWA]);

  // Hide iOS prompt
  const hideIOSPrompt = useCallback(() => {
    setShowIOSPrompt(false);
    localStorage.setItem('ios-prompt-dismissed', Date.now().toString());
  }, []);

  // Install PWA (Android/desktop)
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        toast.success('App installed successfully!');
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        toast('Installation cancelled');
        return false;
      }
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed');
      return false;
    }
  }, [deferredPrompt]);

  // Check if should show iOS prompt (not dismissed recently)
  const shouldShowIOSPrompt = useCallback(() => {
    const lastDismissed = localStorage.getItem('ios-prompt-dismissed');
    if (!lastDismissed) return true;
    
    const daysSinceDismissed = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24);
    return daysSinceDismissed > 7; // Show again after 7 days
  }, []);

  useEffect(() => {
    checkIsPWA();

    // Listen for beforeinstallprompt event (Android/desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setShowIOSPrompt(false);
      toast.success('App installed! You can now use it from your home screen.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-show iOS prompt after a delay (if conditions are met)
    const timer = setTimeout(() => {
      if (isIOSSafari() && !isPWA && shouldShowIOSPrompt()) {
        showIOSInstallPrompt();
      }
    }, 5000); // Show after 5 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearTimeout(timer);
    };
  }, [checkIsPWA, isIOSSafari, isPWA, shouldShowIOSPrompt, showIOSInstallPrompt]);

  return {
    isPWA,
    isInstallable,
    showIOSPrompt,
    isIOSDevice: isIOSDevice(),
    isIOSSafari: isIOSSafari(),
    installPWA,
    showIOSInstallPrompt,
    hideIOSPrompt,
    checkIsPWA
  };
};