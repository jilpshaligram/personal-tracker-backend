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
