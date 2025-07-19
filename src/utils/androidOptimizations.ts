interface DeviceInfo {
  isAndroid: boolean;
  isWebView: boolean;
  devicePixelRatio: number;
  manufacturer: string;
  chromeVersion: number;
  androidVersion: number;
}

interface RenderingStrategy {
  useHardwareAcceleration: boolean;
  fontRenderingMethod: 'antialiased' | 'subpixel' | 'auto';
  transformOptimization: 'translate3d' | 'translateZ' | 'none';
  cssContainment: boolean;
}

export class AndroidOptimizations {
  private deviceInfo: DeviceInfo;
  private renderingStrategy: RenderingStrategy;

  constructor() {
    this.deviceInfo = this.detectDevice();
    this.renderingStrategy = this.determineRenderingStrategy();
    this.logDeviceInfo();
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
      androidVersion
    };
  }

  private logDeviceInfo(): void {
    console.log('🔍 Android Blur Fix - Device Analysis:', {
      isAndroid: this.deviceInfo.isAndroid,
      manufacturer: this.deviceInfo.manufacturer,
      androidVersion: this.deviceInfo.androidVersion,
      chromeVersion: this.deviceInfo.chromeVersion,
      devicePixelRatio: this.deviceInfo.devicePixelRatio,
      isWebView: this.deviceInfo.isWebView,
      userAgent: navigator.userAgent,
      renderingStrategy: this.renderingStrategy
    });

    if (this.deviceInfo.isAndroid) {
      console.log('🤖 Android Device - Applying blur fixes');
      console.log('🎨 Rendering Strategy:', this.renderingStrategy);
    }
  }

  private determineRenderingStrategy(): RenderingStrategy {
    const { isAndroid, isWebView, devicePixelRatio, manufacturer, chromeVersion } = this.deviceInfo;

    // Default strategy for non-Android devices
    if (!isAndroid) {
      console.log('📱 Non-Android device - using standard optimizations');
      return {
        useHardwareAcceleration: true,
        fontRenderingMethod: 'antialiased',
        transformOptimization: 'translate3d',
        cssContainment: true
      };
    }

    // Android-specific strategy focused on preventing blur
    let strategy: RenderingStrategy = {
      useHardwareAcceleration: false,
      fontRenderingMethod: 'subpixel',
      transformOptimization: 'none',
      cssContainment: false
    };

    // Manufacturer-specific adjustments
    if (manufacturer === 'samsung') {
      strategy.fontRenderingMethod = 'auto';
      console.log('🔧 Samsung device detected - using auto font rendering');
    }

    if (isWebView) {
      strategy.fontRenderingMethod = 'antialiased';
      console.log('🌐 WebView detected - using antialiased fonts');
    }

    // High DPI handling
    if (devicePixelRatio > 3) {
      strategy.fontRenderingMethod = 'auto';
      console.log('📱 High DPI detected (', devicePixelRatio, ') - using auto rendering');
    }

    // Chrome version specific handling
    if (chromeVersion < 80) {
      strategy.fontRenderingMethod = 'auto';
      console.log('🔧 Old Chrome version (', chromeVersion, ') - using conservative settings');
    }

    console.log('✅ Final Android blur fix strategy:', strategy);
    return strategy;
  }

  private init(): void {
    console.log('🚀 Initializing Android blur fixes...');
    this.applyViewportFix();
    this.applyFontOptimizations();
    this.applyDeviceClasses();
    this.preventBlurTransforms();
    this.addDeviceSpecificCSS();
    console.log('✅ Android blur fix initialization complete');
  }

  private applyViewportFix(): void {
    const { devicePixelRatio } = this.deviceInfo;
    
    // More conservative viewport handling
    if (devicePixelRatio > 2.5 || devicePixelRatio < 0.75) {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        // Allow slight scaling to prevent forced browser scaling
        metaViewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, minimum-scale=0.9, maximum-scale=1.1, viewport-fit=cover, user-scalable=yes'
        );
        console.log('🔧 Viewport adjusted for extreme DPR:', devicePixelRatio);
      }
    }
  }

  private applyFontOptimizations(): void {
    const { fontRenderingMethod } = this.renderingStrategy;
    
    // Remove any existing font optimization styles
    const existingStyle = document.getElementById('android-font-optimization');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'android-font-optimization';
    
    let fontCSS = '';
    
    if (fontRenderingMethod === 'subpixel') {
      fontCSS = `
        .android-blur-fix {
          -webkit-font-smoothing: subpixel-antialiased !important;
          -moz-osx-font-smoothing: auto !important;
          text-rendering: auto !important;
          font-smooth: auto !important;
        }
      `;
      console.log('🔤 Applied subpixel font rendering for blur fix');
    } else if (fontRenderingMethod === 'antialiased') {
      fontCSS = `
        .webview-blur-fix {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
        }
      `;
      console.log('🔤 Applied antialiased font rendering for WebView');
    } else {
      fontCSS = `
        .android-blur-fix {
          -webkit-font-smoothing: auto !important;
          -moz-osx-font-smoothing: auto !important;
          text-rendering: auto !important;
          font-smooth: auto !important;
        }
      `;
      console.log('🔤 Applied auto font rendering (conservative)');
    }
    
    style.textContent = fontCSS;
    document.head.appendChild(style);
  }

  private applyDeviceClasses(): void {
    const { isAndroid, isWebView, manufacturer } = this.deviceInfo;
    
    // Clear existing classes first
    document.body.classList.remove('android-blur-fix', 'webview-blur-fix', 'samsung-blur-fix');
    
    if (isAndroid) {
      document.body.classList.add('android-blur-fix');
      console.log('🤖 Applied android-blur-fix class');
      
      if (isWebView) {
        document.body.classList.add('webview-blur-fix');
        console.log('🌐 Applied webview-blur-fix class');
      }
      
      if (manufacturer === 'samsung') {
        document.body.classList.add('samsung-blur-fix');
        console.log('📱 Applied samsung-blur-fix class');
      }
    }
  }

  private preventBlurTransforms(): void {
    // Critical: Prevent any transforms that could cause blur
    const style = document.createElement('style');
    style.id = 'android-blur-prevention';
    style.textContent = `
      .android-blur-fix * {
        transform: none !important;
        will-change: auto !important;
        backface-visibility: visible !important;
        -webkit-backface-visibility: visible !important;
      }
      
      /* Specifically target common blur-causing elements */
      .android-blur-fix .card,
      .android-blur-fix .button,
      .android-blur-fix .dialog-content,
      .android-blur-fix [role="dialog"],
      .android-blur-fix [role="button"] {
        transform: none !important;
        will-change: auto !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('🚫 Applied blur prevention transforms');
  }

  private addDeviceSpecificCSS(): void {
    const { manufacturer, isWebView } = this.deviceInfo;
    
    // Remove existing device-specific styles
    const existingStyle = document.getElementById('device-specific-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'device-specific-css';
    let css = '';

    if (manufacturer === 'samsung') {
      css += `
        .samsung-blur-fix {
          image-rendering: crisp-edges !important;
          -webkit-optimize-contrast: optimizeSpeed !important;
          text-rendering: auto !important;
        }
      `;
      console.log('📱 Applied Samsung-specific blur fixes');
    }

    if (isWebView) {
      css += `
        .webview-blur-fix {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
        }
        
        .webview-blur-fix input, 
        .webview-blur-fix textarea, 
        .webview-blur-fix [contenteditable] {
          -webkit-user-select: text !important;
          user-select: text !important;
          font-size: 16px !important;
        }
      `;
      console.log('🌐 Applied WebView-specific blur fixes');
    }

    style.textContent = css;
    document.head.appendChild(style);
  }

  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getRenderingStrategy(): RenderingStrategy {
    return this.renderingStrategy;
  }

  public recalibrate(): void {
    console.log('🔄 Recalibrating Android blur fixes...');
    
    // Remove existing optimizations
    const stylesToRemove = ['android-font-optimization', 'device-specific-css', 'android-blur-prevention'];
    stylesToRemove.forEach(id => {
      const style = document.getElementById(id);
      if (style) style.remove();
    });
    
    // Reapply optimizations
    this.deviceInfo = this.detectDevice();
    this.renderingStrategy = this.determineRenderingStrategy();
    this.logDeviceInfo();
    this.init();
    
    console.log('✅ Android blur fix recalibration complete');
  }
}

export const androidOptimizations = new AndroidOptimizations();
