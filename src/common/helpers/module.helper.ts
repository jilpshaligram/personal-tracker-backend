/**
 * Extract module name from request URL
 *
 * URL pattern: /api/v1/{module}/...
 *
 * @param url - Request URL
 * @returns Module name or 'unknown' if pattern doesn't match
 */
export function extractModuleName(url: string): string {
  // Match pattern: /api/v1/{module}/...
  const match = url.match(/^\/api\/v\d+\/([^/]+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Map module names to display names
 */
const moduleDisplayMap: Record<string, string> = {
  auth: 'auth',
  users: 'users',
  bills: 'bills',
  transactions: 'transactions',
  budgets: 'budgets',
  documents: 'documents',
  notifications: 'notifications',
  'saving-goals': 'saving-goals',
  wallets: 'wallets',
  categories: 'categories',
  dashboard: 'dashboard',
  reports: 'reports',
  otp: 'otp',
  'user-session': 'user-session',
  'income-category': 'income-category',
  'expense-category': 'expense-category',
  'document-category': 'document-category',
  'saving-transactions': 'saving-transactions',
  'bill-history': 'bill-history',
  'audit-logs': 'audit-logs',
};

/**
 * Get display name for module
 * @param module - Module identifier from URL
 * @returns Display name for module
 */
export function getModuleDisplayName(module: string): string {
  return moduleDisplayMap[module] || module;
}
