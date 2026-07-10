import axios from "axios";

type BackendErrorPayload = {
  error?: string;
  statusCode?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError<BackendErrorPayload>(error)) {
    const message =
      error.response?.data?.error ??
      error.message ??
      "No fue posible completar la solicitud.";

    return new ApiError(message, error.response?.status);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError("Ocurrio un error inesperado.");
}
