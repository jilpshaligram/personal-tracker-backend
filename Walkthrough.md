# Personal Expense Tracker Backend
## Transaction & Financial Modules — Technical Walkthrough

This document serves as a deep technical walkthrough of the core financial modules (Transaction, Wallet, Saving Goal, Budget) of the Personal Expense Tracker Backend. It is intended for senior developers tasked with maintaining, debugging, or extending the application.

---

### System Architecture Overview

The backend uses a standard multilayer architecture based on NestJS, utilizing Sequelize as an ORM to interact with PostgreSQL.

```text
       Client
         │
         ▼
     Controller (HTTP Route & Req/Res Handling)
         │
         ▼
  AuthGuard & ZodValidationPipe (Security & Sanitization)
         │
         ▼
      Service (Core Business Logic & Orchestration)
         │
         ▼
     Repository (Database Query & Isolation Layer)
         │
         ▼
  Sequelize Model (Entity Definition)
         │
         ▼
     PostgreSQL (Persistence & Data Integrity)
```

### High-Level Module Relationships

```text
      User
       │
       ▼
     Wallet (Tracks available liquidity)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
  Transaction (Ledger)             Saving Goal (Tracks locked funds)
       │                                 ▲
       ├────────► Category               │
       │                                 │
       └─────────────────────────────────┘

     Budget (Tracks spending limits)
       │
       └────► Aggregates EXPENSE Transactions
```

---

## MODULE MAP

| Module | Main Responsibility | Main Tables | Depends On |
|--------|---------------------|-------------|------------|
| **Wallet** | Central store of current and blocked balances. | `wallets` | - |
| **Category** | Defines types for income and expenses. | `categories`| - |
| **Saving Goal** | Tracks user targets for locked funds. | `saving_goals` | - |
| **Transaction** | Master ledger recording all balance changes. | `transactions` | Wallet, Category, Saving Goal |
| **Budget** | Monitors total spent amounts in given periods. | `budgets` | Transaction |

---

## 1. WALLET MODULE

The Wallet acts as a user's single source of financial truth.

| Column | Type | Purpose | Updated When |
|--------|------|---------|--------------|
| `id` | UUID | Primary key | Never |
| `user_id` | UUID | Links wallet to the user (Unique 1:1) | Never |
| `current_balance`| DECIMAL | Total money residing in the wallet | Income, Expense |
| `blocked_amount` | DECIMAL | Total money locked in Saving Goals | Saving Goal Deposit / Withdraw |
| `currency` | VARCHAR(3) | 3-letter currency code | Creation |

> **Important Concept: Available Balance**
> `available_balance` is **not** a database column. It is always calculated on the fly in memory:
> `availableBalance = currentBalance - blockedAmount`

### Real Application Example

**Initial State:**
`current_balance` = 10000
`blocked_amount` = 3000
`available_balance` = 7000

- **Income (2000) Occurs**: `current_balance` becomes 12000. `available_balance` becomes 9000.
- **Expense (1000) Occurs**: `current_balance` becomes 11000. `available_balance` becomes 8000.
- **Transfer to Saving (2000)**: `blocked_amount` becomes 5000. `current_balance` remains 11000. `available_balance` becomes 6000.
- **Withdraw from Saving (1000)**: `blocked_amount` becomes 4000. `current_balance` remains 11000. `available_balance` becomes 7000.

---

## 2. TRANSACTION MODULE

The Transaction module is the ledger engine. **Every** movement of money must flow through `TransactionService.create`.

### Transaction Types

| Type | `category_id` | Wallet Effect | Saving Goal Effect | Purpose |
|------|---------------|---------------|--------------------|---------|
| `INCOME` | Required | `current_balance += amount` | None | Adding external funds |
| `EXPENSE` | Required | `current_balance -= amount` | None | Spending available funds |
| `TRANSFER_TO_SAVING` | Nullable | `blocked_amount += actualAmount`| `saved_amount += actualAmount` | Locking money |
| `TRANSFER_FROM_SAVING`| Nullable | `blocked_amount -= amount` | `saved_amount -= amount` | Unlocking money |
| `OPENING_BALANCE` | - | - | - | **Rejected**. Code explicitly throws `BadRequestException`. |

> **Available Balance Check:**
> For both `EXPENSE` and `TRANSFER_TO_SAVING`, `TransactionService` explicitly verifies `availableBalance >= amount`. If false, the transaction rolls back with an error.

---

## 3. TRANSACTION CREATION FLOW

This flow demonstrates the creation of an `EXPENSE` or `TRANSFER` via the API.

```text
POST /api/v1/transactions
         │
         ▼
     AuthGuard (Extracts JWT -> req.user)
         │
         ▼
 ZodValidationPipe (Validates numeric amounts, enums, UUIDs)
         │
         ▼
TransactionController (src/modules/transactions/controllers/transaction.controller.ts)
         │
         ▼
 TransactionService (src/modules/transactions/services/transaction.service.ts)
         │
         ├──► this.sequelize.transaction(async (t) => {
         │
         ├──► WalletRepository.findByUserIdForUpdate (Row-level lock on Wallet)
         │
         ├──► (Optional) CategoriesRepository.findOneById (Validate ownership & active state)
         │
         ├──► (Optional) SavingGoalService.findGoalOrFail (Row-level lock on Goal, validates limits)
         │
         ├──► Calculate new `current_balance` or `blocked_amount`
         │
         ├──► WalletRepository.update
         │
         ├──► TransactionRepository.create
         │
         └──► Commit Sequelize Transaction
```

---

## 4. SAVING GOAL MODULE

Tracks long-term user savings targets. Funds transferred here are marked as `blocked_amount` in the Wallet.

| Field | Meaning |
|-------|---------|
| `targetAmount` | The maximum capacity the user wants to save. |
| `savedAmount` | Total currently saved inside the goal. |
| `remainingAmount` | `targetAmount - savedAmount` (Calculated automatically). |
| `status` | `ACTIVE`, `COMPLETED`, or `CANCELLED`. |
| `isCompleted` | Boolean flag, true if `savedAmount >= targetAmount`. |

### Important Capped Transfer Logic

The business rules strictly enforce that a user can **never** save more than the `targetAmount` of a goal. 

If a user deposits money, the backend calculates:
`actualDeposit = Math.min(requestedAmount, remainingTarget)`

**Example Scenario:**
- `targetAmount` = ₹2,000
- `savedAmount` = ₹500
- `remainingTarget` = ₹1,500
- **Requested Transfer** = ₹5,000

**Actual Execution:**
- The backend determines `actualDeposit` = ₹1,500.
- `savedAmount` is increased by ₹1,500 (becomes ₹2,000).
- Wallet `blocked_amount` is increased by ₹1,500.
- Transaction record is created for ₹1,500.
- The remaining ₹3,500 stays in the wallet's available balance. 

---

## 5. SAVING GOAL DEPOSIT / WITHDRAW FLOW

```text
User Request: POST /saving-goals/:id/deposit { amount: X }
         │
         ▼
    TransactionService
         │
         ▼
findGoalOrFail(goalId, userId, t) ──────► (Applies row-level DB lock on Goal)
         │
         ▼
 Calculate: Math.min(amount, remainingAmount)
         │
         ▼
  WalletRepository.update ──────────────► (Increases blocked_amount)
         │
         ▼
  SavingGoalModel.update ───────────────► (Increases saved_amount, sets COMPLETED if full)
         │
         ▼
TransactionRepository.create ───────────► (Creates TRANSFER_TO_SAVING record)
         │
         ▼
      COMMIT
```

---

## 6. BUDGET MODULE

The Budget module allows users to define a limit (`amount`) over a specified `period` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).

### Period Date Calculation
The backend completely ignores user-provided dates for budget creation and dynamically calculates them using Moment.js (`src/common/utils/date.utils.ts`):
- **DAILY**: `startOf('day')` → `endOf('day')`
- **WEEKLY**: `startOf('isoWeek')` (Monday) → `endOf('isoWeek')`
- **MONTHLY**: `startOf('month')` → `endOf('month')`
- **YEARLY**: `startOf('year')` → `endOf('year')`

### Budget vs Transactions Aggregation
When checking a budget via `BudgetService.getDashboardOverview`, the backend determines the `spentAmount` by calculating:
```sql
SELECT SUM(amount) 
FROM transactions
WHERE type = 'EXPENSE'
  AND user_id = :userId
  AND transaction_date >= :startDate
  AND transaction_date <= :endDate
  AND deleted_at IS NULL
```

### Recent Budget Logic
- The API retrieves all budgets where `is_active = true`.
- If a budget's `endDate` is fully in the past, it auto-updates it to `is_active = false`.
- For the remaining active budgets, it selects the single most recent one per `period` and calculates live `spentAmount` against it.

---

## 7. BUDGET + CATEGORY BREAKDOWN

> **Status: Not Implemented**
> The codebase contains a commented-out function `getCategoryBreakdown` in `budget.service.ts`. Currently, the API only returns aggregate spent amounts. There is no live categorization grouping available via the Budget module.

---

## 8. CORE PROGRAMMING & DATABASE CONCEPTS USED

| Concept | Where Used | Why |
|---------|-------------|-----|
| **Sequelize Transaction** | `TransactionService.create` | Ensures Wallet, Saving Goal, and Transaction tables update completely atomically. |
| **Row-level Locking** | `WalletRepository.findByUserIdForUpdate`, `SavingGoalService.findGoalOrFail` | `FOR UPDATE` lock prevents concurrent deposit requests from bypassing target limits or overdrawing available balance. |
| **Soft Delete** | Repositories & Migrations | Records use `deleted_at`. DB Partial Indexes use `WHERE deleted_at IS NULL` for query speed. |
| **DTO Validation (Zod)** | All Controllers | Ensures strings, positive numbers, and UUIDs are clean before entering Services. |
| **SQL SUM** | `BudgetRepository.getSpentAmountForBudget` | Used to dynamically aggregate expense transactions for budgets. |
| **Map/Promise.all** | `BudgetService.getDashboardOverview` | Used to concurrently execute spent calculations across multiple active budgets. |
| **Authentication** | `AuthGuard` | Enforces JWT validation globally where applied. |
| **Pagination** | `TransactionService.findAll` | Slices large sets of history rows to prevent memory exhaustion. |

---

## 9. DATABASE MIGRATIONS — DETAILED

### PostgreSQL Migration Walkthrough

The DB schema is constructed through deterministic up/down migrations located in `src/migrations/`. 

| Migration | Operation | Why It Exists | Important Constraint |
|-----------|-----------|---------------|----------------------|
| `create-transactions-table` | Creates `transactions` | Ledger tracking | `chk_transactions_amount_positive`: Enforces DB-level block on negative amounts. |
| `create-wallets-table` | Creates `wallets` | Balance tracking | `unique(user_id)`: Limits one wallet per user. `CHECK(current_balance >= 0)`. |
| `create-saving-goals-table` | Creates `saving_goals` | Locking money | Custom native ENUMs for statuses. Target > 0 constraint. |
| `create-budgets-table` | Creates `budgets` | Limit tracking | `idx_budgets_user_dates` prevents overlapping duplicate budgets. |

**Migration Execution Flow:**
```text
Migration file (.js)
       ↓
Sequelize CLI (`queryInterface`)
       ↓
PostgreSQL DDL (CREATE TABLE, ALTER TYPE)
       ↓
Table / Index / Constraint creation
```

---

## 10. DATABASE RELATIONSHIP DIAGRAM

```text
       ┌─────────────────────┐
       │        users        │
       └────┬──────┬──────┬──┘
            │      │      │
      1:1   │      │ 1:M  │  1:M
   ┌────────▼┐    ┌▼──────▼────┐    ┌─────────────┐
   │ wallets │    │ categories │    │   budgets   │
   └─────────┘    └──────┬─────┘    └─────────────┘
                         │
                         │ 1:M
                   ┌─────▼────────┐
                   │ transactions │
                   └─────┬────────┘
                         │
                         │ M:1 (Nullable)
                   ┌─────▼────────┐
                   │ saving_goals │
                   └──────────────┘
```

**Foreign Keys:**
- `transactions.user_id` → `users.id` (CASCADE)
- `transactions.category_id` → `categories.id` (RESTRICT - prevents deleting a category with history)
- `wallets.user_id` → `users.id` (CASCADE)
- `budgets.user_id` → `users.id` (CASCADE)
- `saving_goals.user_id` → `users.id` (CASCADE)

---

## 11. COMPLETE API REQUEST FLOW

### General API Execution Lifecycle
```text
HTTP Request
       ↓
NestJS Application Framework
       ↓
AuthGuard (Validates JWT, sets req.user.sub)
       ↓
Controller (e.g. `TransactionController`)
       ↓
ZodValidationPipe (Verifies Request Body mapping to DTO)
       ↓
Service (e.g. `TransactionService`)
       ↓
Repository (e.g. `TransactionRepository`)
       ↓
Sequelize ORM
       ↓
PostgreSQL Database
       ↓
JSON HTTP Response
```

### Supported API Flows
- **POST** `/transactions` — Creates an Income or Expense, adjusts wallet.
- **GET** `/transactions` — Retrieves paginated history.
- **GET** `/transactions/:id` — Gets a single transaction.
- **POST** `/saving-goals` — Creates a goal.
- **POST** `/saving-goals/:id/deposit` — Wraps `TransactionType.TRANSFER_TO_SAVING`.
- **POST** `/saving-goals/:id/withdraw` — Wraps `TransactionType.TRANSFER_FROM_SAVING`.
- **GET** `/budgets` — Retrieves all budgets.
- **GET** `/budgets/dashboard/overview` — Retrieves live spent amounts for active budgets.

---

## 12. FILE RESPONSIBILITY MAP

| File | Responsibility | Called By / Used By |
|------|----------------|---------------------|
| `wallet.service.ts` | Only fetches raw wallet data. NEVER updates balances directly. | Controllers |
| `transaction.service.ts`| The ONLY place that calculates and mutates wallet/goal balances. | `transaction.controller.ts`, `saving-goal.controller.ts` |
| `transaction.repository.ts`| Executes all queries mapped to `Transaction` entity. | `transaction.service.ts` |
| `saving-goal.service.ts`| Calculates remaining/target bounds. Uses row-locks (`findGoalOrFail`). | `transaction.service.ts` |
| `budget.repository.ts`| Performs the SUM() logic for spent tracking. | `budget.service.ts` |
| `date.utils.ts` | Determines precise start/end bounds for periods via Moment. | `budget.service.ts` |
| `auth.guard.ts` | Secures routes and drops JWT into request context. | Controllers |

---

## 13. DEBUGGING MAP: WHERE TO LOOK

**Problem: Wallet available balance is incorrect or went negative.**
*Check*: `transaction.service.ts` (`TRANSFER` or `EXPENSE` case blocks). Verify the check `if (availableBalance < amount)`. Verify `WalletRepository.update` is executing properly.

**Problem: Saving goal saved amount exceeds the target.**
*Check*: `transaction.service.ts` (`TRANSFER_TO_SAVING`). Verify the math: `Math.min(dto.amount, remainingTarget)`. Verify `findGoalOrFail` inside `saving-goal.service.ts` is actually passing the `Transaction (t)` object so PostgreSQL row locking occurs.

**Problem: User can see another user's transaction history.**
*Check*: `transaction.repository.ts`. Verify the `userId` is strictly included in the `WHERE` clause: `where: { user_id: userId }`.

**Problem: Budgets show ₹0 spent even though transactions exist.**
*Check*: `budget.repository.ts` -> `getSpentAmountForBudget()`. Verify that the dates generated by `date.utils.ts` precisely encompass the `transaction_date` in the database. Ensure the transactions are of type `EXPENSE`.

---

## 14. SECURITY AND DATA ISOLATION

### How Isolation is Enforced
Data isolation is flawless by design. Every Controller extracts `userId` directly from the authenticated token:
```typescript
const userId = req.user.sub;
```
Client-side provided IDs (`user_id` inside payloads) are strictly ignored or outright blocked. 

When a repository queries the database, the `userId` is forcefully injected:
```typescript
await this.transactionRepository.findAllPaginated(userId, ...);
```
If User A requests Transaction X (owned by User B), the query `WHERE id = X AND user_id = A` returns `null`, throwing a `NotFoundException`.

### Error Handling Topology
- **Validation Errors (400)**: Emitted heavily by `ZodValidationPipe` when request DTOs are malformed (e.g., amount is a string, UUID is invalid).
- **Unauthorized (401)**: Missing, malformed, or expired JWT token (caught by `AuthGuard`).
- **Forbidden (403)**: Handled directly in Services if a user attempts an action on a shared resource they don't own (e.g., trying to use a Category owned by someone else).
- **Not Found (404)**: Handled when `Repository.findOne` returns null.
- **Conflict (409)**: Handled in `BudgetService` if two active Monthly budgets overlap.
- **Bad Request (400)**: Business rule violations ("Insufficient available balance", "Goal completed").

---

## 15. REAL APPLICATION EXAMPLES

### Example 1: Expense Evaluation
- **State**: Wallet current balance = ₹10,000, blocked amount = ₹2,000. Available = ₹8,000.
- **Action**: User logs `EXPENSE` of ₹1,000.
- **Execution**: `1000 <= 8000` is True.
- **Result**: `currentBalance` becomes ₹9,000. Available becomes ₹7,000. Blocked remains ₹2,000.

### Example 2: Target Deposit Overflow
- **State**: Goal Target = ₹2,000, Saved = ₹1,500. Remaining = ₹500. Wallet Available = ₹10,000.
- **Action**: User requests `TRANSFER_TO_SAVING` for ₹5,000.
- **Execution**: Backend determines actual needed is `Math.min(5000, 500)` = ₹500.
- **Result**: Transaction recorded for ₹500. Wallet blocked amount increases by ₹500. Wallet available balance becomes ₹9,500. Goal is marked `COMPLETED`.

---

## 16. IF YOU NEED TO MODIFY THIS SYSTEM...

- **Add a new Transaction Type?** Modify `TransactionType` ENUM, add the logic block to `TransactionService.create`, and verify it adjusts the wallet appropriately.
- **Modify Wallet Calculation logic?** DO NOT change `wallet.service.ts`. All balance calculations occur in `transaction.service.ts`.
- **Change Budget Period calculation?** Go to `src/common/utils/date.utils.ts` and modify the Moment.js generator logic.
- **Add DB Constraints?** Always put them into a new Sequelize migration file inside `src/migrations`. Ensure you test the `down()` script.
- **Debug Race Conditions?** Check `TransactionService.create`. Row locks (`findByUserIdForUpdate`) are heavily relied upon to manage concurrent balance calculations safely.
