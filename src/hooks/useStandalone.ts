import { useEffect, useState } from 'react';

export function useStandalone() {
  const [standalone, setStandalone] = useState(false);
  
  useEffect(() => {
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // iOS Safari legacy flag
      (window.navigator as any).standalone === true;

    setStandalone(isStandalone);
    document.documentElement.classList.toggle('standalone', isStandalone);
    
    // Debug logging
    console.log('🔍 PWA Standalone Mode:', {
      isStandalone,
      matchMedia: window.matchMedia && window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: (window.navigator as any).standalone,
      userAgent: navigator.userAgent.includes('iPhone') ? 'iOS' : 'Other'
    });
  }, []);
  
  return standalone;
}