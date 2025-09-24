import { BrowserMultiFormatReader } from '@zxing/browser';

let reader: BrowserMultiFormatReader | null = null;
let activeDeviceId: string | null = null;

export async function listVideoDevices() {
  const devices = await BrowserMultiFormatReader.listVideoInputDevices();
  // prefer back camera when labels are available
  const back = devices.find(d => /back|rear|environment/i.test(d.label));
  activeDeviceId = (back ?? devices[0])?.deviceId ?? null;
  return devices;
}

export async function startScan(
  videoEl: HTMLVideoElement,
  onResult: (text: string) => void,
) {
  if (!reader) reader = new BrowserMultiFormatReader();
  if (!activeDeviceId) await listVideoDevices();

  // iOS requirements to keep the camera inline & autoplay
  videoEl.setAttribute('playsinline', 'true');
  videoEl.muted = true;
  videoEl.autoplay = true;

  await reader.decodeFromVideoDevice(activeDeviceId, videoEl, (res, err) => {
    if (res?.getText) onResult(res.getText());
  });
}

export async function switchToBackCamera() {
  const devices = await listVideoDevices();
  const back = devices.find(d => /back|rear|environment/i.test(d.label));
  if (back) activeDeviceId = back.deviceId;
}

export function stopScan() {
  // Create a new reader instance for the next scan
  // This is the safest way to "reset" the reader
  reader = null;
  activeDeviceId = null;
}
