export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroidDevice = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export const isTabletDevice = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
  return isTablet;
};

export const checkCameraPermission = async (): Promise<PermissionState | 'unsupported'> => {
  try {
    if ('permissions' in navigator && 'query' in navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    }
    return 'unsupported';
  } catch (error) {
    console.log('Camera permission check not supported:', error);
    return 'unsupported';
  }
};

export const requestCameraAccess = async (): Promise<{ success: boolean; stream?: MediaStream; error?: string }> => {
  try {
    console.log('🎥 Requesting camera access...');
    
    const isTablet = isTabletDevice();
    const facingMode = isTablet ? 'user' : 'environment';
    
    const constraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Camera access granted');
    return { success: true, stream };
  } catch (error: any) {
    console.error('❌ Camera access denied:', error);
    
    let errorMessage = 'Camera access failed';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera permission denied. Please enable camera access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No camera found on this device.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Camera constraints could not be satisfied.';
    }
    
    return { success: false, error: errorMessage };
  }
};