export function successResponse<T>(message: string, data: T | null = null) {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message: string, errors: unknown[] = []) {
  return {
    success: false,
    message,
    data: null,
    errors,
  };
}

export const apiResponse = {
  success: <T = unknown>(message: string, data?: T, pagination?: unknown) => ({
    success: true,
    message,
    ...(data !== undefined && { data }),

    ...(pagination !== undefined && { pagination }),
  }),
  error: (message: string, errors: unknown[] = []) => ({
    success: false,
    message,
    errors,
  }),
};
