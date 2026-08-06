# Categories Module Architecture

This document explains the architectural and database design decisions for the Categories Module, specifically focusing on the unified "System Default + User Custom" approach.

### 1. Why `created_by` exists
The `created_by` column is used to track ownership of custom categories. It establishes a one-to-many relationship between a User and their specific custom categories. For system defaults, this value is explicitly set to `NULL`, immediately indicating it is not owned by any single user.

### 2. Why `is_default` exists
The `is_default` boolean flag acts as a strict partition between global categories and custom categories. It allows our business logic (in services and repositories) to easily lock down edits or deletions for system categories, ensuring no user can accidentally modify or remove a globally shared category. 

### 3. Why system categories are stored only once
Storing system categories once (where `is_default = TRUE` and `created_by = NULL`) acts as a single source of truth. If we ever need to update the name of a default category (e.g., from "Electricity" to "Electricity Bill") or translate it, we only need to update a single row in the database, and the change instantly reflects for all users.

### 4. Why custom categories belong only to one user
Personal finance is highly subjective. One user might want a category called "College Fund", while another wants "Dog Toys". By scoping custom categories strictly to a single user (`created_by = userId`), we ensure total privacy and prevent the global dropdowns from being polluted with thousands of irrelevant categories created by other users.

### 5. Why this design is normalized
In a poorly normalized database, every user would have their own copy of "Food" or "Rent". In our design, the `categories` table represents the entity purely without redundancy. Furthermore, the `Transaction` module will only store `category_id`. The transaction's type (INCOME/EXPENSE) is inferred by joining the `categories` table, meaning we don't have contradictory data (like an expense transaction pointing to an income category).

### 6. Why this is scalable
This design drastically reduces the storage footprint. If the app grows to 1,000,000 users, and there are 24 default categories, we only store 24 rows for defaults instead of 24,000,000 rows. Queries for `GET /categories` leverage database indexes on `(created_by, is_default, deleted_at)` to return results in milliseconds, regardless of how many users exist.

### 7. Why this is better than creating duplicate categories for every user
Creating duplicate categories for every user upon registration introduces several severe anti-patterns:
- **Massive Write Overhead**: Onboarding a new user would require 24 simultaneous INSERT operations, slowing down signup.
- **Maintenance Nightmare**: If we decide to add a new default category (e.g., "Crypto"), we would have to run a migration to insert it for every single existing user.
- **Data Inconsistency**: Users might delete or rename a duplicated default category, breaking analytics or standardized reporting across the platform.

### 8. How Transaction Module will consume these APIs
When the user opens the frontend to add a new Transaction, the frontend will call `GET /api/v1/categories`. Our unified API securely returns:
```sql
WHERE (created_by = loggedInUserId OR is_default = TRUE) AND deleted_at IS NULL
ORDER BY type ASC, name ASC
```
The frontend will group these by `type` (Expense vs Income). When the user selects a category, the frontend only sends the `categoryId` to the Transaction Module (`POST /api/v1/transactions`). The Transaction Module will validate that the `categoryId` exists and is either a system default or belongs to the user, ensuring seamless integration without relying on frontend logic to maintain data integrity.
