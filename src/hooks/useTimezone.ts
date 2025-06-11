
import { useState, useEffect } from 'react';

export const useTimezone = () => {
  const [detectedTimezone, setDetectedTimezone] = useState<string>('UTC');

  useEffect(() => {
    // Detect user's timezone using browser API
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(timezone);
    } catch (error) {
      console.warn('Could not detect timezone, defaulting to UTC:', error);
      setDetectedTimezone('UTC');
    }
  }, []);

  const formatTimeInTimezone = (date: Date, timezone: string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch (error) {
      console.warn('Error formatting time for timezone:', timezone, error);
      return date.toLocaleTimeString();
    }
  };

  const formatDateInTimezone = (date: Date, timezone: string): string => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    } catch (error) {
      console.warn('Error formatting date for timezone:', timezone, error);
      return date.toLocaleDateString();
    }
  };

  const getCurrentTimeInTimezone = (timezone: string): Date => {
    try {
      // Get current time in the specified timezone
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      return new Date(utc);
    } catch (error) {
      console.warn('Error getting current time for timezone:', timezone, error);
      return new Date();
    }
  };

  return {
    detectedTimezone,
    formatTimeInTimezone,
    formatDateInTimezone,
    getCurrentTimeInTimezone,
  };
};
