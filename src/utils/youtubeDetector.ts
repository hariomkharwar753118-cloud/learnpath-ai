// Utility functions for detecting and handling YouTube URLs

export interface YouTubeUrlInfo {
  isYouTubeUrl: boolean;
  videoId: string | null;
  url: string | null;
}

/**
 * Detects if a string contains a YouTube URL
 * Supports formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - youtube.com/watch?v=VIDEO_ID
 */
export function detectYouTubeUrl(text: string): YouTubeUrlInfo {
  const result: YouTubeUrlInfo = {
    isYouTubeUrl: false,
    videoId: null,
    url: null,
  };

  // YouTube URL patterns
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      result.isYouTubeUrl = true;
      result.videoId = match[1];
      result.url = match[0];
      
      // Ensure URL is properly formatted
      if (!result.url.startsWith('http')) {
        result.url = 'https://' + result.url;
      }
      
      break;
    }
  }

  return result;
}

/**
 * Extracts video ID from a YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com')) {
      return urlObj.searchParams.get('v');
    }
    
    // Handle youtu.be/VIDEO_ID
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Validates if a string is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const { isYouTubeUrl, videoId } = detectYouTubeUrl(url);
  return isYouTubeUrl && videoId !== null && videoId.length === 11;
}

/**
 * Builds a YouTube embed URL from a video ID
 */
export function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Builds a YouTube thumbnail URL from a video ID
 */
export function buildYouTubeThumbnailUrl(videoId: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'hq'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}
