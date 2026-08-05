export function successResponse(
  message: string,
  data: Record<string, unknown> = {},
) {
  return { success: true, message, data };
}

export function errorResponse(message: string, errors: unknown[] = []) {
  return { success: false, message, errors };
}
