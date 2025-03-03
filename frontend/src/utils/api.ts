import axios from "axios";

const baseUrl = process.env.PRODUCTION_BACKEND_BASE_URL;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export default api;
