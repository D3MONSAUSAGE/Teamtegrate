
interface DeviceInfo {
  isAndroid: boolean;
  isWebView: boolean;
  manufacturer: string;
  chromeVersion: number;
  androidVersion: number;
}

export class AndroidOptimizations {
  private deviceInfo: DeviceInfo;
  private isDebugMode: boolean = false;
  private isEnabled: boolean = false;

  constructor() {
    this.deviceInfo = this.detectDevice();
    // Removed auto-init to prevent automatic application of styles
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isWebView = /wv/.test(userAgent);
    
    let manufacturer = 'unknown';
    if (/samsung/.test(userAgent)) manufacturer = 'samsung';
    else if (/xiaomi/.test(userAgent)) manufacturer = 'xiaomi';

    const chromeMatch = userAgent.match(/chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;

    const androidMatch = userAgent.match(/android (\d+)/);
    const androidVersion = androidMatch ? parseInt(androidMatch[1]) : 0;

    return {
      isAndroid,
      isWebView,
      manufacturer,
      chromeVersion,
      androidVersion
    };
  }

  private init(): void {
    console.log('🔧 Android Optimization Init (Nuclear Reset Mode):', {
      deviceInfo: this.deviceInfo,
      isEnabled: this.isEnabled
    });

    // Apply nuclear reset by default
    this.applyNuclearReset();
  }

  private applyNuclearReset(): void {
    // Remove all optimization classes
    const classesToRemove = [
      'android-device', 'android-level-1', 'android-level-2', 'android-level-3', 
      'android-nuclear-reset', 'android-webview', 'samsung-device', 'xiaomi-device', 
      'high-dpi', 'android-debug'
    ];
    
    classesToRemove.forEach(cls => document.body.classList.remove(cls));

    // Apply only the clean reset
    document.body.classList.add('android-reset');

    // Add minimal touch optimization if Android
    if (this.deviceInfo.isAndroid) {
      document.body.classList.add('android-touch-optimized');
    }

    if (this.isDebugMode) {
      document.body.classList.add('android-debug');
    }

    console.log('✅ Nuclear reset applied - using browser defaults');
  }

  public enableOptimizations(enable: boolean = true): void {
    this.isEnabled = enable;
    if (enable) {
      console.log('⚠️ Optimizations disabled in nuclear reset mode');
    }
  }

  public enableDebugMode(enable: boolean = true): void {
    this.isDebugMode = enable;
    
    if (enable) {
      document.body.classList.add('android-debug');
      console.log('🐛 Android debug mode enabled (nuclear reset)');
    } else {
      document.body.classList.remove('android-debug');
      console.log('🐛 Android debug mode disabled');
    }
  }

  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getCurrentLevel(): { level: string; description: string } {
    return {
      level: 'nuclear-reset',
      description: 'Browser defaults only - no custom optimizations'
    };
  }
}

// Clean up any existing Android CSS classes
const cleanAndroidClasses = () => {
  const classesToRemove = [
    'android-device', 'android-level-1', 'android-level-2', 'android-level-3', 
    'android-nuclear-reset', 'android-webview', 'samsung-device', 'xiaomi-device', 
    'high-dpi', 'android-debug', 'android-reset', 'android-touch-optimized'
  ];
  
  classesToRemove.forEach(cls => document.body.classList.remove(cls));
  console.log('🧹 Cleaned all Android optimization classes');
};

// Clean up immediately when this file is imported
cleanAndroidClasses();

export const androidOptimizations = new AndroidOptimizations();
