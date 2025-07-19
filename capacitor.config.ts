
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teamtegrate.app',
  appName: 'TeamTegrate',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://91cd77c4-34d9-4c9a-a240-33280dceab90.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff',
      overlay: false,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'ionic',
      style: 'dark',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
