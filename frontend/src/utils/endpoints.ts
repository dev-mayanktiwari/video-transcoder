const env = process.env.NEXT_PUBLIC_ENV;
const baseUrl =
  env === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_BACKEND_BASE_URL
    : process.env.NEXT_PUBLIC_PRODUCTION_BACKEND_BASE_URL;

export const ENDPOINTS = {
  GET_PRESIGNED_URL: `${baseUrl}/upload/getPresignedUrl`,
  GET_PLAYBACK_URL: `${baseUrl}/upload/video-link`,
} as const;
