/**
 * Utility functions for YouTube video handling
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - VIDEO_ID (direct video ID)
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  
  // Remove whitespace
  const cleanInput = input.trim();
  
  // If it's already just a video ID (11 characters, alphanumeric and underscore/dash)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) {
    return cleanInput;
  }
  
  // Try to extract from various YouTube URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = cleanInput.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate if a string is a valid YouTube video ID or URL
 */
export function isValidYouTubeInput(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}