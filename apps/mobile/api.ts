// apps/mobile/api.ts
import axios, { isAxiosError, isCancel } from 'axios';
import { BASE_URL } from './constants';

const api = axios.create({
  baseURL: BASE_URL,
});

// Interceptor for request cancellation
api.interceptors.request.use((config) => {
  const controller = new AbortController();
  config.signal = controller.signal; // Attach AbortController signal
  return config;
});

// Interceptor for response handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isCancel(error)) {
      console.log('요청이 취소되었습니다.');
    }
    return Promise.reject(error);
  },
);

export const isError = isAxiosError;

export default api;
