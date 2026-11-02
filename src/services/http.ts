import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '@/lib/config';
import { tokenStore } from '@/services/token-store';
import type { AuthResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const http = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (handler: (() => void) | null) => {
  onSessionExpired = handler;
};

let refreshing: Promise<string> | null = null;

async function refreshAccessToken() {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) throw new Error('missing refresh token');
  const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken }, { timeout: 15000 });
  await tokenStore.save(data.token, data.refreshToken);
  return data.token;
}

http.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthCall = AUTH_PATHS.some((path) => config?.url?.includes(path));

    if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const token = await refreshing;
        config.headers.Authorization = `Bearer ${token}`;
        return http(config);
      } catch {
        await tokenStore.clear();
        onSessionExpired?.();
      }
    }

    throw toApiError(error);
  },
);
