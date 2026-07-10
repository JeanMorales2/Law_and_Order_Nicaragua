const DEFAULT_API_URL = "http://localhost:5102";

export const apiConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
};

type RequestOptions = RequestInit & {
  path: string;
};

export async function apiRequest<T>({ path, headers, ...init }: RequestOptions): Promise<T> {
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "API request failed.");
  }

  return (await response.json()) as T;
}
