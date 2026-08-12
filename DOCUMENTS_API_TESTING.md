# Documents API Testing Guide

## Overview
The Documents API allows users to upload, manage, and track important documents with expiry dates and reminders. Documents are stored in Cloudinary and metadata is stored in the database.

**Base URL:** `http://localhost:3000/api/v1/documents`

**Authentication:** All endpoints require a valid JWT access token in the Authorization header.

---

## Prerequisites

### 1. Get Access Token
First, login to get your access token:

```http
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Seed Document Categories
Run the seeder to populate document categories:

```bash
npm run seed:document-categories
```

This creates 48 predefined categories including:
- Identity Documents (Passport, PAN Card, Aadhaar, etc.)
- Financial Documents (Bank Statements, Tax Returns, etc.)
- Insurance Documents (Life, Health, Vehicle, etc.)
- Property & Vehicle Documents
- Medical Records
- Legal Documents
- Educational Certificates
- Employment Documents
- Utility Bills
- Receipts & Warranties

### 3. Get Category IDs
Query your database to get category IDs:

```sql
SELECT id, name FROM document_categories ORDER BY id;
```

---

## API Endpoints

### 1. Upload New Document

**Endpoint:** `POST /api/v1/documents`

**Content-Type:** `multipart/form-data`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Form Data Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF file (max 5MB) |
| `categoryId` | Number | Yes | Document category ID from database |
| `title` | String | Yes | Document title/name |
| `expiryDate` | String | Yes | Expiry date (YYYY-MM-DD format) |
| `reminderDaysBefore` | Number | Yes | Days before expiry to send reminder (min: 1) |

**Example using cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/document.pdf" \
  -F "categoryId=1" \
  -F "title=Passport - John Doe" \
  -F "expiryDate=2030-12-31" \
  -F "reminderDaysBefore=30"
```

**Example using Postman:**
1. Method: POST
2. URL: `http://localhost:3000/api/v1/documents`
3. Headers: `Authorization: Bearer YOUR_TOKEN`
4. Body: Select "form-data"
   - Key: `file`, Type: File, Value: Select PDF file
   - Key: `categoryId`, Type: Text, Value: `1`
   - Key: `title`, Type: Text, Value: `Passport - John Doe`
   - Key: `expiryDate`, Type: Text, Value: `2030-12-31`
   - Key: `reminderDaysBefore`, Type: Text, Value: `30`

**Success Response (201):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryId": 1,
    "title": "Passport - John Doe",
    "expiryDate": "2030-12-31",
    "reminderDaysBefore": 30,
    "fileUrl": "https://res.cloudinary.com/your-cloud/...",
    "filePublicId": "documents/abc123",
    "createdAt": "2026-08-06T10:30:00.000Z",
    "updatedAt": "2026-08-06T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 - Missing File:**
```json
{
  "success": false,
  "message": "PDF file is required",
  "errors": []
}
```

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "categoryId",
      "message": "Category ID must be a positive number"
    }
  ]
}
```

**401 - Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired access token",
  "errors": []
}
```

---

### 2. Get All Documents

**Endpoint:** `GET /api/v1/documents`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Example Request:**
```http
GET http://localhost:3000/api/v1/documents
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": [
    {
      "id": 1,
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "categoryId": 1,
      "title": "Passport - John Doe",
      "expiryDate": "2030-12-31",
      "reminderDaysBefore": 30,
      "fileUrl": "https://res.cloudinary.com/...",
      "filePublicId": "documents/abc123",
      "createdAt": "2026-08-06T10:30:00.000Z",
      "updatedAt": "2026-08-06T10:30:00.000Z"
    },
    {
      "id": 2,
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "categoryId": 4,
      "title": "PAN Card",
      "expiryDate": "2099-12-31",
      "reminderDaysBefore": 90,
      "fileUrl": "https://res.cloudinary.com/...",
      "filePublicId": "documents/def456",
      "createdAt": "2026-08-06T11:00:00.000Z",
      "updatedAt": "2026-08-06T11:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Single Document

**Endpoint:** `GET /api/v1/documents/:id`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Example Request:**
```http
GET http://localhost:3000/api/v1/documents/1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "id": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryId": 1,
    "title": "Passport - John Doe",
    "expiryDate": "2030-12-31",
    "reminderDaysBefore": 30,
    "fileUrl": "https://res.cloudinary.com/...",
    "filePublicId": "documents/abc123",
    "createdAt": "2026-08-06T10:30:00.000Z",
    "updatedAt": "2026-08-06T10:30:00.000Z"
  }
}
```

**Error Responses:**

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Document not found",
  "errors": []
}
```

**403 - Forbidden:**
```json
{
  "success": false,
  "message": "You don't have access to this document",
  "errors": []
}
```

---

### 4. Update Document

**Endpoint:** `PATCH /api/v1/documents/:id`

**Content-Type:** `multipart/form-data`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Form Data Fields (All Optional):**
| Field | Type | Description |
|-------|------|-------------|
| `file` | File | New PDF file (replaces old one in Cloudinary) |
| `categoryId` | Number | New category ID |
| `title` | String | New title |
| `expiryDate` | String | New expiry date (YYYY-MM-DD) |
| `reminderDaysBefore` | Number | New reminder days |

**Example - Update Title Only:**
```bash
curl -X PATCH http://localhost:3000/api/v1/documents/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "title=Passport - John Doe (Renewed)"
```

**Example - Update File and Expiry:**
```bash
curl -X PATCH http://localhost:3000/api/v1/documents/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/new-document.pdf" \
  -F "expiryDate=2035-12-31"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": 1,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "categoryId": 1,
    "title": "Passport - John Doe (Renewed)",
    "expiryDate": "2035-12-31",
    "reminderDaysBefore": 30,
    "fileUrl": "https://res.cloudinary.com/.../new-file",
    "filePublicId": "documents/xyz789",
    "createdAt": "2026-08-06T10:30:00.000Z",
    "updatedAt": "2026-08-06T12:45:00.000Z"
  }
}
```

---

### 5. Delete Document

**Endpoint:** `DELETE /api/v1/documents/:id`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Example Request:**
```http
DELETE http://localhost:3000/api/v1/documents/1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": null
}
```

**Note:** This permanently deletes the document from both the database and Cloudinary.

---

## Testing Scenarios

### Test Case 1: Complete Document Lifecycle

```bash
# 1. Create document
POST /api/v1/documents
- Upload: passport.pdf
- categoryId: 1 (Passport & Visa)
- title: "Passport - Jane Smith"
- expiryDate: "2031-06-15"
- reminderDaysBefore: 60

# 2. Verify creation
GET /api/v1/documents/1

# 3. Update title
PATCH /api/v1/documents/1
- title: "Passport - Jane Smith (Updated)"

# 4. Get all documents
GET /api/v1/documents

# 5. Delete document
DELETE /api/v1/documents/1

# 6. Verify deletion (should get 404)
GET /api/v1/documents/1
```

### Test Case 2: Multiple Documents Across Categories

```bash
# Upload Passport
POST /api/v1/documents
- categoryId: 1 (Passport & Visa)
- title: "Passport"
- expiryDate: "2030-12-31"

# Upload PAN Card
POST /api/v1/documents
- categoryId: 4 (PAN Card)
- title: "Permanent Account Number Card"
- expiryDate: "2099-12-31"

# Upload Health Insurance
POST /api/v1/documents
- categoryId: 14 (Health Insurance)
- title: "Star Health Policy"
- expiryDate: "2027-03-31"

# List all
GET /api/v1/documents
```

### Test Case 3: File Replacement

```bash
# 1. Upload initial document
POST /api/v1/documents
- file: old-passport.pdf

# 2. Replace with new scanned copy
PATCH /api/v1/documents/1
- file: new-passport-scan.pdf
```

---

## Common Test Data

### Sample Document Categories (from seeder)

| ID | Category Name | Example Use Case |
|----|---------------|------------------|
| 1 | Identity Documents | General identity docs |
| 2 | Passport & Visa | Travel documents |
| 3 | Driving License | Vehicle license |
| 4 | PAN Card | Tax identification |
| 5 | Aadhaar Card | National ID |
| 7 | Bank Statements | Monthly statements |
| 11 | Tax Returns (ITR) | Annual tax filings |
| 13 | Life Insurance | Life policies |
| 14 | Health Insurance | Medical policies |
| 19 | Property Documents | Property papers |
| 23 | Medical Records | Health reports |
| 31 | Educational Certificates | Degrees, diplomas |

### Sample Dates

- **Past expiry (should still accept):** `2025-01-01`
- **Current year:** `2026-12-31`
- **Future (5 years):** `2031-08-06`
- **Far future (permanent docs):** `2099-12-31`

### Sample Reminder Days

- Short notice: `7` days
- Standard: `30` days
- Long notice: `90` days
- Very long: `180` days

---

## Validation Rules

### File Validation
- **Format:** PDF only
- **Max size:** 5 MB
- **Required:** Yes (on create)

### Field Validation
- **categoryId:** Positive integer, must exist in database
- **title:** String, min 1 character (after trim)
- **expiryDate:** String in `YYYY-MM-DD` format
- **reminderDaysBefore:** Integer, minimum 1

---

## Error Handling

### Common HTTP Status Codes
- `200` - Success (GET, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Bad Request (validation errors, missing file)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (accessing other user's document)
- `404` - Not Found (document doesn't exist)
- `500` - Internal Server Error

---

## Notes

1. **File Storage:** Files are uploaded to Cloudinary. When updating with a new file, the old file is automatically deleted from Cloudinary.

2. **User Isolation:** Users can only access their own documents. Attempting to access another user's document returns 403.

3. **Expiry Reminders:** The system has a background job that checks for expiring documents and sends reminders based on `reminderDaysBefore`.

4. **Category Validation:** The `categoryId` must reference an existing category. Invalid IDs will fail validation.

5. **Date Format:** Always use `YYYY-MM-DD` format for expiry dates.

---

## Troubleshooting

### "PDF file is required"
- Ensure you're using `multipart/form-data`
- File field name must be exactly `file`
- File must be a PDF

### "Category ID must be a positive number"
- Run the category seeder first
- Query database to get valid category IDs
- Ensure categoryId is a number, not a string

### 401 Unauthorized
- Get a fresh access token (expires after 10 minutes)
- Include `Authorization: Bearer <token>` header
- Check token format (should start with `eyJ`)

### File too large
- Maximum file size is 5 MB
- Compress PDF before uploading
- Check multer configuration if limit needs adjustment

---

## Quick Start Commands

```bash
# Seed categories
npm run seed:document-categories

# Start server
npm run start:dev

# Login and copy access token
# Then use Postman/Insomnia/cURL to test endpoints
```

---

**End of Document API Testing Guide**


---

# Document Categories API

## Overview
The Document Categories API allows management of document categories. Categories are used to organize documents (e.g., Passport & Visa, Bank Statements, Insurance, etc.).

**Base URL:** `http://localhost:3000/api/v1/document-category`

**Authentication:** All endpoints require a valid JWT access token.

---

## API Endpoints

### 1. Get All Document Categories

**Endpoint:** `GET /api/v1/document-category`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Example Request:**
```http
GET http://localhost:3000/api/v1/document-category
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document categories retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Identity Documents",
      "createdAt": "2026-08-06T08:00:00.000Z",
      "updatedAt": "2026-08-06T08:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Passport & Visa",
      "createdAt": "2026-08-06T08:00:00.000Z",
      "updatedAt": "2026-08-06T08:00:00.000Z"
    },
    {
      "id": 3,
      "name": "Driving License",
      "createdAt": "2026-08-06T08:00:00.000Z",
      "updatedAt": "2026-08-06T08:00:00.000Z"
    }
  ]
}
```

**Use Case:**
- Display categories in a dropdown when creating/editing documents
- Show category list in the UI for filtering documents

---

### 2. Get Single Document Category

**Endpoint:** `GET /api/v1/document-category/:id`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Example Request:**
```http
GET http://localhost:3000/api/v1/document-category/1
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document category retrieved successfully",
  "data": {
    "id": 1,
    "name": "Identity Documents",
    "createdAt": "2026-08-06T08:00:00.000Z",
    "updatedAt": "2026-08-06T08:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Document category not found",
  "errors": []
}
```

---

### 3. Create Document Category

**Endpoint:** `POST /api/v1/document-category`

**Headers:**
- `Authorization: Bearer <your-access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Custom Category"
}
```

**Example Request:**
```http
POST http://localhost:3000/api/v1/document-category
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Birth Certificates"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Document category created successfully",
  "data": {
    "id": 49,
    "name": "Birth Certificates",
    "createdAt": "2026-08-06T10:30:00.000Z",
    "updatedAt": "2026-08-06T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Category name is required"
    }
  ]
}
```

**409 - Duplicate Category:**
```json
{
  "success": false,
  "message": "Category name already exists",
  "errors": []
}
```

---

### 4. Update Document Category

**Endpoint:** `PATCH /api/v1/document-category/:id`

**Headers:**
- `Authorization: Bearer <your-access-token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Updated Category Name"
}
```

**Example Request:**
```http
PATCH http://localhost:3000/api/v1/document-category/49
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Birth & Marriage Certificates"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document category updated successfully",
  "data": {
    "id": 49,
    "name": "Birth & Marriage Certificates",
    "createdAt": "2026-08-06T10:30:00.000Z",
    "updatedAt": "2026-08-06T11:15:00.000Z"
  }
}
```

**Error Responses:**

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Document category not found",
  "errors": []
}
```

**409 - Duplicate Name:**
```json
{
  "success": false,
  "message": "Category name already exists",
  "errors": []
}
```

---

### 5. Delete Document Category

**Endpoint:** `DELETE /api/v1/document-category/:id`

**Headers:**
- `Authorization: Bearer <your-access-token>`

**Example Request:**
```http
DELETE http://localhost:3000/api/v1/document-category/49
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Document category deleted successfully",
  "data": null
}
```

**Error Responses:**

**404 - Not Found:**
```json
{
  "success": false,
  "message": "Document category not found",
  "errors": []
}
```

**400 - Category In Use:**
```json
{
  "success": false,
  "message": "Cannot delete category with existing documents",
  "errors": []
}
```

---

## Testing Scenarios

### Test Case 1: Complete Category Management

```bash
# 1. Get all categories (seeded data)
GET /api/v1/document-category

# 2. Create new custom category
POST /api/v1/document-category
Body: { "name": "Marriage Certificates" }

# 3. Get the new category by ID
GET /api/v1/document-category/49

# 4. Update category name
PATCH /api/v1/document-category/49
Body: { "name": "Marriage & Birth Certificates" }

# 5. Verify update
GET /api/v1/document-category/49

# 6. Delete category (only if no documents use it)
DELETE /api/v1/document-category/49

# 7. Verify deletion (should return 404)
GET /api/v1/document-category/49
```

### Test Case 2: Category Usage with Documents

```bash
# 1. Create a custom category
POST /api/v1/document-category
Body: { "name": "Test Category" }
Response: { "id": 50, ... }

# 2. Create a document using this category
POST /api/v1/documents
Form Data:
- file: test.pdf
- categoryId: 50
- title: "Test Document"
- expiryDate: "2030-12-31"
- reminderDaysBefore: 30

# 3. Try to delete category (should fail - category in use)
DELETE /api/v1/document-category/50
Expected: 400 error

# 4. Delete the document first
DELETE /api/v1/documents/1

# 5. Now delete the category (should succeed)
DELETE /api/v1/document-category/50
```

### Test Case 3: Validation Tests

```bash
# Test empty name (should fail)
POST /api/v1/document-category
Body: { "name": "" }
Expected: 400 - "Category name is required"

# Test whitespace only (should fail)
POST /api/v1/document-category
Body: { "name": "   " }
Expected: 400 - "Category name is required"

# Test duplicate name (should fail)
POST /api/v1/document-category
Body: { "name": "Passport & Visa" }
Expected: 409 - "Category name already exists"

# Test valid name (should succeed)
POST /api/v1/document-category
Body: { "name": "Custom Documents" }
Expected: 201 - Success
```

---

## Validation Rules

### Name Field
- **Type:** String
- **Required:** Yes
- **Trimmed:** Yes (leading/trailing whitespace removed)
- **Min Length:** 1 character (after trimming)
- **Unique:** Yes (case-sensitive)

---

## Pre-seeded Categories

The seeder (`npm run seed:document-categories`) creates 48 categories:

### Identity & Personal (IDs 1-6)
1. Identity Documents
2. Passport & Visa
3. Driving License
4. PAN Card
5. Aadhaar Card
6. Voter ID

### Financial (IDs 7-13)
7. Bank Statements
8. Investment Documents
9. Loan Documents
10. Credit Card Statements
11. Tax Returns (ITR)
12. Form 16 / Salary Slips
13. Provident Fund (PF)

### Insurance (IDs 14-18)
14. Life Insurance
15. Health Insurance
16. Vehicle Insurance
17. Home Insurance
18. Travel Insurance

### Property & Assets (IDs 19-22)
19. Property Documents
20. Vehicle Documents
21. Rental Agreements
22. Sale Deeds

### Medical (IDs 23-26)
23. Medical Records
24. Prescriptions
25. Health Reports
26. Vaccination Records

### Legal (IDs 27-31)
27. Legal Contracts
28. Court Documents
29. Affidavits
30. Power of Attorney
31. Wills & Nominations

### Education (IDs 32-35)
32. Educational Certificates
33. Marksheets
34. Admission Letters
35. Scholarship Documents

### Employment & Business (IDs 36-40)
36. Employment Documents
37. Offer Letters
38. Experience Letters
39. Business Registration
40. GST Documents

### Utilities (IDs 41-44)
41. Utility Bills
42. Mobile & Internet Bills
43. Electricity Bills
44. Water Bills

### Miscellaneous (IDs 45-48)
45. Receipts & Invoices
46. Warranties & Manuals
47. Miscellaneous
48. (Reserved for custom categories)

---

## Common Use Cases

### 1. Populate Category Dropdown in Frontend

```javascript
// Fetch all categories when component mounts
fetch('http://localhost:3000/api/v1/document-category', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
.then(res => res.json())
.then(data => {
  // data.data contains array of categories
  const options = data.data.map(cat => ({
    value: cat.id,
    label: cat.name
  }));
  // Populate dropdown with options
});
```

### 2. Create Custom Category for Organization

If your organization needs specific categories not in the seeder:

```http
POST /api/v1/document-category
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Company Policies"
}
```

### 3. Get Category Name by ID

When displaying documents, fetch category details:

```http
GET /api/v1/document-category/14
Authorization: Bearer TOKEN
```

Returns: `"Health Insurance"`

---

## Quick Reference

### Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/document-category` | List all categories |
| GET | `/api/v1/document-category/:id` | Get single category |
| POST | `/api/v1/document-category` | Create new category |
| PATCH | `/api/v1/document-category/:id` | Update category |
| DELETE | `/api/v1/document-category/:id` | Delete category |

### Status Codes

- `200` - Success (GET, PATCH, DELETE)
- `201` - Created (POST)
- `400` - Validation error / Category in use
- `401` - Unauthorized
- `404` - Category not found
- `409` - Duplicate category name

---

## Best Practices

1. **Seed First:** Always run `npm run seed:document-categories` before testing to have base categories.

2. **Check Before Delete:** Before deleting a category, ensure no documents are using it.

3. **Use Descriptive Names:** Category names should be clear and specific (e.g., "Health Insurance" not "Insurance 1").

4. **Avoid Duplicates:** Check existing categories before creating new ones to avoid 409 errors.

5. **Frontend Caching:** Cache category list in frontend to reduce API calls, refresh periodically.

---

**End of Document Categories API Testing Guide**
