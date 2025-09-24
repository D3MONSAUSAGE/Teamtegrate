// Lightweight camera scanner without heavy dependencies
let activeStream: MediaStream | null = null;
let activeVideo: HTMLVideoElement | null = null;

export async function listVideoDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices;
  } catch (error) {
    console.error('Failed to list video devices:', error);
    return [];
  }
}

export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (text: string) => void,
) {
  try {
    // Stop any existing stream
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
    }

    // Get camera stream with back camera preference
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' }, // Prefer back camera
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    activeStream = await navigator.mediaDevices.getUserMedia(constraints);
    activeVideo = videoEl;

    // iOS requirements to keep the camera inline & autoplay
    videoEl.setAttribute('playsinline', 'true');
    videoEl.muted = true;
    videoEl.autoplay = true;
    videoEl.srcObject = activeStream;

    await videoEl.play();

    // For now, we'll rely on manual input since we removed heavy barcode libraries
    // This provides camera preview for users to manually read and type barcodes
    console.log('Camera preview started - manual barcode entry available');
    
  } catch (error) {
    console.error('Failed to start camera:', error);
    throw new Error('Camera access failed. Please ensure camera permissions are granted.');
  }
}

export async function switchToBackCamera() {
  // Try to get back camera specifically
  try {
    const constraints = {
      video: {
        facingMode: { exact: 'environment' }
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (activeVideo && stream) {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      activeStream = stream;
      activeVideo.srcObject = stream;
    }
  } catch (error) {
    console.log('Back camera not available, using default camera');
  }
}

export function stopScan() {
  if (activeStream) {
    activeStream.getTracks().forEach(track => track.stop());
    activeStream = null;
  }
  if (activeVideo) {
    activeVideo.srcObject = null;
    activeVideo = null;
  }
}
