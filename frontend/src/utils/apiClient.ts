import axios from "axios";
import { ENDPOINTS } from "./endpoints";

export async function getPresignedUrl() {
  const response = await axios.get(ENDPOINTS.GET_PRESIGNED_URL);
  return response.data;
}

export async function getPlaybackUrl(videoId: string) {
  const response = await axios.get(`${ENDPOINTS.GET_PLAYBACK_URL}/${videoId}`);
  return response.data;
}

export async function uploadToPresignedUrl(url: string, file: File) {
  const response = await axios.put(url, file);
  return response.data;
}
