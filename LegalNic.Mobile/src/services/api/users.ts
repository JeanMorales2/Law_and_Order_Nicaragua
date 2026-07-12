import { apiClient } from "./client";
import type { CurrentUserResponse, UpdateCurrentUserRequest } from "./contracts";

export async function getCurrentUser() {
  const response = await apiClient.get<CurrentUserResponse>("/api/users/me");
  return response.data;
}

export async function updateCurrentUser(request: UpdateCurrentUserRequest) {
  const response = await apiClient.put<CurrentUserResponse>("/api/users/me", request);
  return response.data;
}
