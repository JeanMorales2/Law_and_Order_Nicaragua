import { apiClient } from "./client";
import type { CurrentUserResponse, RegisterDeviceTokenRequest, UpdateCurrentUserRequest } from "./contracts";

export async function getCurrentUser() {
  const response = await apiClient.get<CurrentUserResponse>("/api/users/me");
  return response.data;
}

export async function updateCurrentUser(request: UpdateCurrentUserRequest) {
  const response = await apiClient.put<CurrentUserResponse>("/api/users/me", request);
  return response.data;
}

export async function registerDeviceToken(request: RegisterDeviceTokenRequest) {
  await apiClient.post("/api/users/me/device-token", request);
}
