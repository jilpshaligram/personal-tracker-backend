export function successResponse(
  message: string,
  data: Record<string, unknown> | unknown[] = {},
) {
  return { success: true, message, data };
}

export function errorResponse(message: string, errors: unknown[] = []) {
  return { success: false, message, errors };
}

export const apiResponse = {
  success: (message: string, data?: any) => ({
    success: true,
    message,
    ...(data !== undefined && { data }),
  }),
  error: (message: string, errors: unknown[] = []) => ({
    success: false,
    message,
    errors,
  }),
};
