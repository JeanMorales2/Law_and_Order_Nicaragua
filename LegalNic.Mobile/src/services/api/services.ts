import { publicClient } from "./client";
import { apiClient } from "./client";
import type {
  OwnedServiceResponse,
  PagedResponse,
  SearchServiceResponse,
  SearchServicesRequest,
  UpsertServiceRequest,
} from "./contracts";

const SEARCH_PAGE_SIZE = 10;

export async function searchServices({
  page = 1,
  pageSize = SEARCH_PAGE_SIZE,
  query,
  categoryId,
  sortBy,
}: SearchServicesRequest): Promise<PagedResponse<SearchServiceResponse>> {
  const response = await publicClient.get<PagedResponse<SearchServiceResponse>>("/api/services/search", {
    params: {
      page,
      pageSize,
      query: query?.trim() || undefined,
      categoryId,
      sortBy: sortBy === "relevance" ? undefined : sortBy,
    },
  });

  return response.data;
}

export { SEARCH_PAGE_SIZE };

export async function getMyServices(): Promise<OwnedServiceResponse[]> {
  const response = await apiClient.get<OwnedServiceResponse[]>("/api/services/mine");

  return response.data;
}

export async function createMyService(request: UpsertServiceRequest): Promise<OwnedServiceResponse> {
  const response = await apiClient.post<OwnedServiceResponse>("/api/services", request);

  return response.data;
}

export async function updateMyService(
  serviceId: number,
  request: UpsertServiceRequest,
): Promise<OwnedServiceResponse> {
  const response = await apiClient.put<OwnedServiceResponse>(`/api/services/${serviceId}`, {
    ...request,
    isActive: request.isActive ?? true,
  });

  return response.data;
}

export async function deleteMyService(serviceId: number): Promise<void> {
  await apiClient.delete(`/api/services/${serviceId}`);
}
