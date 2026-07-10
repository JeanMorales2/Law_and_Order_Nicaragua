import { apiClient } from "./client";
import type { CurrentUserResponse } from "./contracts";

export async function getCurrentUser() {
  const response = await apiClient.get<CurrentUserResponse>("/api/users/me");
  return response.data;
}
