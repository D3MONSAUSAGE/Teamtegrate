let reader: any = null;
let activeDeviceId: string | null = null;
let BrowserMultiFormatReader: any = null;

// Dynamic import to reduce bundle size
async function loadZXing() {
  if (!BrowserMultiFormatReader) {
    const zxing = await import('@zxing/browser');
    BrowserMultiFormatReader = zxing.BrowserMultiFormatReader;
  }
  return BrowserMultiFormatReader;
}

export async function listVideoDevices() {
  const ReaderClass = await loadZXing();
  const devices = await ReaderClass.listVideoInputDevices();
  // prefer back camera when labels are available
  const back = devices.find((d: any) => /back|rear|environment/i.test(d.label));
  activeDeviceId = (back ?? devices[0])?.deviceId ?? null;
  return devices;
}

export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (text: string) => void,
) {
  const ReaderClass = await loadZXing();
  if (!reader) reader = new ReaderClass();
  if (!activeDeviceId) await listVideoDevices();

  // iOS requirements to keep the camera inline & autoplay
  videoEl.setAttribute('playsinline', 'true');
  videoEl.muted = true;
  videoEl.autoplay = true;

  await reader.decodeFromVideoDevice(activeDeviceId, videoEl, (res: any, err: any) => {
    if (res?.getText) onResult(res.getText());
  });
}

export async function switchToBackCamera() {
  const devices = await listVideoDevices();
  const back = devices.find((d: any) => /back|rear|environment/i.test(d.label));
  if (back) activeDeviceId = back.deviceId;
}

export function stopScan() {
  // Create a new reader instance for the next scan
  // This is the safest way to "reset" the reader
  reader = null;
  activeDeviceId = null;
}
