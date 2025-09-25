/**
 * URL utility functions for building application links
 */

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://teamtegrate.com'; // fallback for server-side
};

export const getTaskUrl = (taskId: string): string => {
  return `${getBaseUrl()}/dashboard/tasks?task=${taskId}`;
};

export const getNotificationSettingsUrl = (): string => {
  return `${getBaseUrl()}/settings/notifications`;
};