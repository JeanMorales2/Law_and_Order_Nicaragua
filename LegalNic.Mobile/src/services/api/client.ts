import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthResponse } from "./contracts";
import { clearStoredTokens, getStoredTokens, saveTokens } from "./tokenStorage";
import { getAccessToken, notifyUnauthorized, setAccessToken } from "./session";
import { ApiError, toApiError } from "./errors";

const DEFAULT_API_URL = "http://localhost:5102";

declare module "axios" {
  export interface AxiosRequestConfig<D = any> {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }

  export interface InternalAxiosRequestConfig<D = any> {
    skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
}

export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
};

export const publicClient = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<AuthResponse> | null = null;

apiClient.interceptors.request.use((config) => attachAccessToken(config));
publicClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error)),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(toApiError(error));
    }

    const status = error.response?.status;
    const shouldRefresh =
      status === 401 &&
      !originalRequest.skipAuthRefresh &&
      !originalRequest._retry;

    if (!shouldRefresh) {
      return Promise.reject(toApiError(error));
    }

    originalRequest._retry = true;

    try {
      const tokens = await runRefreshFlow();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearStoredTokens();
      setAccessToken(null);
      await notifyUnauthorized();

      return Promise.reject(toApiError(refreshError));
    }
  },
);

async function attachAccessToken(config: InternalAxiosRequestConfig) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${accessToken}`;

  return config;
}

async function runRefreshFlow(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens();
  }

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function refreshTokens(): Promise<AuthResponse> {
  const storedTokens = await getStoredTokens();

  if (!storedTokens?.refreshToken) {
    throw new ApiError("No hay refresh token disponible.", 401);
  }

  const response: AxiosResponse<AuthResponse> = await publicClient.post(
    "/api/auth/refresh-token",
    {
      refreshToken: storedTokens.refreshToken,
    },
    {
      skipAuthRefresh: true,
    } as AxiosRequestConfig,
  );

  await saveTokens(response.data);
  setAccessToken(response.data.accessToken);

  return response.data;
}
