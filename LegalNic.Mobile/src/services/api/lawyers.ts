import { publicClient } from "./client";
import type { LawyerReviewsResponse, PublicLawyerProfileResponse } from "./contracts";

export async function getLawyerProfile(lawyerId: number): Promise<PublicLawyerProfileResponse> {
  const response = await publicClient.get<PublicLawyerProfileResponse>(`/api/lawyers/${lawyerId}`);

  return response.data;
}

export async function getLawyerReviews(
  lawyerId: number,
  page = 1,
  pageSize = 3,
): Promise<LawyerReviewsResponse> {
  const response = await publicClient.get<LawyerReviewsResponse>(`/api/lawyers/${lawyerId}/reviews`, {
    params: {
      page,
      pageSize,
    },
  });

  return response.data;
}
