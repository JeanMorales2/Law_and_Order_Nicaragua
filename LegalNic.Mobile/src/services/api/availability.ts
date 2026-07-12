import { apiClient } from "./client";
import type { AvailabilityDay } from "./contracts";

export async function getMyAvailability(): Promise<AvailabilityDay[]> {
  const response = await apiClient.get<AvailabilityDay[]>("/api/lawyers/me/availability");

  return response.data;
}

export async function replaceMyAvailability(request: AvailabilityDay[]): Promise<AvailabilityDay[]> {
  const response = await apiClient.put<AvailabilityDay[]>("/api/lawyers/me/availability", request);

  return response.data;
}
