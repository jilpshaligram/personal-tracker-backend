import { TransactionType } from '../enums/transaction-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * @interface ITransactionFilter
 *
 * @description
 * Defines all possible filter and pagination parameters for the
 * list transactions endpoint: GET /transactions
 *
 * WHY THIS EXISTS:
 * Without a typed filter interface, the Service and Repository layers
 * would receive a loosely-typed object (or worse, `any`) from the Controller.
 * This interface creates a strict contract:
 *   Controller (parses query params) → ITransactionFilter → Service → Repository
 *
 * Every field is optional — the endpoint works with zero filters (returns
 * all user transactions) and with any combination of filters applied.
 *
 * ARCHITECTURE ROLE:
 * The Controller validates query params into the FilterTransactionDto (Step 5).
 * The DTO is then mapped to this interface before passing to the Service.
 * This separation means DTOs can change (add validation decorators, rename
 * fields) without touching the Service or Repository.
 *
 * POSTGRESQL QUERY IMPACT:
 * Each field that is defined (not undefined) adds a WHERE condition to the query.
 * The Repository builds a dynamic Sequelize `where` clause from this object.
 *
 * Example query built from:
 *   { type: 'EXPENSE', dateFrom: '2024-01-01', dateTo: '2024-01-31', page: 1, limit: 20 }
 *
 * Becomes:
 *   SELECT t.*, c.name, c.type, c.icon, c.color
 *   FROM transactions t
 *   JOIN categories c ON t.category_id = c.id
 *   WHERE t.user_id = $1
 *     AND c.type = 'EXPENSE'
 *     AND t.transaction_date >= '2024-01-01'
 *     AND t.transaction_date <= '2024-01-31'
 *     AND t.deleted_at IS NULL
 *   ORDER BY t.transaction_date DESC
 *   LIMIT 20 OFFSET 0;
 *
 * SCALABILITY:
 * Every filter field that maps to an indexed column (user_id, transaction_date,
 * category_id) benefits from PostgreSQL index lookups.
 * The compound index on (user_id, transaction_date) makes date-range filters
 * extremely fast even with millions of rows.
 *
 * SECURITY:
 * `userId` is NOT a client-supplied filter — it is injected by the Service
 * layer from the authenticated JWT token. Clients cannot filter another
 * user's transactions by providing a different userId.
 * It is included here as an interface field because the Repository receives
 * it as part of the filter object (already validated by the Service).
 */
export interface ITransactionFilter {
  /**
   * The authenticated user's ID.
   * ALWAYS set by the Service layer from JWT — never from client input.
   * Present on every DB query. Users can NEVER access each other's transactions.
   */
  readonly userId: string;

  /**
   * Filter by category UUID.
   * Example: show only "Groceries" transactions.
   * When provided, the Repository adds: WHERE category_id = :categoryId
   */
  readonly categoryId?: string;

  /**
   * Filter by INCOME or EXPENSE.
   * This filters via the JOIN on categories: WHERE categories.type = :type
   * The Repository must handle this as a condition on the association.
   */
  readonly type?: TransactionType;

  /**
   * Filter by payment method.
   * Example: show only UPI transactions.
   * WHERE payment_method = :paymentMethod
   */
  readonly paymentMethod?: PaymentMethod;

  /**
   * Start date of the date range filter (inclusive).
   * Format: 'YYYY-MM-DD'
   * WHERE transaction_date >= :dateFrom
   */
  readonly dateFrom?: string;

  /**
   * End date of the date range filter (inclusive).
   * Format: 'YYYY-MM-DD'
   * WHERE transaction_date <= :dateTo
   */
  readonly dateTo?: string;

  /**
   * Minimum amount filter (inclusive).
   * WHERE amount >= :minAmount
   * Useful for: "show all transactions over ₹5,000"
   */
  readonly minAmount?: number;

  /**
   * Maximum amount filter (inclusive).
   * WHERE amount <= :maxAmount
   * Useful for: "show all transactions under ₹1,000"
   */
  readonly maxAmount?: number;

  /**
   * Page number for pagination (1-indexed).
   * Default: 1 (enforced in Service layer, not here).
   * Used to compute SQL OFFSET: (page - 1) * limit
   */
  readonly page?: number;

  /**
   * Number of records per page.
   * Default: 20 (enforced in Service layer).
   * Maximum: 100 (enforced in FilterTransactionDto validation).
   * Used as SQL LIMIT.
   */
  readonly limit?: number;
}
