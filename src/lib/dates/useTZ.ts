import { useUserTimezone } from '@/hooks/useUserTimezone';

/**
 * Get user timezone with browser fallback
 * Returns user's saved timezone preference, otherwise falls back to browser detected timezone
 */
export function useTZ(): string {
  const { userTimezone, detectedTimezone, isLoading } = useUserTimezone();
  
  // Debug logging to track timezone resolution
  console.log('useTZ - timezone resolution:', {
    userTimezone,
    detectedTimezone,
    isLoading,
    resolved: userTimezone || detectedTimezone || 'UTC'
  });
  
  // Use user preference first, then detected timezone, finally UTC as last resort
  return userTimezone || detectedTimezone || 'UTC';
}