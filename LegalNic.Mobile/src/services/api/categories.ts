import { publicClient } from "./client";
import type { CategoryResponse } from "./contracts";

export async function getCategories(): Promise<CategoryResponse[]> {
  const response = await publicClient.get<CategoryResponse[]>("/api/categories");

  return response.data;
}
