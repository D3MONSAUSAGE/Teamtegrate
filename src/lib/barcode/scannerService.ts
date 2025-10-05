// Unified scanner service: Native BarcodeDetector → Quagga fallback → Manual
export type BarcodeHit = { text: string; format: string };

export type StartNativeOpts = {
  videoEl: HTMLVideoElement;
  onResult: (hit: BarcodeHit) => void;
  preferredFormats?: string[];
  throttleMs?: number;
};

export type StartQuaggaOpts = {
  mountEl: HTMLElement;
  onResult: (hit: BarcodeHit) => void;
  readers?: string[];
  frequency?: number;
};

export function hasNativeDetector(): boolean {
  // @ts-ignore
  return typeof window !== 'undefined' && 'BarcodeDetector' in window;
}

export async function startNative(opts: StartNativeOpts): Promise<() => Promise<void>> {
  const { videoEl, onResult, preferredFormats, throttleMs = 120 } = opts;
  
  // @ts-ignore
  const BarcodeDetectorCtor = window.BarcodeDetector;
  const supported = await (BarcodeDetectorCtor?.getSupportedFormats?.() ?? []);
  const formats = preferredFormats || supported || ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'];
  
  // @ts-ignore
  const detector = new BarcodeDetectorCtor({ formats });
  
  let stopped = false;
  let lastTs = 0;

  const step = async () => {
    if (stopped) return;
    const now = performance.now();
    if (now - lastTs < throttleMs) {
      requestAnimationFrame(step);
      return;
    }
    lastTs = now;

    try {
      // @ts-ignore
      const codes = await detector.detect(videoEl);
      if (codes && codes.length) {
        const c = codes[0];
        const text = c.rawValue || '';
        const format = c.format || '';
        if (text) {
          onResult({ text, format });
        }
      }
    } catch (_) {
      // Continue on errors
    }

    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);

  return async () => {
    stopped = true;
  };
}

export async function startQuagga(opts: StartQuaggaOpts): Promise<() => Promise<void>> {
  const { mountEl, onResult, readers, frequency = 10 } = opts;
  
  // Dynamic import - no static dependency
  const Quagga = (await import('quagga')).default;
  
  // Worker path configuration for production builds
  (Quagga as any).config = (Quagga as any).config || {};
  (Quagga as any).config.locateFile = (file: string) =>
    new URL(`../../node_modules/quagga/dist/${file}`, import.meta.url).toString();

  // Detect if tablet - use front camera for tablets, back camera for phones
  const isTablet = /(ipad|tablet|(android(?!.*mobile)))/.test(navigator.userAgent.toLowerCase());
  const facingMode = isTablet ? 'user' : 'environment';

  const config = {
    inputStream: {
      type: 'LiveStream',
      target: mountEl,
      constraints: {
        facingMode: isTablet ? { exact: 'user' } : { ideal: facingMode },
        aspectRatio: { ideal: 1.777 },
        focusMode: 'continuous',
      }
    },
    locator: { 
      patchSize: 'medium', 
      halfSample: true 
    },
    numOfWorkers: Math.min(2, navigator.hardwareConcurrency || 2),
    frequency,
    decoder: {
      readers: readers || [
        'ean_reader',
        'ean_8_reader',
        'upc_reader',
        'upc_e_reader',
        'code_128_reader',
        'code_39_reader',
        'itf_reader',
        'codabar_reader'
      ]
    }
  } as any;

  await new Promise<void>((resolve, reject) => {
    Quagga.init(config, (err: any) => err ? reject(err) : resolve());
  });

  let lastText = '';
  const onDetected = (res: any) => {
    const text = res?.codeResult?.code;
    const format = res?.codeResult?.format;
    if (text && text !== lastText) {
      lastText = text;
      onResult({ text, format });
    }
  };

  Quagga.onDetected(onDetected);
  Quagga.start();

  return async () => {
    try {
      Quagga.offDetected(onDetected);
      Quagga.stop();
    } catch {}
    
    // Clean up inserted DOM elements
    mountEl.innerHTML = '';
  };
}

export async function toggleTorch(videoEl: HTMLVideoElement, on: boolean): Promise<boolean> {
  try {
    const track = (videoEl.srcObject as MediaStream)?.getVideoTracks?.()?.[0];
    if (track) {
      await track.applyConstraints({ advanced: [{ torch: on } as any] });
      return true;
    }
  } catch {}
  return false;
}

export async function getCameraStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
  // Detect if tablet - use front camera for tablets, back camera for phones
  const isTablet = /(ipad|tablet|(android(?!.*mobile)))/.test(navigator.userAgent.toLowerCase());
  const facingMode = isTablet ? 'user' : 'environment';
  
  console.log('📷 getCameraStream - Device type:', isTablet ? 'TABLET' : 'PHONE', 'facingMode:', facingMode);
  
  // Progressive constraint degradation - for tablets, force front camera with exact first
  const attempts = isTablet ? [
    {
      video: {
        facingMode: { exact: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: 'continuous'
      },
      audio: false
    },
    {
      video: {
        facingMode: { ideal: 'user' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: 'continuous'
      },
      audio: false
    },
    {
      video: {
        facingMode: { ideal: 'user' },
        focusMode: 'continuous'
      },
      audio: false
    },
    {
      video: { facingMode: { ideal: 'user' } },
      audio: false
    },
    {
      video: true,
      audio: false
    }
  ] : [
    {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: 'continuous'
      },
      audio: false
    },
    {
      video: {
        facingMode: { ideal: facingMode },
        focusMode: 'continuous'
      },
      audio: false
    },
    {
      video: { facingMode: { ideal: facingMode } },
      audio: false
    },
    {
      video: true,
      audio: false
    }
  ];

  for (let i = 0; i < attempts.length; i++) {
    const attempt = attempts[i];
    try {
      console.log(`📷 Attempt ${i + 1}/${attempts.length}:`, attempt.video);
      const stream = await navigator.mediaDevices.getUserMedia(constraints || attempt);
      console.log('✅ Camera stream acquired successfully');
      return stream;
    } catch (e) {
      console.log(`⚠️ Attempt ${i + 1} failed:`, e);
      continue;
    }
  }
  
  throw new Error('Could not access camera');
}

export async function stopStream(stream?: MediaStream): Promise<void> {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
}