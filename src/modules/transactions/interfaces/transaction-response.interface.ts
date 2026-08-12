import { TransactionType } from '../enums/transaction-type.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

/**
 * @interface ICategoryMeta
 *
 * @description
 * The subset of category data included in an API response.
 * This is NOT the full ICategory — only what a client needs to display
 * a transaction card in the UI.
 *
 * WHY A SEPARATE RESPONSE TYPE:
 * ICategory is the internal service contract (includes isActive, etc.).
 * ICategoryMeta is the external API contract (only display-safe fields).
 * Separating them means we can safely add internal fields to ICategory
 * without accidentally leaking them to API consumers.
 */
export interface ICategoryMeta {
  /** UUID of the category */
  readonly id: string;

  /** Human-readable category name */
  readonly name: string;

  /**
   * INCOME or EXPENSE.
   * This is the key field — it tells the client whether this transaction
   * represents money coming in or going out.
   */
  readonly type: TransactionType;

  /** Optional icon identifier for UI rendering */
  readonly icon: string | null;

  /** Optional hex color code for UI rendering */
  readonly color: string | null;
}

/**
 * @interface ITransactionResponse
 *
 * @description
 * The shape of a transaction as returned by the API to the client.
 *
 * WHY THIS IS DIFFERENT FROM ITransaction:
 *
 * 1. FIELD REMOVAL: `deletedAt`, `categoryId` (raw FK), `userId` (redundant
 *    when the user is already authenticated) are stripped — clients don't
 *    need these.
 *
 * 2. FIELD ADDITION: `type` is added as a computed field derived from
 *    `category.type`. This avoids making clients do an extra JOIN mentally.
 *
 * 3. DATE FORMATTING: `transactionDate` is returned as a string (ISO 8601
 *    format: 'YYYY-MM-DD') not a JavaScript Date object, because JSON
 *    serialization of Date loses timezone context. Explicit string format
 *    is predictable and unambiguous.
 *
 * 4. READONLY FIELDS: All fields are readonly — this interface represents
 *    immutable response data. Nobody should mutate a response object.
 *
 * REQUEST FLOW:
 *   ITransaction (from DB via Repository)
 *       ↓
 *   TransactionService.toResponse() — maps ITransaction → ITransactionResponse
 *       ↓
 *   TransactionController — returns ITransactionResponse to client
 *
 * SECURITY:
 * This interface acts as a whitelist. Only fields explicitly listed here
 * are returned to the client. Internal audit fields, soft-delete markers,
 * and raw FK values are never accidentally exposed.
 *
 * PERFORMANCE:
 * The Service builds this shape in memory — no extra DB query.
 * It maps the JOINed data from ITransaction.category into the flat response.
 */
export interface ITransactionResponse {
  /** UUID of the transaction */
  readonly id: string;

  /**
   * The financial amount.
   * Always positive. Directionality (income vs expense) is determined by `type`.
   */
  readonly amount: number;

  /**
   * The calendar date of the transaction in 'YYYY-MM-DD' format.
   * String — not Date — to avoid JSON serialization timezone ambiguity.
   */
  readonly transactionDate: string;

  /** How the payment was made or received */
  readonly paymentMethod: PaymentMethod;

  /**
   * INCOME or EXPENSE — derived from the associated category.
   * This field does NOT exist in the transactions table.
   * It is computed by the Service layer via category JOIN.
   * Clients use this to render +/- signs, colors, and filter views.
   */
  readonly type: TransactionType;

  /** Optional user note */
  readonly note: string | null;

  /**
   * Flattened category metadata.
   * Clients receive the category name and icon for display purposes
   * without needing to make a separate category API call.
   */
  readonly category: ICategoryMeta;

  /** ISO 8601 timestamp — when this record was created */
  readonly createdAt: string;

  /** ISO 8601 timestamp — when this record was last modified */
  readonly updatedAt: string;
}

/**
 * @interface ITransactionListResponse
 *
 * @description
 * Paginated list response wrapper for transaction collections.
 *
 * WHY A WRAPPER:
 * Returning a raw array to the client discards pagination metadata.
 * The client needs to know: total records, current page, total pages —
 * to render pagination controls correctly.
 *
 * This is standard practice in production REST APIs.
 *
 * USAGE:
 * GET /transactions → ITransactionListResponse
 * GET /transactions?page=2&limit=10 → ITransactionListResponse
 */
export interface ITransactionListResponse {
  /** Array of transactions for the current page */
  readonly data: ITransactionResponse[];

  /** Pagination metadata */
  readonly meta: {
    /** Total number of matching records (across all pages) */
    readonly total: number;

    /** Current page number (1-indexed) */
    readonly page: number;

    /** Number of records per page */
    readonly limit: number;

    /** Total number of pages: Math.ceil(total / limit) */
    readonly totalPages: number;

    /** Whether a next page exists */
    readonly hasNextPage: boolean;

    /** Whether a previous page exists */
    readonly hasPreviousPage: boolean;
  };
}
