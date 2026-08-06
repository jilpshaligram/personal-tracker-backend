/**
 * @enum PaymentMethod
 *
 * @description
 * Represents the method used to make or receive a financial transaction.
 *
 * WHY THIS EXISTS:
 * Payment method is a constrained vocabulary. Allowing free-text strings
 * leads to inconsistent data (e.g., "cash", "Cash", "CASH", "by hand").
 * An enum enforces a single canonical value per method.
 *
 * POSTGRESQL MAPPING:
 * This enum mirrors the PostgreSQL ENUM type `payment_method` created in the
 * migration file. Sequelize uses these string values directly when inserting
 * or querying rows.
 *
 * BUSINESS RULES:
 * - Every transaction MUST specify exactly one payment method.
 * - `OTHER` is an intentional escape hatch for uncategorized methods.
 * - Values are uppercase snake_case to match PostgreSQL ENUM conventions.
 *
 * PERFORMANCE:
 * PostgreSQL ENUM types are stored as 4-byte integers internally, making
 * comparisons and index lookups faster than VARCHAR columns.
 *
 * USAGE:
 * - Transaction Entity: column type
 * - Create/Update DTOs: validation via @IsEnum(PaymentMethod)
 * - Filter DTO: optional filter by payment method
 * - Service layer: switch/case logic if needed
 */
export enum PaymentMethod {
  /** Physical currency — no digital record on payment processor side */
  CASH = 'CASH',

  /** Credit card payment — buy now, pay later */
  CREDIT_CARD = 'CREDIT_CARD',

  /** Debit card payment — directly from bank account */
  DEBIT_CARD = 'DEBIT_CARD',

  /** Wire transfer or NEFT/RTGS between bank accounts */
  BANK_TRANSFER = 'BANK_TRANSFER',

  /** Unified Payments Interface — India-specific instant payment system */
  UPI = 'UPI',

  /** Digital wallet: Paytm, PhonePe, Google Pay balance, etc. */
  WALLET = 'WALLET',

  /** Paper cheque — still used in B2B and rent payments */
  CHEQUE = 'CHEQUE',

  /** Escape hatch for payment methods not listed above */
  // OTHER = 'OTHER',
}
