import { apiClient } from "./client";
import type {
  ChatMessageResponse,
  CompleteServiceRequestRequest,
  CreateReviewRequest,
  CreateServiceRequestRequest,
  ReviewResponse,
  ServiceRequestDetailResponse,
  ServiceRequestStatus,
  ServiceRequestSummaryResponse,
} from "./contracts";

export async function createServiceRequest(
  request: CreateServiceRequestRequest,
): Promise<ServiceRequestDetailResponse> {
  const response = await apiClient.post<ServiceRequestDetailResponse>("/api/requests", request);

  return response.data;
}

export async function getMyServiceRequests(): Promise<ServiceRequestSummaryResponse[]> {
  const response = await apiClient.get<ServiceRequestSummaryResponse[]>("/api/requests/mine");

  return response.data;
}

export async function getReceivedServiceRequests(status?: ServiceRequestStatus): Promise<ServiceRequestSummaryResponse[]> {
  const response = await apiClient.get<ServiceRequestSummaryResponse[]>("/api/requests/received", {
    params: {
      status,
    },
  });

  return response.data;
}

export async function getServiceRequestDetail(requestId: number): Promise<ServiceRequestDetailResponse> {
  const response = await apiClient.get<ServiceRequestDetailResponse>(`/api/requests/${requestId}`);

  return response.data;
}

export async function createRequestReview(
  requestId: number,
  request: CreateReviewRequest,
): Promise<ReviewResponse> {
  const response = await apiClient.post<ReviewResponse>(`/api/requests/${requestId}/review`, request);

  return response.data;
}

export async function getRequestMessages(requestId: number): Promise<ChatMessageResponse[]> {
  const response = await apiClient.get<ChatMessageResponse[]>(`/api/requests/${requestId}/messages`);

  return response.data;
}

export async function markRequestMessagesAsRead(requestId: number): Promise<void> {
  await apiClient.put(`/api/requests/${requestId}/messages/read`);
}

export async function acceptServiceRequest(requestId: number): Promise<ServiceRequestDetailResponse> {
  const response = await apiClient.put<ServiceRequestDetailResponse>(`/api/requests/${requestId}/accept`);

  return response.data;
}

export async function rejectServiceRequest(requestId: number): Promise<ServiceRequestDetailResponse> {
  const response = await apiClient.put<ServiceRequestDetailResponse>(`/api/requests/${requestId}/reject`);

  return response.data;
}

export async function completeServiceRequest(
  requestId: number,
  request: CompleteServiceRequestRequest,
): Promise<ServiceRequestDetailResponse> {
  const response = await apiClient.put<ServiceRequestDetailResponse>(`/api/requests/${requestId}/complete`, request);

  return response.data;
}
