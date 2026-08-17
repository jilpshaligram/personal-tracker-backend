# Requirements Document

## Introduction

This document specifies the requirements for enhancing the existing audit-logs module to provide comprehensive audit logging across all modules and APIs in the NestJS application. The system will track user actions for security, compliance, and debugging purposes using structured logging with Pino and persistent storage via Sequelize ORM.

## Glossary

- **Audit_Log_System**: The comprehensive audit logging system including schema, service, interceptor, and controller components
- **Pino_Logger**: The Pino logging library configured for structured JSON logging
- **Audit_Log_Service**: The NestJS service responsible for creating and retrieving audit log entries
- **Audit_Interceptor**: The NestJS interceptor that automatically captures API calls and creates audit logs
- **Audit_Log_Controller**: The REST API controller that exposes audit log retrieval endpoints
- **Audit_Log_Schema**: The Sequelize model defining the database structure for audit logs
- **Request_Correlation_ID**: A unique identifier used to trace requests across the system
- **Entity**: Any resource in the system that can be acted upon (e.g., Bill, Transaction, User)
- **Action_Type**: An enumerated value representing the type of operation performed (CREATE, UPDATE, DELETE, etc.)
- **IP_Extractor**: A helper function that extracts the real IP address from requests, handling proxies and X-Forwarded-For headers
- **Changes_Tracker**: An optional component that captures before/after values for UPDATE actions
- **Admin_User**: A user with administrative privileges who can view all audit logs
- **Regular_User**: A non-administrative user who can only view their own audit logs

## Requirements

### Requirement 1: Pino Logger Integration

**User Story:** As a developer, I want to integrate Pino logger with structured JSON logging, so that I can have consistent, performant logging across the application.

#### Acceptance Criteria

1. THE Pino_Logger SHALL be installed with pino-pretty as development dependencies
2. THE Pino_Logger SHALL be configured to output structured JSON logs
3. THE Pino_Logger SHALL support log levels: debug, info, warn, and error
4. WHEN running in development environment, THE Pino_Logger SHALL use pino-pretty for human-readable output
5. WHEN running in production environment, THE Pino_Logger SHALL output raw JSON logs
6. THE Pino_Logger SHALL include Request_Correlation_ID in all log entries for request tracing
7. THE Pino_Logger SHALL be configured as a global module accessible throughout the application

### Requirement 2: Audit Log Database Schema

**User Story:** As a system architect, I want a comprehensive audit log database schema, so that all user actions can be tracked with complete context.

#### Acceptance Criteria

1. THE Audit_Log_Schema SHALL define a table with UUID primary key named "id"
2. THE Audit_Log_Schema SHALL include a "userId" field as UUID referencing the users table
3. THE Audit_Log_Schema SHALL include a "module" field as string indicating which module the action occurred in
4. THE Audit_Log_Schema SHALL include an "action" field as enum with values: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, PAYMENT, EXPORT, REGISTER, PASSWORD_RESET, MARK_READ, DOWNLOAD, CONTRIBUTION
5. THE Audit_Log_Schema SHALL include an "entityId" field as nullable UUID for the resource being acted upon
6. THE Audit_Log_Schema SHALL include an "entityType" field as nullable string for the type of entity
7. THE Audit_Log_Schema SHALL include an "ipAddress" field as string for the user's IP address
8. THE Audit_Log_Schema SHALL include a "userAgent" field as string for browser/client information
9. THE Audit_Log_Schema SHALL include a "requestMethod" field as string for HTTP method
10. THE Audit_Log_Schema SHALL include a "requestUrl" field as string for API endpoint path
11. THE Audit_Log_Schema SHALL include a "statusCode" field as integer for HTTP response status
12. THE Audit_Log_Schema SHALL include a "changes" field as JSONB for storing before/after values
13. THE Audit_Log_Schema SHALL include a "metadata" field as JSONB for additional context
14. THE Audit_Log_Schema SHALL include a "createdAt" field as timestamp
15. THE Audit_Log_Schema SHALL create database indexes on: userId, module, action, entityId, and createdAt
16. THE Audit_Log_Schema SHALL use paranoid mode set to false ensuring audit logs are never soft-deleted

### Requirement 3: Database Migration

**User Story:** As a database administrator, I want a migration script for the audit logs table, so that the schema can be deployed consistently across environments.

#### Acceptance Criteria

1. THE Audit_Log_System SHALL provide a migration file that creates the audit_logs table
2. THE Audit_Log_System SHALL provide a migration file that creates indexes for performance optimization
3. THE Audit_Log_System SHALL provide migrations compatible with the existing Sequelize CLI configuration
4. THE Audit_Log_System SHALL provide migrations that are idempotent and safe to run multiple times

### Requirement 4: Audit Log Service - Core Operations

**User Story:** As a developer, I want a service to create and retrieve audit logs programmatically, so that I can track actions throughout the application.

#### Acceptance Criteria

1. THE Audit_Log_Service SHALL provide a createLog method that accepts audit log data and creates a database entry
2. WHEN createLog is invoked, THE Audit_Log_Service SHALL validate required fields: userId, module, action, requestMethod, requestUrl, statusCode
3. WHEN createLog is invoked with valid data, THE Audit_Log_Service SHALL return the created audit log entry
4. THE Audit_Log_Service SHALL provide a findAll method that retrieves audit logs with filtering and pagination
5. THE Audit_Log_Service SHALL provide a findByUser method that retrieves logs for a specific userId with filtering and pagination
6. THE Audit_Log_Service SHALL provide a findByEntity method that retrieves logs for a specific entityType and entityId
7. WHEN any retrieval method is invoked, THE Audit_Log_Service SHALL execute database queries asynchronously

### Requirement 5: Audit Log Service - Filtering and Pagination

**User Story:** As an administrator, I want to filter and search audit logs by various criteria, so that I can find specific user actions quickly.

#### Acceptance Criteria

1. THE Audit_Log_Service SHALL support filtering by userId
2. THE Audit_Log_Service SHALL support filtering by module
3. THE Audit_Log_Service SHALL support filtering by action
4. THE Audit_Log_Service SHALL support filtering by entityType
5. THE Audit_Log_Service SHALL support filtering by entityId
6. THE Audit_Log_Service SHALL support filtering by date range using dateFrom and dateTo parameters
7. THE Audit_Log_Service SHALL support searching by ipAddress
8. THE Audit_Log_Service SHALL support sorting by createdAt, action, and module fields
9. THE Audit_Log_Service SHALL default sorting to createdAt in descending order
10. THE Audit_Log_Service SHALL support pagination with page and limit parameters
11. WHEN pagination parameters are not provided, THE Audit_Log_Service SHALL use default values: page 1, limit 50

### Requirement 6: Audit Log REST API

**User Story:** As an administrator, I want REST API endpoints to retrieve audit logs, so that I can review user activity through the application interface.

#### Acceptance Criteria

1. THE Audit_Log_Controller SHALL expose a GET endpoint at /api/v1/audit-logs
2. THE Audit_Log_Controller SHALL require authentication for all endpoints using AuthGuard
3. THE Audit_Log_Controller SHALL accept query parameters: page, limit, userId, module, action, entityType, entityId, dateFrom, dateTo, search, sortBy, sortOrder
4. WHEN an Admin_User accesses the endpoint, THE Audit_Log_Controller SHALL return all audit logs matching the filters
5. WHEN a Regular_User accesses the endpoint, THE Audit_Log_Controller SHALL return only audit logs where userId matches the authenticated user's ID
6. THE Audit_Log_Controller SHALL use the existing ApiResponse helper for consistent response formatting
7. THE Audit_Log_Controller SHALL include Swagger/OpenAPI documentation for all endpoints
8. WHEN a request is successful, THE Audit_Log_Controller SHALL return HTTP status 200 with paginated results
9. WHEN a request fails validation, THE Audit_Log_Controller SHALL return HTTP status 400 with error details

### Requirement 7: Automatic Audit Logging via Interceptor

**User Story:** As a developer, I want audit logging to happen automatically for all authenticated API calls, so that I don't need to manually add logging code to every endpoint.

#### Acceptance Criteria

1. THE Audit_Interceptor SHALL intercept all authenticated HTTP requests
2. WHEN a request is intercepted, THE Audit_Interceptor SHALL extract userId from the JWT payload
3. WHEN a request is intercepted, THE Audit_Interceptor SHALL extract module name from the request URL path
4. WHEN a request is intercepted, THE Audit_Interceptor SHALL extract IP address using IP_Extractor
5. WHEN a request is intercepted, THE Audit_Interceptor SHALL extract User-Agent header
6. WHEN a request is intercepted, THE Audit_Interceptor SHALL extract HTTP method (GET, POST, PATCH, PUT, DELETE)
7. WHEN a request is intercepted, THE Audit_Interceptor SHALL extract full request URL path
8. WHEN a request completes, THE Audit_Interceptor SHALL capture the HTTP status code from the response
9. THE Audit_Interceptor SHALL invoke Audit_Log_Service.createLog asynchronously to avoid blocking the request
10. THE Audit_Interceptor SHALL skip logging for health check endpoints
11. THE Audit_Interceptor SHALL skip logging for audit-logs endpoints to prevent recursion
12. THE Audit_Interceptor SHALL be registered as a global interceptor in the application module

### Requirement 8: Action Type Determination

**User Story:** As a security analyst, I want action types to be automatically determined from HTTP methods and URL patterns, so that logs accurately reflect the operation performed.

#### Acceptance Criteria

1. WHEN the HTTP method is POST, THE Audit_Interceptor SHALL map Action_Type to CREATE
2. WHEN the HTTP method is PATCH or PUT, THE Audit_Interceptor SHALL map Action_Type to UPDATE
3. WHEN the HTTP method is DELETE, THE Audit_Interceptor SHALL map Action_Type to DELETE
4. WHEN the HTTP method is GET, THE Audit_Interceptor SHALL map Action_Type to VIEW
5. WHEN the request URL matches /auth/login, THE Audit_Interceptor SHALL map Action_Type to LOGIN
6. WHEN the request URL matches /auth/logout, THE Audit_Interceptor SHALL map Action_Type to LOGOUT
7. WHEN the request URL matches /auth/register or /auth/signup, THE Audit_Interceptor SHALL map Action_Type to REGISTER
8. WHEN the request URL contains /forgot-password or /reset-password, THE Audit_Interceptor SHALL map Action_Type to PASSWORD_RESET
9. WHEN the request URL contains /download, THE Audit_Interceptor SHALL map Action_Type to DOWNLOAD
10. WHEN the request URL contains /export, THE Audit_Interceptor SHALL map Action_Type to EXPORT
11. WHEN the request URL contains /payment or /pay, THE Audit_Interceptor SHALL map Action_Type to PAYMENT
12. WHEN the request URL contains /contribution, THE Audit_Interceptor SHALL map Action_Type to CONTRIBUTION
13. WHEN the request URL contains /mark-read or /mark-as-read, THE Audit_Interceptor SHALL map Action_Type to MARK_READ

### Requirement 9: IP Address and User Agent Extraction

**User Story:** As a security analyst, I want accurate IP addresses and user agent information captured, so that I can identify suspicious access patterns.

#### Acceptance Criteria

1. THE IP_Extractor SHALL check the X-Forwarded-For header first when extracting IP addresses
2. WHEN X-Forwarded-For header contains multiple IPs, THE IP_Extractor SHALL use the leftmost IP address
3. WHEN X-Forwarded-For header is not present, THE IP_Extractor SHALL use the X-Real-IP header
4. WHEN neither X-Forwarded-For nor X-Real-IP headers are present, THE IP_Extractor SHALL use the socket remote address
5. THE Audit_Interceptor SHALL extract the User-Agent header value from the request
6. WHEN User-Agent header is not present, THE Audit_Interceptor SHALL store "Unknown" as the userAgent value
7. THE Audit_Interceptor SHALL store the extracted IP address in the ipAddress field of the audit log
8. THE Audit_Interceptor SHALL store the extracted User-Agent in the userAgent field of the audit log

### Requirement 10: Entity Identification

**User Story:** As an auditor, I want audit logs to include the specific entity being acted upon, so that I can track the history of individual resources.

#### Acceptance Criteria

1. WHEN a request URL contains a UUID path parameter, THE Audit_Interceptor SHALL extract it as entityId
2. WHEN a request URL matches pattern /api/v1/bills/:id, THE Audit_Interceptor SHALL set entityType to "Bill"
3. WHEN a request URL matches pattern /api/v1/transactions/:id, THE Audit_Interceptor SHALL set entityType to "Transaction"
4. WHEN a request URL matches pattern /api/v1/users/:id, THE Audit_Interceptor SHALL set entityType to "User"
5. WHEN a request URL matches pattern /api/v1/budgets/:id, THE Audit_Interceptor SHALL set entityType to "Budget"
6. WHEN a request URL matches pattern /api/v1/documents/:id, THE Audit_Interceptor SHALL set entityType to "Document"
7. WHEN a request URL matches pattern /api/v1/notifications/:id, THE Audit_Interceptor SHALL set entityType to "Notification"
8. WHEN a request URL matches pattern /api/v1/saving-goals/:id, THE Audit_Interceptor SHALL set entityType to "SavingGoal"
9. WHEN a request URL matches pattern /api/v1/wallets/:id, THE Audit_Interceptor SHALL set entityType to "Wallet"
10. WHEN a request URL matches pattern /api/v1/categories/:id, THE Audit_Interceptor SHALL set entityType to "Category"
11. WHEN entityId cannot be extracted from the URL, THE Audit_Interceptor SHALL set entityId to null
12. WHEN entityType cannot be determined from the URL, THE Audit_Interceptor SHALL set entityType to null

### Requirement 11: Changes Tracking for Updates

**User Story:** As a compliance officer, I want to see what changed during UPDATE operations, so that I can verify data integrity and audit modifications.

#### Acceptance Criteria

1. WHERE the Changes_Tracker is implemented, WHEN an UPDATE action is logged, THE Changes_Tracker SHALL capture the before state of the entity
2. WHERE the Changes_Tracker is implemented, WHEN an UPDATE action is logged, THE Changes_Tracker SHALL capture the after state of the entity
3. WHERE the Changes_Tracker is implemented, THE Changes_Tracker SHALL store before/after values in the changes JSONB field
4. WHERE the Changes_Tracker is implemented, THE Changes_Tracker SHALL format changes as: {"before": {...}, "after": {...}}
5. WHERE the Changes_Tracker is implemented, WHEN changes cannot be captured, THE Changes_Tracker SHALL set the changes field to null
6. WHERE the Changes_Tracker is not implemented, THE Audit_Interceptor SHALL set the changes field to null for all actions

### Requirement 12: Error Handling and Graceful Degradation

**User Story:** As a system administrator, I want audit logging failures to not disrupt the application, so that users can continue working even if audit logging fails.

#### Acceptance Criteria

1. WHEN the Audit_Log_Service.createLog method fails, THE Audit_Interceptor SHALL log the error using Pino_Logger
2. WHEN the Audit_Log_Service.createLog method fails, THE Audit_Interceptor SHALL allow the original HTTP request to complete successfully
3. WHEN database connection fails during audit log creation, THE Audit_Interceptor SHALL catch the exception and log it
4. WHEN any error occurs during audit logging, THE Audit_Interceptor SHALL not propagate the error to the client
5. THE Audit_Interceptor SHALL wrap all audit logging operations in try-catch blocks
6. WHEN audit logging fails, THE Pino_Logger SHALL log the failure with error level and include the original request context
7. THE Audit_Log_System SHALL continue accepting new log requests even after previous failures

### Requirement 13: Performance and Asynchronous Operations

**User Story:** As a performance engineer, I want audit logging to be non-blocking, so that it doesn't slow down API response times.

#### Acceptance Criteria

1. THE Audit_Interceptor SHALL execute Audit_Log_Service.createLog asynchronously without awaiting the result
2. THE Audit_Log_Service SHALL use database connection pooling for efficient query execution
3. THE Audit_Interceptor SHALL not delay the HTTP response while waiting for audit log creation
4. WHEN multiple audit logs are created simultaneously, THE Audit_Log_Service SHALL handle concurrent writes safely
5. THE Audit_Log_Schema database indexes SHALL optimize query performance for common filter combinations
6. THE Audit_Log_Service retrieval methods SHALL use database-level pagination to limit memory usage
7. WHEN retrieving large result sets, THE Audit_Log_Service SHALL return only the requested page of results

### Requirement 14: Module-Specific Action Tracking

**User Story:** As a product manager, I want to see which actions are performed on each module, so that I can understand feature usage patterns.

#### Acceptance Criteria

1. WHEN a bills API is accessed, THE Audit_Interceptor SHALL set module to "bills"
2. WHEN a transactions API is accessed, THE Audit_Interceptor SHALL set module to "transactions"
3. WHEN a users API is accessed, THE Audit_Interceptor SHALL set module to "users"
4. WHEN an auth API is accessed, THE Audit_Interceptor SHALL set module to "auth"
5. WHEN a documents API is accessed, THE Audit_Interceptor SHALL set module to "documents"
6. WHEN a budgets API is accessed, THE Audit_Interceptor SHALL set module to "budgets"
7. WHEN a notifications API is accessed, THE Audit_Interceptor SHALL set module to "notifications"
8. WHEN a saving-goals API is accessed, THE Audit_Interceptor SHALL set module to "saving-goals"
9. WHEN a wallets API is accessed, THE Audit_Interceptor SHALL set module to "wallets"
10. WHEN a categories API is accessed, THE Audit_Interceptor SHALL set module to "categories"
11. WHEN a dashboard API is accessed, THE Audit_Interceptor SHALL set module to "dashboard"
12. WHEN a reports API is accessed, THE Audit_Interceptor SHALL set module to "reports"

### Requirement 15: Integration with Existing Modules

**User Story:** As a developer, I want audit logging to work seamlessly with existing modules, so that I don't need to modify controller code.

#### Acceptance Criteria

1. THE Audit_Log_System SHALL integrate with all existing module controllers without requiring code changes
2. THE Audit_Interceptor SHALL be applied globally via the APP_INTERCEPTOR provider
3. THE Audit_Interceptor SHALL respect the existing AuthGuard authentication mechanism
4. WHEN an unauthenticated request is made, THE Audit_Interceptor SHALL skip audit logging
5. WHEN a public endpoint decorated with @Public is accessed, THE Audit_Interceptor SHALL skip audit logging
6. THE Audit_Log_System SHALL use the existing database connection from DatabaseModule
7. THE Audit_Log_System SHALL be compatible with the existing Sequelize ORM configuration
8. THE Audit_Log_System SHALL be compatible with the existing JWT authentication flow

### Requirement 16: Parser and Pretty Printer for Audit Log Queries

**User Story:** As a developer, I want to parse and format audit log query filters, so that API consumers can construct complex queries correctly.

#### Acceptance Criteria

1. THE Audit_Log_Controller SHALL parse query string parameters into a structured filter object
2. THE Audit_Log_Controller SHALL validate query parameters using DTO validation
3. WHEN invalid query parameters are provided, THE Audit_Log_Controller SHALL return a descriptive error message
4. THE Audit_Log_Controller SHALL transform filter DTOs into Sequelize query options
5. FOR ALL valid filter DTOs, parsing then executing then formatting the results SHALL produce consistent output (round-trip property)
6. THE Audit_Log_Service SHALL format query results into a standardized response structure
7. THE Audit_Log_Service SHALL include pagination metadata in query responses: total, page, limit, totalPages

### Requirement 17: Configuration and Environment Support

**User Story:** As a DevOps engineer, I want audit logging to be configurable per environment, so that I can adjust logging behavior for development, staging, and production.

#### Acceptance Criteria

1. THE Pino_Logger SHALL read log level from environment variable LOG_LEVEL
2. WHEN LOG_LEVEL is not set, THE Pino_Logger SHALL default to "info" level
3. WHEN NODE_ENV is "development", THE Pino_Logger SHALL enable pino-pretty formatting
4. WHEN NODE_ENV is "production", THE Pino_Logger SHALL output raw JSON without pretty printing
5. THE Audit_Log_System SHALL respect the existing database configuration from environment variables
6. WHERE retention policy is implemented, THE Audit_Log_System SHALL read retention period from environment variable AUDIT_LOG_RETENTION_DAYS
7. WHERE batch inserts are implemented, THE Audit_Log_System SHALL read batch size from environment variable AUDIT_LOG_BATCH_SIZE

### Requirement 18: Metadata Capture for Additional Context

**User Story:** As a security analyst, I want to capture additional context in audit logs, so that I can investigate incidents with complete information.

#### Acceptance Criteria

1. THE Audit_Interceptor SHALL capture Request_Correlation_ID in the metadata field
2. THE Audit_Interceptor SHALL capture request processing duration in milliseconds in the metadata field
3. WHERE available, THE Audit_Interceptor SHALL capture the session ID from the JWT payload in the metadata field
4. WHERE available, THE Audit_Interceptor SHALL capture selected request body fields in the metadata field (excluding sensitive data)
5. THE Audit_Interceptor SHALL not capture passwords, tokens, or other sensitive data in metadata
6. THE Audit_Interceptor SHALL format metadata as a JSON object with descriptive keys
7. WHEN no additional metadata is available, THE Audit_Interceptor SHALL set metadata to null or an empty object
