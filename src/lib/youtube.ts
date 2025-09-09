/**
 * Utility functions for video handling across multiple platforms
 */

export type VideoSource = 'youtube' | 'google_drive' | 'direct_link';

export interface VideoInfo {
  id: string;
  source: VideoSource;
  embedUrl: string;
  originalUrl: string;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - VIDEO_ID (direct video ID)
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  
  console.log('Extracting YouTube video ID from:', input);
  
  // Remove whitespace
  const cleanInput = input.trim();
  
  // If it's already just a video ID (11 characters, alphanumeric and underscore/dash)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanInput)) {
    console.log('Direct video ID detected:', cleanInput);
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
      console.log('Video ID extracted:', match[1]);
      return match[1];
    }
  }
  
  console.log('No video ID found for input:', input);
  return null;
}

/**
 * Extract Google Drive video ID from various URL formats
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - FILE_ID (direct file ID)
 */
export function extractGoogleDriveVideoId(input: string): string | null {
  if (!input) return null;
  
  const cleanInput = input.trim();
  
  // If it's already just a file ID (alphanumeric, underscore, dash, and some special chars)
  if (/^[a-zA-Z0-9_-]{25,}$/.test(cleanInput)) {
    return cleanInput;
  }
  
  // Try to extract from various Google Drive URL formats
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{25,})\/view/,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{25,})/,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{25,})/
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
 * Detect video source from input URL or ID
 */
export function detectVideoSource(input: string): VideoSource | null {
  if (!input) return null;
  
  const cleanInput = input.trim();
  
  // Check for YouTube patterns
  if (extractYouTubeVideoId(cleanInput)) {
    return 'youtube';
  }
  
  // Check for Google Drive patterns
  if (extractGoogleDriveVideoId(cleanInput)) {
    return 'google_drive';
  }
  
  // Check for direct video links
  if (cleanInput.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) || 
      cleanInput.includes('blob:') || 
      cleanInput.startsWith('http')) {
    return 'direct_link';
  }
  
  return null;
}

/**
 * Generate embed URL for different video sources
 */
export function generateEmbedUrl(input: string, source: VideoSource): string | null {
  switch (source) {
    case 'youtube': {
      const videoId = extractYouTubeVideoId(input);
      return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0` : null;
    }
    
    case 'google_drive': {
      const fileId = extractGoogleDriveVideoId(input);
      return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
    }
    
    case 'direct_link': {
      return input.startsWith('http') ? input : null;
    }
    
    default:
      return null;
  }
}

/**
 * Parse video input and return complete video information
 */
export function parseVideoInput(input: string): VideoInfo | null {
  if (!input) return null;
  
  const source = detectVideoSource(input);
  if (!source) return null;
  
  let id: string | null = null;
  
  switch (source) {
    case 'youtube':
      id = extractYouTubeVideoId(input);
      break;
    case 'google_drive':
      id = extractGoogleDriveVideoId(input);
      break;
    case 'direct_link':
      id = input;
      break;
  }
  
  if (!id) return null;
  
  const embedUrl = generateEmbedUrl(input, source);
  if (!embedUrl) return null;
  
  return {
    id,
    source,
    embedUrl,
    originalUrl: input
  };
}

/**
 * Validate if a string is a valid YouTube video ID or URL
 */
export function isValidYouTubeInput(input: string): boolean {
  return extractYouTubeVideoId(input) !== null;
}

/**
 * Validate if input is a valid video URL/ID for any supported source
 */
export function isValidVideoInput(input: string): boolean {
  return detectVideoSource(input) !== null;
}