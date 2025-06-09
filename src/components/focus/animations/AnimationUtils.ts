
// Animation constants and utilities for enhanced focus animations
export const ANIMATION_TIMINGS = {
  fast: '0.2s',
  normal: '0.3s',
  slow: '0.5s',
  extraSlow: '1s',
  breathe: '2s',
  float: '3s',
  drift: '4s'
} as const;

export const EASING_CURVES = {
  elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  natural: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  organic: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
} as const;

export const MILESTONE_PERCENTAGES = [25, 50, 75, 100] as const;

export const getStaggerDelay = (index: number, baseDelay: number = 0.1): string => {
  return `${baseDelay * index}s`;
};

export const getRandomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const getRandomPosition = () => ({
  x: getRandomFloat(10, 90),
  y: getRandomFloat(10, 90)
});

export const createPulseAnimation = (duration: string, delay: string = '0s') => ({
  animation: `pulse ${duration} ${EASING_CURVES.smooth} ${delay} infinite alternate`
});

export const createFloatAnimation = (duration: string, delay: string = '0s') => ({
  animation: `float ${duration} ${EASING_CURVES.natural} ${delay} infinite alternate`
});

export const createGlowEffect = (color: string, intensity: number = 1) => ({
  boxShadow: `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}`,
  filter: `brightness(${1 + intensity * 0.2})`
});

// Performance optimization utilities
export const shouldReduceMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const getAnimationClass = (baseClass: string, isActive: boolean, reducedMotion: boolean = false) => {
  if (reducedMotion) return baseClass;
  return `${baseClass} ${isActive ? 'animate-enhanced' : ''}`;
};
