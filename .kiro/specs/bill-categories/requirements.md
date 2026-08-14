# Requirements Document

## Introduction

The Bill Categories module provides a dedicated system for managing bill categories in the NestJS application. Currently, the bills module stores bills with a plain UUID categoryId field without any foreign key relationship or category management system. This module will create a structured approach to bill categorization with predefined system categories and support for future custom categories.

## Glossary

- **Bill_Category_System**: The module responsible for managing bill categories (CRUD operations, validation, persistence)
- **Bill_Module**: The existing module that manages bills and references bill categories via categoryId
- **Category_Entity**: A bill category record with attributes like name, description, icon, color, and status
- **Soft_Delete**: A deletion strategy where records are marked as deleted (deletedAt timestamp) but not physically removed from the database
- **Seeder**: A script that populates the database with predefined default categories
- **Foreign_Key**: A database constraint that enforces referential integrity between bills.categoryId and bill_categories.id

## Requirements

### Requirement 1: Bill Category Schema

**User Story:** As a developer, I want a Sequelize model for bill categories, so that I can store and manage category data with proper type safety and validation.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL define a Category_Entity with the following fields: id (UUID primary key), name (string up to 100 characters), description (optional text), icon (optional string up to 50 characters), color (optional string up to 20 characters), isActive (boolean), createdAt (timestamp), updatedAt (timestamp), deletedAt (optional timestamp)
2. THE Bill_Category_System SHALL use UUID version 4 as the default value for the id field
3. THE Bill_Category_System SHALL enforce the name field as required and not null
4. THE Bill_Category_System SHALL enable Soft_Delete functionality using paranoid mode
5. THE Bill_Category_System SHALL create database indexes on the name and isActive fields for query performance
6. THE Bill_Category_System SHALL use camelCase naming for all model fields consistent with the existing codebase

### Requirement 2: CRUD Operations

**User Story:** As a developer, I want complete CRUD operations for bill categories, so that I can create, retrieve, update, and delete categories through the application.

#### Acceptance Criteria

1. WHEN a valid category creation request is received, THE Bill_Category_System SHALL create a new Category_Entity and return it with a 201 status code
2. WHEN a request to retrieve all categories is received, THE Bill_Category_System SHALL return all non-deleted categories ordered by name
3. WHEN a request to retrieve a specific category by id is received, THE Bill_Category_System SHALL return the Category_Entity if it exists and is not deleted
4. WHEN a valid category update request is received, THE Bill_Category_System SHALL update the specified Category_Entity and return the updated record
5. WHEN a delete request is received, THE Bill_Category_System SHALL perform a Soft_Delete on the Category_Entity
6. IF a requested category does not exist, THEN THE Bill_Category_System SHALL return a 404 error with a descriptive message
7. WHERE a category is marked as deleted (deletedAt is not null), THE Bill_Category_System SHALL exclude it from standard query results

### Requirement 3: Service Layer with Business Logic

**User Story:** As a developer, I want a service layer that encapsulates business logic, so that I can maintain separation of concerns and reuse logic across controllers.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL implement a service class that handles all database operations through Sequelize
2. THE Bill_Category_System SHALL validate that category names are unique before creation
3. WHEN updating a category, THE Bill_Category_System SHALL validate that the new name does not conflict with existing categories
4. THE Bill_Category_System SHALL prevent deletion of categories that are currently referenced by active bills
5. IF a deletion attempt is made on a category with active bill references, THEN THE Bill_Category_System SHALL return an error indicating the category is in use
6. THE Bill_Category_System SHALL provide methods for: create, findAll, findById, update, and softDelete operations

### Requirement 4: REST API Controller

**User Story:** As a frontend developer, I want REST API endpoints for bill categories, so that I can integrate category management into the user interface.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL expose a POST endpoint at /bill-categories for creating categories
2. THE Bill_Category_System SHALL expose a GET endpoint at /bill-categories for retrieving all categories
3. THE Bill_Category_System SHALL expose a GET endpoint at /bill-categories/:id for retrieving a single category
4. THE Bill_Category_System SHALL expose a PATCH endpoint at /bill-categories/:id for updating categories
5. THE Bill_Category_System SHALL expose a DELETE endpoint at /bill-categories/:id for soft-deleting categories
6. THE Bill_Category_System SHALL require authentication for all category endpoints
7. THE Bill_Category_System SHALL return standardized API responses using the existing ApiResponse helper
8. THE Bill_Category_System SHALL include Swagger/OpenAPI documentation for all endpoints

### Requirement 5: Data Transfer Objects with Validation

**User Story:** As a developer, I want DTOs with Zod validation, so that I can ensure data integrity and provide clear error messages for invalid requests.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL define a CreateBillCategoryDto with validation for: name (required string, 1-100 characters), description (optional string, max 500 characters), icon (optional string, max 50 characters), color (optional string, hex color or color name, max 20 characters), isActive (optional boolean, default true)
2. THE Bill_Category_System SHALL define an UpdateBillCategoryDto with the same fields as CreateBillCategoryDto but all optional
3. THE Bill_Category_System SHALL use Zod schemas for validation
4. WHEN validation fails, THE Bill_Category_System SHALL return a 400 error with specific field-level error messages
5. THE Bill_Category_System SHALL trim whitespace from string inputs before validation
6. WHERE a color field is provided, THE Bill_Category_System SHALL validate it matches hex color format (#RGB or #RRGGBB) or is a valid CSS color name

### Requirement 6: Default Categories Seeder

**User Story:** As a system administrator, I want a seeder script that populates default bill categories, so that users have pre-configured categories available immediately.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL provide a seeder script that can be executed via npm/yarn command
2. THE Seeder SHALL create the following default categories with appropriate metadata:
   - Utilities: Electricity, Water, Gas, Internet, Phone
   - Housing: Rent, Mortgage, Property Tax, HOA Fees
   - Transportation: Car Payment, Insurance, Fuel, Maintenance
   - Healthcare: Health Insurance, Medical Bills, Prescriptions
   - Entertainment: Subscriptions, Streaming Services
   - Others: Miscellaneous
3. THE Seeder SHALL assign appropriate icon names and colors to each default category
4. THE Seeder SHALL set isActive to true for all default categories
5. THE Seeder SHALL check for existing categories by name before insertion to prevent duplicates
6. WHEN a category already exists, THE Seeder SHALL skip creation and log the skip action
7. THE Seeder SHALL run as part of the database migration process

### Requirement 7: Foreign Key Relationship with Bills

**User Story:** As a developer, I want a proper foreign key relationship between bills and categories, so that I can ensure data integrity and prevent orphaned bill records.

#### Acceptance Criteria

1. THE Bill_Module SHALL add a @ForeignKey decorator to the categoryId field in the Bill schema referencing Bill_Category
2. THE Bill_Module SHALL add a @BelongsTo relationship decorator to establish the association with Bill_Category
3. THE Bill_Category_System SHALL define the inverse @HasMany relationship to Bill entities
4. THE Bill_Module SHALL enable eager loading of category data when querying bills
5. THE Foreign_Key SHALL be configured with ON DELETE RESTRICT to prevent deletion of categories with active bills
6. THE Foreign_Key SHALL be configured with ON UPDATE CASCADE to propagate category id changes

### Requirement 8: Database Migration

**User Story:** As a developer, I want database migrations for the bill categories table and foreign key constraint, so that I can apply schema changes in a version-controlled manner.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL provide a migration script to create the bill_categories table with all required fields
2. THE Migration SHALL create indexes on name and isActive fields
3. THE Migration SHALL create a second migration to add the foreign key constraint from bills.categoryId to bill_categories.id
4. THE Migration SHALL execute the category seeder after table creation
5. THE Migration SHALL include a rollback (down) function that drops the foreign key constraint and table
6. WHEN the migration is rolled back, THE Bill_Category_System SHALL drop the foreign key constraint before dropping the bill_categories table
7. THE Migration SHALL use parameterized queries to prevent SQL injection

### Requirement 9: Error Handling

**User Story:** As a frontend developer, I want consistent and descriptive error responses, so that I can provide helpful feedback to users and debug issues easily.

#### Acceptance Criteria

1. WHEN a database connection error occurs, THE Bill_Category_System SHALL return a 500 error with a generic message
2. WHEN a validation error occurs, THE Bill_Category_System SHALL return a 400 error with field-specific error details
3. WHEN a duplicate category name is detected, THE Bill_Category_System SHALL return a 409 error indicating the conflict
4. WHEN a category is not found, THE Bill_Category_System SHALL return a 404 error with the category id in the message
5. WHEN attempting to delete a category in use by bills, THE Bill_Category_System SHALL return a 400 error listing the number of affected bills
6. THE Bill_Category_System SHALL log all errors with appropriate severity levels using NestJS logger
7. THE Bill_Category_System SHALL not expose internal database details or stack traces in production error responses

### Requirement 10: Module Integration

**User Story:** As a developer, I want the bill categories module properly integrated into the NestJS application, so that it follows the existing architecture patterns and is discoverable.

#### Acceptance Criteria

1. THE Bill_Category_System SHALL be defined as a NestJS module with proper imports and exports
2. THE Bill_Category_System SHALL register the Category_Entity with SequelizeModule.forFeature
3. THE Bill_Category_System SHALL export the service for use by other modules
4. THE Bill_Module SHALL import the Bill_Category_System to access category functionality
5. THE Bill_Category_System SHALL be registered in the root AppModule
6. THE Bill_Category_System SHALL follow the existing folder structure: controllers/, services/, dto/, schemas/, interfaces/
7. THE Bill_Category_System SHALL include an index.ts file that exports all public interfaces and classes
