
const createSound = (frequency: number, type: OscillatorType = 'sine', duration: number = 200) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

  oscillator.start();
  setTimeout(() => {
    oscillator.stop();
    audioContext.close();
  }, duration);
};

export const playSuccessSound = () => createSound(800, 'sine', 150);
export const playErrorSound = () => createSound(250, 'square', 300);
export const playStatusChangeSound = () => createSound(600, 'sine', 100);
export const playNotificationSound = () => createSound(700, 'sine', 200);
