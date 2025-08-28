/**
 * Browser detection utilities for handling browser-specific behaviors
 */

export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const vendor = window.navigator.vendor;
  
  // Check for Safari (including mobile Safari)
  return /Safari/.test(userAgent) && /Apple Computer/.test(vendor) && !/Chrome/.test(userAgent);
};

export const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  
  // Check for iOS Safari
  return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
};

export const isAppleDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const platform = window.navigator.platform;
  
  // Check for any Apple device
  return /Mac|iPad|iPhone|iPod/.test(platform) || /Mac OS X/.test(userAgent);
};

export const getSafeFormSubmissionHandler = (handler: (e: React.FormEvent) => Promise<void>) => {
  return async (e: React.FormEvent) => {
    // Prevent default form submission immediately
    e.preventDefault();
    e.stopPropagation();
    
    if (isSafari() || isAppleDevice()) {
      // For Safari/Apple devices, add extra prevention measures
      const form = e.target as HTMLFormElement;
      if (form && form.getAttribute) {
        // Temporarily disable form submission
        const originalAction = form.action;
        form.action = 'javascript:void(0)';
        
        try {
          await handler(e);
        } finally {
          // Restore original action if it existed
          if (originalAction) {
            form.action = originalAction;
          }
        }
      } else {
        await handler(e);
      }
    } else {
      await handler(e);
    }
  };
};