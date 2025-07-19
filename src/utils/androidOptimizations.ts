
interface DeviceInfo {
  isAndroid: boolean;
  isWebView: boolean;
  devicePixelRatio: number;
  manufacturer: string;
  chromeVersion: number;
  androidVersion: number;
  screenWidth: number;
  screenHeight: number;
}

interface OptimizationLevel {
  level: 0 | 1 | 2 | 3; // 0 = nuclear reset, 1-3 = progressive enhancement
  description: string;
  cssClass: string;
}

export class AndroidOptimizations {
  private deviceInfo: DeviceInfo;
  private currentLevel: OptimizationLevel;
  private isDebugMode: boolean = false;

  constructor() {
    this.deviceInfo = this.detectDevice();
    this.currentLevel = this.determineOptimalLevel();
    this.init();
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isWebView = /wv/.test(userAgent) || (window.navigator as any).standalone === false;
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Detect manufacturer
    let manufacturer = 'unknown';
    if (/samsung/.test(userAgent)) manufacturer = 'samsung';
    else if (/xiaomi/.test(userAgent)) manufacturer = 'xiaomi';
    else if (/huawei/.test(userAgent)) manufacturer = 'huawei';
    else if (/oppo/.test(userAgent)) manufacturer = 'oppo';
    else if (/vivo/.test(userAgent)) manufacturer = 'vivo';

    // Extract Chrome version
    const chromeMatch = userAgent.match(/chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 0;

    // Extract Android version
    const androidMatch = userAgent.match(/android (\d+)/);
    const androidVersion = androidMatch ? parseInt(androidMatch[1]) : 0;

    return {
      isAndroid,
      isWebView,
      devicePixelRatio,
      manufacturer,
      chromeVersion,
      androidVersion,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    };
  }

  private determineOptimalLevel(): OptimizationLevel {
    const { isAndroid, devicePixelRatio, manufacturer, chromeVersion, androidVersion } = this.deviceInfo;

    // Default for non-Android devices
    if (!isAndroid) {
      return {
        level: 1,
        description: 'Basic optimization for non-Android',
        cssClass: 'android-level-1'
      };
    }

    // Start conservative for Android
    let level: 0 | 1 | 2 | 3 = 1;

    // Problematic devices get nuclear reset
    if (devicePixelRatio > 4 || devicePixelRatio < 0.5) {
      level = 0;
    } else if (chromeVersion < 70 || androidVersion < 8) {
      level = 0;
    } else if (manufacturer === 'samsung' && devicePixelRatio > 3) {
      level = 0; // Samsung high-DPI often has blur issues
    } else if (chromeVersion >= 90 && androidVersion >= 10) {
      level = 2; // Modern devices can handle more optimization
    }

    const levels = [
      { level: 0 as const, description: 'Nuclear reset - browser defaults only', cssClass: 'android-nuclear-reset' },
      { level: 1 as const, description: 'Basic anti-blur optimization', cssClass: 'android-level-1' },
      { level: 2 as const, description: 'Moderate optimization', cssClass: 'android-level-2' },
      { level: 3 as const, description: 'Full optimization', cssClass: 'android-level-3' }
    ];

    return levels[level];
  }

  private init(): void {
    console.log('🔧 Android Optimization Init:', {
      deviceInfo: this.deviceInfo,
      selectedLevel: this.currentLevel,
      isDebugMode: this.isDebugMode
    });

    this.applyOptimizationLevel();
    this.addDeviceClasses();
  }

  private applyOptimizationLevel(): void {
    // Remove all existing optimization classes
    const classesToRemove = [
      'android-device', 'android-level-1', 'android-level-2', 'android-level-3', 
      'android-nuclear-reset', 'android-webview', 'samsung-device', 'xiaomi-device', 
      'high-dpi', 'android-debug'
    ];
    
    classesToRemove.forEach(cls => document.body.classList.remove(cls));

    // Apply base Android class
    if (this.deviceInfo.isAndroid) {
      document.body.classList.add('android-device');
    }

    // Apply optimization level
    document.body.classList.add(this.currentLevel.cssClass);

    // Apply device-specific classes
    if (this.deviceInfo.isWebView) {
      document.body.classList.add('android-webview');
    }

    if (this.deviceInfo.manufacturer === 'samsung') {
      document.body.classList.add('samsung-device');
    } else if (this.deviceInfo.manufacturer === 'xiaomi') {
      document.body.classList.add('xiaomi-device');
    }

    if (this.deviceInfo.devicePixelRatio > 2.5) {
      document.body.classList.add('high-dpi');
    }

    // Add debug indicator if enabled
    if (this.isDebugMode) {
      document.body.classList.add('android-debug', `level-${this.currentLevel.level}`);
    }

    console.log(`✅ Applied optimization level ${this.currentLevel.level}: ${this.currentLevel.description}`);
  }

  private addDeviceClasses(): void {
    // Add manufacturer and version classes for CSS targeting
    if (this.deviceInfo.isAndroid) {
      document.body.classList.add(`android-${this.deviceInfo.androidVersion}`);
      document.body.classList.add(`chrome-${Math.floor(this.deviceInfo.chromeVersion / 10) * 10}`);
    }
  }

  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getCurrentLevel(): OptimizationLevel {
    return this.currentLevel;
  }

  public setOptimizationLevel(level: 0 | 1 | 2 | 3): void {
    const levels = [
      { level: 0 as const, description: 'Nuclear reset - browser defaults only', cssClass: 'android-nuclear-reset' },
      { level: 1 as const, description: 'Basic anti-blur optimization', cssClass: 'android-level-1' },
      { level: 2 as const, description: 'Moderate optimization', cssClass: 'android-level-2' },
      { level: 3 as const, description: 'Full optimization', cssClass: 'android-level-3' }
    ];

    this.currentLevel = levels[level];
    this.applyOptimizationLevel();
    
    console.log(`🔄 Optimization level changed to ${level}: ${this.currentLevel.description}`);
  }

  public enableDebugMode(enable: boolean = true): void {
    this.isDebugMode = enable;
    
    if (enable) {
      document.body.classList.add('android-debug', `level-${this.currentLevel.level}`);
      console.log('🐛 Android debug mode enabled');
    } else {
      document.body.classList.remove('android-debug', `level-${this.currentLevel.level}`);
      console.log('🐛 Android debug mode disabled');
    }
  }

  public recalibrate(): void {
    console.log('🔄 Recalibrating Android optimizations...');
    
    this.deviceInfo = this.detectDevice();
    this.currentLevel = this.determineOptimalLevel();
    this.init();
    
    console.log('✅ Recalibration complete');
  }

  public testAllLevels(): void {
    console.log('🧪 Testing all optimization levels...');
    
    const levels: (0 | 1 | 2 | 3)[] = [0, 1, 2, 3];
    let currentIndex = 0;

    const testNext = () => {
      if (currentIndex < levels.length) {
        this.setOptimizationLevel(levels[currentIndex]);
        console.log(`Testing level ${levels[currentIndex]} for 3 seconds...`);
        currentIndex++;
        setTimeout(testNext, 3000);
      } else {
        console.log('🧪 Testing complete. Returning to optimal level...');
        this.currentLevel = this.determineOptimalLevel();
        this.applyOptimizationLevel();
      }
    };

    testNext();
  }
}

export const androidOptimizations = new AndroidOptimizations();
