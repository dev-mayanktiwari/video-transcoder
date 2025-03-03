const baseUrl = process.env.NEXT_PUBLIC_LOCAL_BACKEND_BASE_URL;

export const ENDPOINTS = {
  GET_PRESIGNED_URL: `${baseUrl}/upload/getPresignedUrl`,
  GET_PLAYBACK_URL: `${baseUrl}/upload/video-link`,
} as const;
