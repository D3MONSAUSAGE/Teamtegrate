// Advanced barcode scanner with multi-format support and lazy loading
import jsQR from 'jsqr';

let activeStream: MediaStream | null = null;
let activeVideo: HTMLVideoElement | null = null;
let isScanning: boolean = false;
let detectionLoop: number | null = null;
let detectionCanvas: HTMLCanvasElement | null = null;
let detectionContext: CanvasRenderingContext2D | null = null;
let lastDetectionTime: number = 0;
let zxingReader: any = null;
let zxingLibrary: any = null;

// Lazy load ZXing library to reduce initial bundle size
async function loadZXingLibrary() {
  if (!zxingLibrary) {
    try {
      zxingLibrary = await import('@zxing/library');
      console.log('ZXing library loaded successfully');
    } catch (error) {
      console.error('Failed to load ZXing library:', error);
      zxingLibrary = null;
    }
  }
  return zxingLibrary;
}

// Initialize ZXing reader with optimized settings
async function initializeZXingReader() {
  if (!zxingReader) {
    const lib = await loadZXingLibrary();
    if (!lib) return null;
    
    try {
      zxingReader = new lib.BrowserMultiFormatReader();
      console.log('ZXing reader initialized');
    } catch (error) {
      console.error('Failed to initialize ZXing reader:', error);
      zxingReader = null;
    }
  }
  return zxingReader;
}

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

// Lightweight image processing for better detection
function enhanceImageData(imageData: ImageData): ImageData {
  // Simple brightness/contrast adjustment without creating new ImageData
  const data = imageData.data;
  
  // In-place enhancement to save memory
  for (let i = 0; i < data.length; i += 4) {
    // Light contrast and brightness boost
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.1 + 128));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.1 + 128));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.1 + 128));
  }
  
  return imageData;
}

// Optimized barcode detection with lazy loading and memory efficiency
async function detectBarcode(videoEl: HTMLVideoElement): Promise<string | null> {
  if (!detectionCanvas || !detectionContext) {
    detectionCanvas = document.createElement('canvas');
    detectionContext = detectionCanvas.getContext('2d');
    if (!detectionContext) return null;
  }

  // Set canvas size to match video with memory optimization
  const videoWidth = videoEl.videoWidth;
  const videoHeight = videoEl.videoHeight;
  
  if (videoWidth === 0 || videoHeight === 0) return null;
  
  // Limit canvas size to reduce memory usage
  const maxSize = 800;
  let canvasWidth = videoWidth;
  let canvasHeight = videoHeight;
  
  if (videoWidth > maxSize || videoHeight > maxSize) {
    const scale = Math.min(maxSize / videoWidth, maxSize / videoHeight);
    canvasWidth = Math.floor(videoWidth * scale);
    canvasHeight = Math.floor(videoHeight * scale);
  }
  
  detectionCanvas.width = canvasWidth;
  detectionCanvas.height = canvasHeight;

  // Draw scaled video frame to canvas
  detectionContext.drawImage(videoEl, 0, 0, canvasWidth, canvasHeight);
  
  // Try jsQR first (lighter and faster for QR codes)
  try {
    const imageData = detectionContext.getImageData(0, 0, canvasWidth, canvasHeight);
    enhanceImageData(imageData); // In-place enhancement
    
    const qrResult = jsQR(imageData.data, canvasWidth, canvasHeight, {
      inversionAttempts: 'dontInvert',
    });
    if (qrResult) {
      console.log(`jsQR detected QR code: ${qrResult.data}`);
      return qrResult.data;
    }
  } catch (jsqrError) {
    console.log('jsQR detection failed:', jsqrError);
  }
  
  // Try ZXing for other barcode formats (lazy loaded)
  try {
    const reader = await initializeZXingReader();
    if (reader) {
      const dataUrl = detectionCanvas.toDataURL('image/jpeg', 0.8); // Use JPEG for smaller size
      const result = await reader.decodeFromImage(dataUrl);
      if (result) {
        console.log(`ZXing detected ${result.getBarcodeFormat()}: ${result.getText()}`);
        return result.getText();
      }
    }
  } catch (error) {
    console.log('ZXing detection failed:', error);
  }
  
  return null;
}

// Detection loop with performance optimization
function startDetectionLoop(videoEl: HTMLVideoElement, onResult: (text: string) => void) {
  const detect = async () => {
    if (!isScanning || !videoEl || videoEl.readyState < 2) {
      if (isScanning) {
        detectionLoop = requestAnimationFrame(detect);
      }
      return;
    }

    // Throttle detection to avoid excessive processing and memory usage
    const now = Date.now();
    if (now - lastDetectionTime < 200) { // Max 5 FPS for detection to reduce memory pressure
      detectionLoop = requestAnimationFrame(detect);
      return;
    }
    lastDetectionTime = now;

    try {
      const result = await detectBarcode(videoEl);
      if (result && result.trim()) {
        console.log(`Barcode detected: ${result}`);
        onResult(result.trim());
        return; // Stop detection after successful scan
      }
    } catch (error) {
      console.error('Detection error:', error);
    }

    // Continue detection loop
    if (isScanning) {
      detectionLoop = requestAnimationFrame(detect);
    }
  };

  detect();
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
    console.log('Starting enhanced barcode scan...');

    // Progressive camera constraints optimized for barcode scanning
    const constraintSets = [
      // First try: High resolution back camera with auto-focus
      {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          focusMode: { ideal: 'continuous' },
          focusDistance: { ideal: 0.1 }
        }
      },
      // Second try: Medium resolution with focus optimization
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          focusMode: 'continuous'
        }
      },
      // Third try: Standard resolution back camera
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      // Fourth try: Any available camera
      {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      },
      // Last resort: Most basic constraints  
      {
        video: true
      }
    ];

    let lastError: Error | null = null;
    
    for (const constraints of constraintSets) {
      try {
        console.log('Trying optimized camera constraints:', constraints);
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

    // Configure video element for optimal scanning
    videoEl.setAttribute('playsinline', 'true');
    videoEl.muted = true;
    videoEl.autoplay = true;
    videoEl.srcObject = activeStream;

    await videoEl.play();
    
    // Wait for video to be ready before starting detection
    await new Promise<void>((resolve) => {
      const checkReady = () => {
        if (videoEl.readyState >= 2 && videoEl.videoWidth > 0) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });

    // Start the detection loop
    startDetectionLoop(videoEl, onResult);
    
    console.log(`Camera started successfully - Resolution: ${videoEl.videoWidth}x${videoEl.videoHeight}`);
    
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
  console.log('Stopping enhanced barcode scan...');
  isScanning = false;
  
  // Stop detection loop
  if (detectionLoop) {
    cancelAnimationFrame(detectionLoop);
    detectionLoop = null;
  }
  
  // Clean up ZXing reader
  if (zxingReader) {
    try {
      zxingReader.reset();
    } catch (error) {
      console.error('Error resetting ZXing reader:', error);
    }
  }
  
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
  
  // Clean up canvas elements
  if (detectionCanvas) {
    detectionCanvas = null;
    detectionContext = null;
  }
  
  // Reset detection timing
  lastDetectionTime = 0;
  
  console.log('Enhanced barcode scan stopped successfully');
}
