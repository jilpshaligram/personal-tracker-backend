# Implementation Plan: Comprehensive Audit Logging

## Overview

This implementation plan converts the comprehensive audit logging design into actionable coding tasks. The system will automatically track all authenticated user actions using a NestJS interceptor, Pino structured logging, and Sequelize ORM for persistent storage. Implementation follows an incremental approach, building core infrastructure first, then adding intelligent extraction logic, and finally wiring everything together.

## Tasks

- [x] 1. Install dependencies and configure Pino logger
  - Install pino and pino-pretty packages
  - Create LoggerModule and LoggerService with environment-specific configuration
  - Configure structured JSON output with correlation IDs
  - Enable pino-pretty for development, raw JSON for production
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 17.1, 17.2, 17.3, 17.4_

- [ ]* 1.1 Write property test for structured JSON logging
  - **Property 16: Structured JSON Logging** - For any log message, output should be valid JSON
  - **Validates: Requirements 1.2**

- [x] 2. Create audit log schema and migration
  - [x] 2.1 Create ActionType enum with all action values
    - Define enum: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, PAYMENT, EXPORT, REGISTER, PASSWORD_RESET, MARK_READ, DOWNLOAD, CONTRIBUTION
    - _Requirements: 2.4_
  
  - [x] 2.2 Create AuditLog Sequelize model with all fields
    - Define UUID primary key, foreign key to User
    - Add fields: userId, module, action, entityId, entityType, ipAddress, userAgent, requestMethod, requestUrl, statusCode
    - Add JSONB fields: changes, metadata
    - Add timestamps: createdAt, updatedAt
    - Configure paranoid mode to false
    - Define indexes: userId, module, action, entityId, createdAt, composite (userId, module, createdAt)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15, 2.16_
  
  - [x] 2.3 Create database migration for audit_logs table
    - Create migration file with up/down methods
    - Add table creation with all columns and constraints
    - Add foreign key constraint to users table
    - Create performance indexes
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 2.4 Write property test for audit log creation round-trip
  - **Property 1: Audit Log Creation Round-Trip** - Creating and retrieving by ID should preserve all fields
  - **Validates: Requirements 4.1, 4.3**

- [x] 3. Implement audit log service with CRUD operations
  - [x] 3.1 Create CreateAuditLogDto with validation
    - Define DTO with all required and optional fields
    - Add class-validator decorators for: UUID format, enum values, required fields
    - _Requirements: 4.2_
  
  - [x] 3.2 Create AuditLogFilterDto for query parameters
    - Define filter fields: page, limit, userId, module, action, entityType, entityId, dateFrom, dateTo, search, sortBy, sortOrder
    - Add validation for: positive integers, UUID format, ISO dates, enum values
    - Set default values: page=1, limit=50, sortBy=createdAt, sortOrder=desc
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 16.1, 16.2, 16.3_
  
  - [x] 3.3 Implement AuditLogService.createLog method
    - Accept CreateAuditLogDto parameter
    - Validate required fields
    - Create database entry using Sequelize model
    - Return created audit log
    - Wrap in try-catch for error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.7_
  
  - [x] 3.4 Implement AuditLogService query methods
    - Implement findAll with filtering, pagination, and sorting
    - Implement findByUser with userId enforcement
    - Implement findByEntity with entityType and entityId filtering
    - Transform Sequelize results to include pagination metadata
    - Use database-level pagination for efficiency
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 5.1-5.11, 13.6, 13.7, 16.4, 16.6, 16.7_

- [ ]* 3.5 Write property tests for service validation and filtering
  - **Property 2: Required Field Validation** - Missing required fields should be rejected
  - **Property 3: Query Filtering Correctness** - All results should match specified filters
  - **Property 14: Pagination Consistency** - Items across pages should equal total count
  - **Validates: Requirements 4.2, 4.4, 4.5, 4.6, 5.1-5.11**

- [x] 4. Create helper utilities for extraction logic
  - [x] 4.1 Create IP extraction utility function
    - Check X-Forwarded-For header first (use leftmost IP if multiple)
    - Fallback to X-Real-IP header
    - Fallback to socket remote address
    - Return "unknown" if none available
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [x] 4.2 Create module name extractor
    - Extract module from URL pattern: /api/v1/{module}/...
    - Return "unknown" if pattern doesn't match
    - _Requirements: 7.3, 14.1-14.12_
  
  - [x] 4.3 Create entity information extractor
    - Extract UUID from URL path parameters
    - Map URL patterns to entity types (bills→Bill, transactions→Transaction, etc.)
    - Return { entityType, entityId } with null values if not found
    - Support all entity types: Bill, Transaction, User, Budget, Document, Notification, SavingGoal, Wallet, Category
    - _Requirements: 10.1-10.12_
  
  - [x] 4.4 Create action type determiner
    - Map HTTP methods: POST→CREATE, PATCH/PUT→UPDATE, DELETE→DELETE, GET→VIEW
    - Override for URL patterns: /auth/login→LOGIN, /auth/logout→LOGOUT, /auth/register→REGISTER, etc.
    - Support all special actions: PASSWORD_RESET, DOWNLOAD, EXPORT, PAYMENT, CONTRIBUTION, MARK_READ
    - _Requirements: 8.1-8.13_

- [ ]* 4.5 Write property tests for extraction logic
  - **Property 6: Request Data Extraction Accuracy** - All extracted data should match request
  - **Property 7: IP Address Extraction Priority** - Correct priority order should be followed
  - **Validates: Requirements 7.2-7.7, 9.1-9.8**

- [x] 5. Checkpoint - Verify core services work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement audit interceptor with request capture
  - [x] 6.1 Create AuditInterceptor class
    - Implement NestJS interceptor interface
    - Inject AuditLogService and LoggerService
    - Use RxJS tap operator for side effects
    - _Requirements: 7.1, 7.12_
  
  - [x] 6.2 Add request context extraction logic
    - Extract userId from authenticated request (JWT payload)
    - Extract module name using helper
    - Extract IP address using helper
    - Extract user agent from headers (default to "Unknown")
    - Extract HTTP method and full URL
    - Skip unauthenticated requests
    - Skip requests to @Public endpoints
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.5, 9.6, 15.4, 15.5_
  
  - [x] 6.3 Add response capture and audit log creation
    - Capture HTTP status code from response
    - Determine action type using helper
    - Extract entity information using helper
    - Build metadata object with correlation ID and duration
    - Asynchronously call AuditLogService.createLog (fire-and-forget, no await)
    - _Requirements: 7.8, 7.9, 18.1, 18.2, 18.6_
  
  - [x] 6.4 Add exclusion logic for specific endpoints
    - Skip health check endpoints
    - Skip /audit-logs endpoints to prevent recursion
    - _Requirements: 7.10, 7.11_
  
  - [x] 6.5 Add comprehensive error handling
    - Wrap all audit logic in try-catch blocks
    - Log errors using Pino without propagating to client
    - Ensure original request always completes successfully
    - Include request context in error logs
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ]* 6.6 Write property tests for interceptor behavior
  - **Property 8: Authenticated Requests Create Audit Logs** - All authenticated requests should create logs
  - **Property 9: Excluded Endpoints Skip Logging** - Health/audit endpoints should not create logs
  - **Property 10: Unauthenticated Requests Skip Logging** - Public endpoints should not create logs
  - **Property 12: Error Handling Graceful Degradation** - Audit failures should not disrupt requests
  - **Property 13: Async Non-Blocking Logging** - Response time should not be impacted
  - **Validates: Requirements 7.1, 7.8, 7.9, 7.10, 7.11, 12.1-12.7, 13.1, 13.3, 15.4, 15.5**

- [x] 7. Create audit log controller with REST endpoints
  - [x] 7.1 Create AuditLogController with GET endpoint
    - Define GET /api/v1/audit-logs endpoint
    - Apply AuthGuard to require authentication
    - Accept query parameters using AuditLogFilterDto
    - Add Swagger/OpenAPI decorators for documentation
    - _Requirements: 6.1, 6.2, 6.3, 6.7_
  
  - [x] 7.2 Implement authorization logic
    - Extract user from authenticated request
    - For admin users: allow access to all logs
    - For regular users: enforce userId filter to match authenticated user
    - _Requirements: 6.4, 6.5_
  
  - [x] 7.3 Implement response formatting
    - Call AuditLogService with filters
    - Use ApiResponse helper for consistent response structure
    - Return HTTP 200 on success with paginated results
    - Return HTTP 400 on validation errors
    - Return HTTP 401 on authentication failure
    - _Requirements: 6.6, 6.8, 6.9, 16.5, 16.6, 16.7_

- [ ]* 7.4 Write property tests for controller authorization
  - **Property 4: User-Specific Query Isolation** - Regular users only see own logs
  - **Property 5: Admin Full Access** - Admin users see all logs
  - **Property 11: Authentication Requirement** - Unauthenticated requests get 401
  - **Validates: Requirements 6.2, 6.4, 6.5**

- [ ]* 7.5 Write unit tests for controller endpoints
  - Test query parameter parsing
  - Test response format validation
  - Test Swagger documentation completeness
  - _Requirements: 6.1, 6.3, 6.7_

- [x] 8. Register audit interceptor globally
  - [x] 8.1 Update AuditLogsModule to export services
    - Export AuditLogService for use by interceptor
    - Import LoggerModule for structured logging
    - _Requirements: 15.6, 15.7_
  
  - [x] 8.2 Register AuditInterceptor as global provider in AppModule
    - Add APP_INTERCEPTOR provider with AuditInterceptor
    - Ensure AuditLogsModule is imported
    - Verify integration with existing AuthGuard
    - _Requirements: 7.12, 15.1, 15.2, 15.3, 15.8_

- [x] 9. Final checkpoint and integration verification
  - Run database migrations
  - Start application and verify no errors
  - Make authenticated API calls to various modules
  - Query audit logs to verify entries were created
  - Test filtering, pagination, and sorting
  - Verify admin and regular user authorization
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP delivery
- Each implementation task references specific requirements for traceability
- The interceptor uses fire-and-forget async logging to avoid blocking requests
- Changes tracking (Requirement 11) is intentionally omitted as it requires deeper integration with each module
- Correlation IDs depend on existing request context infrastructure
- Property tests use fast-check library with minimum 100 iterations per property
- Two checkpoints ensure incremental validation at logical breakpoints
