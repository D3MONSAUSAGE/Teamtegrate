/**
 * Simple window formatter for use in edge functions where imports are tricky
 */
export function formatWindow(startTime?: string, endTime?: string, timezone: string = 'UTC'): string {
  if (!startTime || !endTime) return 'Today';
  
  const formatTime = (time: string) => {
    try {
      // Extract HH:mm from ISO string or use as-is
      const timeStr = time.includes('T') ? time.split('T')[1]?.substring(0, 5) : time;
      if (!timeStr) return '';
      
      const [hour, minute] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hour, minute);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return time;
    }
  };
  
  return `${formatTime(startTime)}–${formatTime(endTime)}`;
}