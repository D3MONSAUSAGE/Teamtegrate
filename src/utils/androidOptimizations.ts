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
    if (this.deviceInfo.isAndroid) {
      console.log('🤖 Android Device Detected:', {
        manufacturer: this.deviceInfo.manufacturer,
        androidVersion: this.deviceInfo.androidVersion,
        chromeVersion: this.deviceInfo.chromeVersion,
        devicePixelRatio: this.deviceInfo.devicePixelRatio,
        isWebView: this.deviceInfo.isWebView,
        userAgent: navigator.userAgent
      });
      
      console.log('🎨 Rendering Strategy Applied:', this.renderingStrategy);
    } else {
      console.log('📱 Non-Android device detected, using standard optimizations');
    }
  }

  private determineRenderingStrategy(): RenderingStrategy {
    const { isAndroid, isWebView, devicePixelRatio, manufacturer, chromeVersion, androidVersion } = this.deviceInfo;

    // Default strategy for non-Android devices
    if (!isAndroid) {
      return {
        useHardwareAcceleration: true,
        fontRenderingMethod: 'antialiased',
        transformOptimization: 'translate3d',
        cssContainment: true
      };
    }

    // Conservative Android strategy to prevent blurriness
    let strategy: RenderingStrategy = {
      useHardwareAcceleration: false, // Disable by default to prevent blur
      fontRenderingMethod: 'subpixel', // Use subpixel for clearer text
      transformOptimization: 'none', // Avoid transforms that cause blur
      cssContainment: false // Disable containment that might cause issues
    };

    // Device-specific adjustments
    if (manufacturer === 'samsung') {
      strategy.fontRenderingMethod = 'auto';
      console.log('🔧 Samsung-specific optimizations applied');
    }

    if (isWebView) {
      strategy.fontRenderingMethod = 'antialiased';
      console.log('🔧 WebView-specific optimizations applied');
    }

    // Handle problematic DPR
    if (devicePixelRatio > 3 || devicePixelRatio < 1) {
      strategy.fontRenderingMethod = 'auto';
      console.log('🔧 Non-standard DPR detected, using auto font rendering');
    }

    // Old Chrome versions need special handling
    if (chromeVersion < 80) {
      strategy.fontRenderingMethod = 'auto';
      console.log('🔧 Old Chrome version detected, using conservative settings');
    }

    console.log('📋 Final rendering strategy:', strategy);
    return strategy;
  }

  private init(): void {
    this.applyViewportFix();
    this.applyFontOptimizations();
    this.applyDeviceClasses();
    this.addDeviceSpecificCSS();
    console.log('✅ Android optimizations initialized successfully');
  }

  private applyViewportFix(): void {
    const { devicePixelRatio } = this.deviceInfo;
    
    // Only adjust viewport for extreme DPR values
    if (devicePixelRatio > 3 || devicePixelRatio < 0.5) {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        const scale = Math.min(Math.max(1 / devicePixelRatio, 0.5), 1);
        metaViewport.setAttribute('content', 
          `width=device-width, initial-scale=${scale}, maximum-scale=1.0, viewport-fit=cover, user-scalable=no`
        );
        console.log('🔧 Viewport adjusted for DPR:', devicePixelRatio, 'scale:', scale);
      }
    }
  }

  private applyFontOptimizations(): void {
    const { fontRenderingMethod } = this.renderingStrategy;
    
    const style = document.createElement('style');
    style.id = 'android-font-optimization';
    
    let fontCSS = '';
    if (fontRenderingMethod === 'subpixel') {
      fontCSS = `
        body, * {
          -webkit-font-smoothing: subpixel-antialiased !important;
          -moz-osx-font-smoothing: auto !important;
          text-rendering: auto !important;
          font-smooth: auto !important;
        }
      `;
    } else if (fontRenderingMethod === 'antialiased') {
      fontCSS = `
        body, * {
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          text-rendering: optimizeLegibility !important;
          font-smooth: always !important;
        }
      `;
    }
    
    style.textContent = fontCSS;
    document.head.appendChild(style);
    console.log('🔤 Font rendering applied:', fontRenderingMethod);
  }

  private applyDeviceClasses(): void {
    const { isAndroid, isWebView, manufacturer } = this.deviceInfo;
    
    if (isAndroid) {
      document.body.classList.add('android-optimized');
      console.log('🤖 Android optimization class applied');
      
      if (isWebView) {
        document.body.classList.add('webview-optimized');
        console.log('🌐 WebView optimization class applied');
      }
      
      if (manufacturer && manufacturer !== 'unknown') {
        document.body.classList.add(`${manufacturer}-optimized`);
        console.log(`📱 ${manufacturer} optimization class applied`);
      }
    }
  }

  private applyHardwareAcceleration(): void {
    // Intentionally minimal - only apply when absolutely necessary
    const { useHardwareAcceleration } = this.renderingStrategy;
    
    if (!useHardwareAcceleration) {
      // Ensure no hardware acceleration
      document.body.style.setProperty('transform', 'none', 'important');
      document.body.style.setProperty('will-change', 'auto', 'important');
      console.log('🚫 Hardware acceleration disabled for blur prevention');
    }
  }

  private applyCSSContainment(): void {
    // Skip CSS containment for Android to prevent rendering issues
    if (this.deviceInfo.isAndroid) {
      console.log('⏭️ CSS containment skipped for Android compatibility');
      return;
    }
    
    if (!this.renderingStrategy.cssContainment) return;

    const style = document.createElement('style');
    style.textContent = `
      .android-containment {
        contain: layout style paint;
      }
    `;
    document.head.appendChild(style);
  }

  private addDeviceSpecificCSS(): void {
    const { manufacturer, isWebView } = this.deviceInfo;
    
    const style = document.createElement('style');
    style.id = 'device-specific-css';
    let css = '';

    if (manufacturer === 'samsung') {
      css += `
        .samsung-optimized {
          image-rendering: crisp-edges !important;
          -webkit-optimize-contrast: optimizeSpeed !important;
        }
      `;
    }

    if (isWebView) {
      css += `
        .webview-optimized {
          -webkit-tap-highlight-color: transparent !important;
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
        }
        
        .webview-optimized input, 
        .webview-optimized textarea, 
        .webview-optimized [contenteditable] {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
      `;
    }

    style.textContent = css;
    document.head.appendChild(style);
    console.log('🎨 Device-specific CSS applied');
  }

  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getRenderingStrategy(): RenderingStrategy {
    return this.renderingStrategy;
  }

  public recalibrate(): void {
    console.log('🔄 Recalibrating Android optimizations...');
    this.deviceInfo = this.detectDevice();
    this.renderingStrategy = this.determineRenderingStrategy();
    this.logDeviceInfo();
    this.init();
  }
}

export const androidOptimizations = new AndroidOptimizations();
