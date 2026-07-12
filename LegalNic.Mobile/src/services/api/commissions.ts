import { apiClient } from "./client";
import type { LawyerCommissionAccountResponse } from "./contracts";

export async function getMyCommissions(): Promise<LawyerCommissionAccountResponse> {
  const response = await apiClient.get<LawyerCommissionAccountResponse>("/api/lawyers/me/commissions");

  return response.data;
}
