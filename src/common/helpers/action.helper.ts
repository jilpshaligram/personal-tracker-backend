import { ActionType } from '../../modules/audit-logs/enums/action-type.enum';

/**
 * Determine action type from HTTP method and URL
 *
 * @param method - HTTP method (GET, POST, PATCH, PUT, DELETE)
 * @param url - Request URL
 * @returns Action type
 */
export function determineActionType(method: string, url: string): ActionType {
  const lowerUrl = url.toLowerCase();

  // Check for special URL patterns first
  if (lowerUrl.includes('/auth/login')) {
    return ActionType.LOGIN;
  }

  if (lowerUrl.includes('/auth/logout')) {
    return ActionType.LOGOUT;
  }

  if (
    lowerUrl.includes('/auth/register') ||
    lowerUrl.includes('/auth/signup')
  ) {
    return ActionType.REGISTER;
  }

  if (
    lowerUrl.includes('/forgot-password') ||
    lowerUrl.includes('/reset-password')
  ) {
    return ActionType.PASSWORD_RESET;
  }

  if (lowerUrl.includes('/download')) {
    return ActionType.DOWNLOAD;
  }

  if (lowerUrl.includes('/export')) {
    return ActionType.EXPORT;
  }

  if (lowerUrl.includes('/payment') || lowerUrl.includes('/pay')) {
    return ActionType.PAYMENT;
  }

  if (lowerUrl.includes('/contribution')) {
    return ActionType.CONTRIBUTION;
  }

  if (lowerUrl.includes('/mark-read') || lowerUrl.includes('/mark-as-read')) {
    return ActionType.MARK_READ;
  }

  // Map HTTP methods to action types
  switch (method.toUpperCase()) {
    case 'POST':
      return ActionType.CREATE;

    case 'PATCH':
    case 'PUT':
      return ActionType.UPDATE;

    case 'DELETE':
      return ActionType.DELETE;

    case 'GET':
      return ActionType.VIEW;

    default:
      // Default to VIEW for other methods
      return ActionType.VIEW;
  }
}
