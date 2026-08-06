/**
 * @enum CategoryType
 *
 * @description
 * Represents whether a category classifies money coming IN or going OUT.
 *
 * WHY THIS EXISTS HERE (IN TRANSACTION MODULE):
 * The Transaction Module needs to know the type of a transaction (INCOME vs
 * EXPENSE), but this type is NOT stored on the transaction itself — it is
 * derived from the associated category.
 *
 * Defining this enum here (rather than importing from the Category Module)
 * serves one critical purpose: AVOIDING CIRCULAR DEPENDENCIES.
 *
 * Dependency direction must always be:
 *   Transaction Module → shared enum → (no Category Module import needed)
 *
 * If Transaction Module imported CategoryType from Category Module, and
 * Category Module later needed anything from Transaction Module, NestJS
 * would throw a circular dependency error at runtime.
 *
 * POSTGRESQL MAPPING:
 * Mirrors the PostgreSQL ENUM type `category_type` in the categories table.
 * Sequelize reads this value via JOIN when querying transactions.
 *
 * BUSINESS RULES:
 * - INCOME: money received (salary, freelance, investment returns, gifts)
 * - EXPENSE: money spent (food, rent, transport, subscriptions)
 * - This distinction drives budget tracking, reporting, and dashboard totals.
 *
 * NORMALIZATION BENEFIT:
 * By reading type from the category (via JOIN), we guarantee that the type
 * is always consistent with the category's definition. A transaction cannot
 * claim to be INCOME if its category is EXPENSE.
 *
 * USAGE:
 * - Category Entity: column type (in Category Module)
 * - Transaction Service: reading category type after JOIN
 * - Transaction interfaces: typing the derived `type` field in responses
 * - Filter DTO: filtering transactions by INCOME or EXPENSE
 */
export enum CategoryType {
  /** Money received — salary, freelance income, investment returns */
  INCOME = 'INCOME',

  /** Money spent — groceries, rent, transport, entertainment */
  EXPENSE = 'EXPENSE',
}
