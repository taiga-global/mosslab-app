// apps/mobile/api.ts
import axios, { isAxiosError } from 'axios';
import { BASE_URL } from './constants';

const api = axios.create({
  baseURL: BASE_URL,
});
export const isError = isAxiosError;

export default api;
