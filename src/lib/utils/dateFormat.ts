/**
 * Date formatting utilities with timezone support
 */

export const formatDateInTimezone = (dateString: string, timezone: string = 'UTC'): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date(dateString).toLocaleDateString();
  }
};

export const getPriorityClass = (priority?: string): string => {
  if (!priority) return '';
  
  const lowercasePriority = priority.toLowerCase();
  switch (lowercasePriority) {
    case 'high':
      return 'pill--high';
    case 'medium':
      return 'pill--medium';
    case 'low':
      return 'pill--low';
    default:
      return '';
  }
};

export const getCurrentYear = (): string => {
  return new Date().getFullYear().toString();
};