import { useUserTimezone } from '@/hooks/useUserTimezone';

/**
 * Get user timezone with browser fallback
 * Returns user's saved timezone preference, otherwise falls back to browser detected timezone
 */
export function useTZ(): string {
  const { userTimezone, detectedTimezone, isLoading } = useUserTimezone();
  
  const resolved = userTimezone || detectedTimezone || 'UTC';
  
  // Debug logging to track timezone resolution
  console.log('🕐 useTZ - timezone resolution:', {
    userTimezone,
    detectedTimezone,  
    isLoading,
    resolved,
    fallbackUsed: !userTimezone ? (detectedTimezone ? 'detected' : 'UTC') : 'none'
  });
  
  return resolved;
}