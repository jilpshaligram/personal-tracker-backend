/**
 * Entity information extracted from URL
 */
export interface EntityInfo {
  entityType: string | null;
  entityId: string | null;
}

/**
 * Extract entity information from request URL
 *
 * URL pattern: /api/v1/{module}/{uuid}
 *
 * @param url - Request URL
 * @returns Entity information with type and ID
 */
export function extractEntityInfo(url: string): EntityInfo {
  // UUID regex pattern
  const uuidRegex =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  // Match pattern: /api/v1/{module}/{id}
  const match = url.match(/\/api\/v\d+\/([^/]+)\/([^/?]+)/);

  if (match) {
    const module = match[1];
    const possibleId = match[2];

    // Check if the second segment looks like a UUID
    if (uuidRegex.test(possibleId)) {
      const entityType = mapModuleToEntityType(module);
      return {
        entityType,
        entityId: possibleId,
      };
    }
  }

  return { entityType: null, entityId: null };
}

/**
 * Map module name to entity type
 * @param module - Module identifier from URL
 * @returns Entity type or null if not mappable
 */
function mapModuleToEntityType(module: string): string | null {
  const entityTypeMap: Record<string, string> = {
    bills: 'Bill',
    transactions: 'Transaction',
    users: 'User',
    budgets: 'Budget',
    documents: 'Document',
    notifications: 'Notification',
    'saving-goals': 'SavingGoal',
    wallets: 'Wallet',
    categories: 'Category',
    otp: 'Otp',
    'user-session': 'UserSession',
    'income-category': 'IncomeCategory',
    'expense-category': 'ExpenseCategory',
    'document-category': 'DocumentCategory',
    'saving-transactions': 'SavingTransaction',
    'bill-history': 'BillHistory',
    'audit-logs': 'AuditLog',
  };

  return entityTypeMap[module] || null;
}
