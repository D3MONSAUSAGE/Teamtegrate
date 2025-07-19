// Cleanup utility to remove any lingering mobile optimization classes
export const cleanupAllOptimizations = () => {
  const classesToRemove = [
    'android-device', 'android-level-1', 'android-level-2', 'android-level-3', 
    'android-nuclear-reset', 'android-webview', 'samsung-device', 'xiaomi-device', 
    'high-dpi', 'android-debug', 'android-reset', 'android-touch-optimized',
    'mobile-optimized', 'keyboard-open', 'gpu-accelerated'
  ];
  
  classesToRemove.forEach(cls => {
    document.body.classList.remove(cls);
    document.documentElement.classList.remove(cls);
  });
  
  // Remove any lingering CSS custom properties that might cause issues
  document.documentElement.style.removeProperty('--vh');
  
  console.log('🧹 Cleaned all optimization classes and properties');
};

// Run cleanup immediately when imported
cleanupAllOptimizations();