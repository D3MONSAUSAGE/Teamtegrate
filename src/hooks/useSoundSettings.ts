
import { useEffect, useState } from "react";

const STORAGE_KEY = "appSoundSettings";
export type SoundSettings = {
  enabled: boolean;
  volume: number; // 0.0 - 1.0
};

const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.5,
};

// Simple persistent sound settings hook
export function useSoundSettings() {
  const [settings, setSettings] = useState<SoundSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setEnabled = (enabled: boolean) => setSettings(s => ({ ...s, enabled }));
  const setVolume = (volume: number) => setSettings(s => ({ ...s, volume }));

  return {
    ...settings,
    setEnabled,
    setVolume,
  };
}
