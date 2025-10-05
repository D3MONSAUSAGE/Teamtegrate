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
    
    // For tablets, try to force front camera with exact constraint
    const attempts = isTablet ? [
      {
        video: {
          facingMode: { exact: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      {
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
    ] : [
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }
    ];

    let stream;
    for (const constraints of attempts) {
      try {
        console.log('🎥 Trying camera with constraints:', constraints);
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera access granted with facing mode:', constraints.video.facingMode);
        break;
      } catch (err) {
        console.log('⚠️ Camera attempt failed, trying next...', err);
        continue;
      }
    }
    
    if (!stream) {
      throw new Error('All camera attempts failed');
    }
    
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