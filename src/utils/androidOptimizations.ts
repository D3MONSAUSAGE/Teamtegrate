
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
    this.init();
  }

  private detectDevice(): DeviceInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isWebView = /wv/.test(userAgent) || window.navigator.standalone === false;
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

  private determineRenderingStrategy(): RenderingStrategy {
    const { isAndroid, isWebView, devicePixelRatio, manufacturer, chromeVersion, androidVersion } = this.deviceInfo;

    if (!isAndroid) {
      return {
        useHardwareAcceleration: true,
        fontRenderingMethod: 'antialiased',
        transformOptimization: 'translate3d',
        cssContainment: true
      };
    }

    // Android-specific optimizations
    let strategy: RenderingStrategy = {
      useHardwareAcceleration: true,
      fontRenderingMethod: 'antialiased',
      transformOptimization: 'translateZ',
      cssContainment: true
    };

    // Adjust for problematic devices/versions
    if (manufacturer === 'samsung' && androidVersion < 10) {
      strategy.useHardwareAcceleration = false;
      strategy.fontRenderingMethod = 'auto';
    }

    if (isWebView) {
      strategy.transformOptimization = 'none';
      strategy.fontRenderingMethod = 'subpixel';
    }

    // Handle non-standard DPR
    if (devicePixelRatio > 3 || devicePixelRatio < 1) {
      strategy.useHardwareAcceleration = false;
    }

    // Old Chrome versions
    if (chromeVersion < 80) {
      strategy.transformOptimization = 'none';
      strategy.cssContainment = false;
    }

    return strategy;
  }

  private init(): void {
    this.applyViewportFix();
    this.applyFontOptimizations();
    this.applyHardwareAcceleration();
    this.applyCSSContainment();
    this.addDeviceSpecificCSS();
  }

  private applyViewportFix(): void {
    const { devicePixelRatio } = this.deviceInfo;
    
    // Adjust viewport for non-standard DPR
    if (devicePixelRatio !== 1) {
      const metaViewport = document.querySelector('meta[name="viewport"]');
      if (metaViewport) {
        const scale = 1 / devicePixelRatio;
        metaViewport.setAttribute('content', 
          `width=device-width, initial-scale=${scale}, minimum-scale=${scale}, maximum-scale=${scale * 2}, viewport-fit=cover`
        );
      }
    }
  }

  private applyFontOptimizations(): void {
    const { fontRenderingMethod } = this.renderingStrategy;
    
    const style = document.createElement('style');
    style.textContent = `
      .android-font-fix {
        -webkit-font-smoothing: ${fontRenderingMethod === 'antialiased' ? 'antialiased' : 'subpixel-antialiased'};
        -moz-osx-font-smoothing: ${fontRenderingMethod === 'antialiased' ? 'grayscale' : 'auto'};
        text-rendering: ${fontRenderingMethod === 'auto' ? 'auto' : 'optimizeLegibility'};
        font-smooth: ${fontRenderingMethod === 'auto' ? 'auto' : 'always'};
        font-kerning: normal;
        font-feature-settings: "kern" 1;
      }
    `;
    document.head.appendChild(style);
    
    document.body.classList.add('android-font-fix');
  }

  private applyHardwareAcceleration(): void {
    const { useHardwareAcceleration, transformOptimization } = this.renderingStrategy;
    
    if (!useHardwareAcceleration) {
      document.body.style.setProperty('transform', 'none');
      return;
    }

    const transformValue = transformOptimization === 'translate3d' 
      ? 'translate3d(0, 0, 0)' 
      : transformOptimization === 'translateZ' 
        ? 'translateZ(0)' 
        : 'none';

    if (transformValue !== 'none') {
      document.body.style.setProperty('transform', transformValue);
      document.body.style.setProperty('will-change', 'transform');
      document.body.style.setProperty('backface-visibility', 'hidden');
    }
  }

  private applyCSSContainment(): void {
    if (!this.renderingStrategy.cssContainment) return;

    const style = document.createElement('style');
    style.textContent = `
      .android-containment {
        contain: layout style paint;
      }
      
      .android-layer-promotion {
        isolation: isolate;
      }
    `;
    document.head.appendChild(style);
  }

  private addDeviceSpecificCSS(): void {
    const { manufacturer, isWebView } = this.deviceInfo;
    
    const style = document.createElement('style');
    let css = '';

    if (manufacturer === 'samsung') {
      css += `
        .samsung-fix {
          image-rendering: crisp-edges;
          -webkit-optimize-contrast: optimizeSpeed;
        }
      `;
    }

    if (isWebView) {
      css += `
        .webview-fix {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        input, textarea, [contenteditable] {
          -webkit-user-select: text !important;
          user-select: text !important;
        }
      `;
    }

    style.textContent = css;
    document.head.appendChild(style);
    
    document.body.classList.add(`${manufacturer}-fix`, isWebView ? 'webview-fix' : '');
  }

  public getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  public getRenderingStrategy(): RenderingStrategy {
    return this.renderingStrategy;
  }

  public recalibrate(): void {
    this.deviceInfo = this.detectDevice();
    this.renderingStrategy = this.determineRenderingStrategy();
    this.init();
  }
}

export const androidOptimizations = new AndroidOptimizations();
