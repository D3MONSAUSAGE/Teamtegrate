
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.91cd77c434d94c9aa24033280dceab90',
  appName: 'daily-team-sync',
  webDir: 'dist',
  server: {
    url: 'https://91cd77c4-34d9-4c9a-a240-33280dceab90.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;
