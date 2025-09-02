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

export const isEdge = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  
  // Check for Microsoft Edge (both Chromium and legacy Edge)
  return /Edge/.test(userAgent) || /Edg/.test(userAgent);
};

export const supportsBlobUrls = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Some browsers block blob URLs for security reasons
  // Check if blob URLs are supported and not blocked
  try {
    const blob = new Blob(['test'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const getFileTypeCategory = (fileName: string): 'image' | 'pdf' | 'document' | 'text' | 'other' => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const documentTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
  const textTypes = ['txt', 'md', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts'];
  
  if (extension === 'pdf') return 'pdf';
  if (imageTypes.includes(extension)) return 'image';
  if (documentTypes.includes(extension)) return 'document';
  if (textTypes.includes(extension)) return 'text';
  return 'other';
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