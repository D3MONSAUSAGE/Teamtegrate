// Lightweight camera scanner without heavy dependencies
let activeStream: MediaStream | null = null;
let activeVideo: HTMLVideoElement | null = null;
let isScanning: boolean = false;

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
    // Prevent multiple simultaneous scans
    if (isScanning) {
      console.log('Scan already in progress, stopping existing scan first');
      stopScan();
    }
    
    isScanning = true;
    console.log('Starting camera scan...');

    // Try progressive camera constraints for better mobile compatibility
    const constraintSets = [
      // First try: Ideal back camera with good resolution
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      },
      // Second try: Relaxed back camera constraints
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      // Third try: Any camera with minimal constraints
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      // Fourth try: Most basic constraints
      {
        video: true
      }
    ];

    let lastError: Error | null = null;
    
    for (const constraints of constraintSets) {
      try {
        console.log('Trying camera constraints:', constraints);
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        break; // Success, exit loop
      } catch (error: any) {
        console.log('Camera constraints failed:', error.message);
        lastError = error;
        continue; // Try next constraint set
      }
    }

    if (!activeStream && lastError) {
      throw lastError;
    }
    activeVideo = videoEl;

    // iOS requirements to keep the camera inline & autoplay
    videoEl.setAttribute('playsinline', 'true');
    videoEl.muted = true;
    videoEl.autoplay = true;
    videoEl.srcObject = activeStream;

    await videoEl.play();
    console.log('Camera started successfully');
    
  } catch (error) {
    console.error('Failed to start camera:', error);
    isScanning = false;
    stopScan(); // Clean up on error
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
  console.log('Stopping camera scan...');
  isScanning = false;
  
  // Stop all media tracks
  if (activeStream) {
    try {
      activeStream.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}, state: ${track.readyState}`);
        track.stop();
      });
    } catch (error) {
      console.error('Error stopping tracks:', error);
    }
    activeStream = null;
  }
  
  // Clean up video element
  if (activeVideo) {
    try {
      activeVideo.pause();
      activeVideo.srcObject = null;
      activeVideo.load(); // Force reload to clear any cached stream
    } catch (error) {
      console.error('Error cleaning video element:', error);
    }
    activeVideo = null;
  }
  
  console.log('Camera scan stopped successfully');
}
