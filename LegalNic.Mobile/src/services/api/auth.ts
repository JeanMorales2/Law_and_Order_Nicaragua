import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { publicClient } from "./client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "./contracts";

export async function login(request: LoginRequest) {
  const response: AxiosResponse<AuthResponse> = await publicClient.post(
    "/api/auth/login",
    request,
    { skipAuthRefresh: true } as AxiosRequestConfig,
  );

  return response.data;
}

export async function register(request: RegisterRequest) {
  await publicClient.post("/api/auth/register", request, {
    skipAuthRefresh: true,
  } as AxiosRequestConfig);
}
