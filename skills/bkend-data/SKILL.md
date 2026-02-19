---
name: bkend-data
description: |
  bkend.ai database expert skill.
  Covers table creation, CRUD operations, 7 column types, constraints,
  filtering (AND/OR, 10 operators), sorting, pagination, relations, joins,
  indexing, and schema management via MCP and REST API.

  Triggers: table, column, CRUD, schema, index, filter, query, data model,
  테이블, 컬럼, 스키마, 인덱스, 필터, 쿼리, 데이터 모델,
  テーブル, カラム, スキーマ, インデックス, フィルター,
  数据表, 列, 模式, 索引, 过滤, 查询,
  tabla, columna, esquema, indice, filtro, consulta,
  tableau, colonne, schema, index, filtre, requete,
  Tabelle, Spalte, Schema, Index, Filter, Abfrage,
  tabella, colonna, schema, indice, filtro, query

  Do NOT use for: authentication (use bkend-auth), file storage (use bkend-storage),
  MCP setup (use bkend-mcp), security policies (use bkend-security)

user-invocable: true
argument-hint: ""

allowed-tools:
  - read_file
  - write_file
  - replace
  - glob
  - grep_search
  - run_shell_command
  - web_fetch

imports: []

agents:
  backend: bkend-expert

context: session
memory: project
pdca-phase: all
---

# bkend-data: Database Expert Skill

> Complete database management for bkend.ai projects using MongoDB Atlas

## 1. Overview

bkend.ai provides a fully managed database layer built on **MongoDB Atlas**. Each project operates in complete data isolation, with built-in schema validation and Row-Level Security (RLS) policies.

Key characteristics:

- **MongoDB Atlas** backend with project-level isolation
- **Schema validation** enforced at the database level
- **Row-Level Security (RLS)** for fine-grained access control
- **Automatic system fields** on every record
- **REST API** and **MCP tools** for full database management

## 2. Data Model

### 2.1 Column Types (7 Types)

bkend.ai supports exactly 7 column types. There is **no generic "number" type**.

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text data, UTF-8 encoded | `"Hello World"` |
| `int` | Integer numbers (no decimals) | `42` |
| `double` | Floating-point numbers | `3.14` |
| `bool` | Boolean true/false | `true` |
| `date` | ISO 8601 date-time string | `"2025-01-15T09:30:00Z"` |
| `object` | Nested JSON object | `{ "city": "Seoul", "zip": "06000" }` |
| `array` | Array of values | `["tag1", "tag2", "tag3"]` |

> **IMPORTANT**: Do NOT use "number" as a column type. Use `int` for integers or `double` for decimals.

### 2.2 System Fields (Auto-Generated)

Every record automatically includes these system fields. Do NOT define them manually.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique record identifier (auto-generated) |
| `createdBy` | string | User ID of the creator (auto-set) |
| `createdAt` | date | Creation timestamp (auto-set) |
| `updatedAt` | date | Last update timestamp (auto-set) |

### 2.3 Constraints

Apply constraints to columns for data integrity:

| Constraint | Description | Example |
|------------|-------------|---------|
| `required` | Field must have a value | `required: true` |
| `unique` | Value must be unique across all records | `unique: true` |
| `default` | Default value when not provided | `default: "active"` |
| `min` | Minimum value (int/double) or length (string) | `min: 0` |
| `max` | Maximum value (int/double) or length (string) | `max: 100` |
| `enum` | Restrict to a set of allowed values | `enum: ["active", "inactive", "pending"]` |

### 2.4 Default Indexes

Every table is created with these indexes by default:

| Index Name | Fields | Purpose |
|------------|--------|---------|
| `_id_` | `id` | Primary key lookup |
| `idx_createdAt_desc` | `createdAt` descending | Sort by creation date |
| `idx_updatedAt_desc` | `updatedAt` descending | Sort by update date |
| `idx_createdBy` | `createdBy` | Filter by owner |

## 3. CRUD REST API

All data endpoints require authentication via the `Authorization: Bearer <token>` header and the `x-project-id` header.

### 3.1 Create Record

**Single record:**

```http
POST /v1/data/:tableName
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "role": "user"
}
```

**Batch create (multiple records):**

```http
POST /v1/data/:tableName
Content-Type: application/json

{
  "records": [
    { "name": "Alice", "email": "alice@example.com", "age": 25 },
    { "name": "Bob", "email": "bob@example.com", "age": 28 }
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "role": "user",
    "createdBy": "usr_xyz",
    "createdAt": "2025-01-15T09:30:00Z",
    "updatedAt": "2025-01-15T09:30:00Z"
  }
}
```

### 3.2 Read One Record

```http
GET /v1/data/:tableName/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "role": "user",
    "createdBy": "usr_xyz",
    "createdAt": "2025-01-15T09:30:00Z",
    "updatedAt": "2025-01-15T09:30:00Z"
  }
}
```

### 3.3 List Records

```http
GET /v1/data/:tableName?filter={...}&sort={...}&limit=20&cursor=last_id&search=keyword&searchType=partial
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter` | JSON | Filter conditions (see Section 4) |
| `sort` | JSON | Sort order (see Section 5) |
| `limit` | int | Number of records to return (max 100, default 20) |
| `cursor` | string | Cursor for pagination (last record ID) |
| `search` | string | Full-text or partial search keyword |
| `searchType` | string | Search mode: `"exact"` or `"partial"` |

Response:

```json
{
  "success": true,
  "data": [
    { "id": "rec_abc123", "name": "John Doe", "age": 30 },
    { "id": "rec_def456", "name": "Jane Smith", "age": 25 }
  ],
  "meta": {
    "total": 150,
    "limit": 20,
    "nextCursor": "rec_def456"
  }
}
```

### 3.4 Update Record

```http
PUT /v1/data/:tableName/:id
Content-Type: application/json

{
  "name": "John Updated",
  "age": 31
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "name": "John Updated",
    "age": 31,
    "updatedAt": "2025-01-16T10:00:00Z"
  }
}
```

### 3.5 Delete Record

```http
DELETE /v1/data/:tableName/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "deleted": true
  }
}
```

### 3.6 Table Specification

Retrieve the full schema definition for a table:

```http
GET /v1/data/:tableName/spec
```

Response:

```json
{
  "success": true,
  "data": {
    "tableName": "users",
    "fields": [
      { "name": "name", "type": "string", "required": true },
      { "name": "email", "type": "string", "required": true, "unique": true },
      { "name": "age", "type": "int", "min": 0, "max": 150 },
      { "name": "role", "type": "string", "enum": ["user", "admin"], "default": "user" }
    ],
    "indexes": [
      { "name": "_id_", "fields": ["id"] },
      { "name": "idx_createdAt_desc", "fields": [{ "createdAt": -1 }] }
    ]
  }
}
```

## 4. Filtering

### 4.1 AND Filtering (Default)

Multiple conditions in the same filter object are combined with AND logic:

```json
{
  "filter": {
    "status": { "$eq": "active" },
    "age": { "$gte": 18 }
  }
}
```

This returns records where `status` equals "active" **AND** `age` is greater than or equal to 18.

### 4.2 OR Filtering

Use the `$or` operator to combine conditions with OR logic:

```json
{
  "filter": {
    "$or": [
      { "status": "active" },
      { "role": "admin" }
    ]
  }
}
```

This returns records where `status` equals "active" **OR** `role` equals "admin".

### 4.3 Filter Operators (10 Operators)

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal to | `{ "status": { "$eq": "active" } }` |
| `$ne` | Not equal to | `{ "status": { "$ne": "deleted" } }` |
| `$gt` | Greater than | `{ "age": { "$gt": 18 } }` |
| `$gte` | Greater than or equal | `{ "age": { "$gte": 18 } }` |
| `$lt` | Less than | `{ "price": { "$lt": 100 } }` |
| `$lte` | Less than or equal | `{ "price": { "$lte": 99.99 } }` |
| `$in` | In array of values | `{ "role": { "$in": ["admin", "editor"] } }` |
| `$nin` | Not in array | `{ "status": { "$nin": ["deleted", "banned"] } }` |
| `$regex` | Regular expression match | `{ "name": { "$regex": "^John" } }` |
| `$exists` | Field exists or not | `{ "profileImage": { "$exists": true } }` |

### 4.4 Search

Use query parameters for text search:

```
GET /v1/data/users?search=john&searchType=partial
```

- `search`: The keyword to search for
- `searchType`: `"exact"` for exact match, `"partial"` for contains match

## 5. Sorting & Pagination

### 5.1 Sorting

Specify sort order with field name and direction (1 for ascending, -1 for descending):

```json
{
  "sort": { "createdAt": -1 }
}
```

Multiple sort fields:

```json
{
  "sort": { "role": 1, "createdAt": -1 }
}
```

### 5.2 Pagination

bkend.ai uses **cursor-based pagination** for optimal performance:

```
GET /v1/data/users?limit=20&cursor=rec_last_id_value
```

- `limit`: Number of records per page (max 100, default 20)
- `cursor`: The `id` of the last record from the previous page

The response includes `meta.nextCursor` for fetching the next page. When `nextCursor` is `null`, there are no more pages.

**Example pagination flow:**

```
# First page
GET /v1/data/users?limit=20

# Next page (use nextCursor from previous response)
GET /v1/data/users?limit=20&cursor=rec_def456

# Continue until nextCursor is null
```

## 6. Relations

### 6.1 One-to-Many (1:N)

Store a reference ID in the child table:

```
Table: users
  - id (system)
  - name (string)
  - email (string)

Table: posts
  - id (system)
  - title (string)
  - content (string)
  - authorId (string)  ← references users.id
```

**Join query** to include related data:

```http
GET /v1/data/posts?join=authorId
```

Response with joined data:

```json
{
  "success": true,
  "data": [
    {
      "id": "post_001",
      "title": "My First Post",
      "content": "Hello world",
      "authorId": "usr_abc",
      "author": {
        "id": "usr_abc",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

### 6.2 Many-to-Many (N:M)

Use a **junction table** to model many-to-many relationships:

```
Table: posts
  - id (system)
  - title (string)

Table: tags
  - id (system)
  - name (string)

Table: post_tags (junction)
  - id (system)
  - postId (string)  ← references posts.id
  - tagId (string)   ← references tags.id
```

Query posts with their tags:

```http
GET /v1/data/post_tags?filter={"postId":{"$eq":"post_001"}}&join=tagId
```

## 7. MCP Table Management Tools

Use these MCP tools for schema and table management operations:

### 7.1 Table Operations

| Tool | Description |
|------|-------------|
| `backend_table_create` | Create a new table with field definitions |
| `backend_table_list` | List all tables in the project |
| `backend_table_get` | Get table schema and metadata |
| `backend_table_update` | Update table settings |
| `backend_table_delete` | Delete a table and all its data |

**Example: Create a table**

```
Tool: backend_table_create
Arguments:
  tableName: "users"
  fields:
    - name: "name"
      type: "string"
      required: true
    - name: "email"
      type: "string"
      required: true
      unique: true
    - name: "age"
      type: "int"
      min: 0
      max: 150
    - name: "role"
      type: "string"
      enum: ["user", "admin"]
      default: "user"
    - name: "isActive"
      type: "bool"
      default: true
```

### 7.2 Field Management

| Tool | Description |
|------|-------------|
| `backend_field_manage` | Add, update, or remove fields from a table |

**Example: Add a field**

```
Tool: backend_field_manage
Arguments:
  tableName: "users"
  action: "add"
  field:
    name: "bio"
    type: "string"
    max: 500
```

### 7.3 Index Management

| Tool | Description |
|------|-------------|
| `backend_index_manage` | Create, list, or delete custom indexes |

**Example: Create a compound index**

```
Tool: backend_index_manage
Arguments:
  tableName: "users"
  action: "create"
  index:
    name: "idx_role_active"
    fields:
      - field: "role"
        direction: 1
      - field: "isActive"
        direction: 1
```

### 7.4 Schema Versioning

| Tool | Description |
|------|-------------|
| `backend_schema_version_list` | List all schema versions for a table |
| `backend_schema_version_get` | Get a specific schema version |

## 8. Frontend CRUD Pattern (TanStack Query)

Use the **Query Key Factory** pattern for consistent cache management:

```typescript
// lib/queries/users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bkendFetch } from '@/lib/bkend';

// Query Key Factory
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// List users with filters
export function useUsers(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.filter) params.set('filter', JSON.stringify(filters.filter));
      if (filters.sort) params.set('sort', JSON.stringify(filters.sort));
      if (filters.limit) params.set('limit', String(filters.limit));
      if (filters.cursor) params.set('cursor', String(filters.cursor));

      const res = await bkendFetch(`/v1/data/users?${params.toString()}`);
      return res.json();
    },
  });
}

// Get single user
export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async () => {
      const res = await bkendFetch(`/v1/data/users/${id}`);
      return res.json();
    },
    enabled: !!id,
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await bkendFetch('/v1/data/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await bkendFetch(`/v1/data/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await bkendFetch(`/v1/data/users/${id}`, {
        method: 'DELETE',
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

## 9. Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `TABLE_NOT_FOUND` | 404 | The specified table does not exist |
| `VALIDATION_ERROR` | 400 | Request data fails schema validation |
| `DUPLICATE_KEY` | 400 | A unique constraint violation occurred |
| `PERMISSION_DENIED` | 403 | User lacks permission for this operation |
| `INVALID_FILTER` | 400 | The filter syntax is malformed or invalid |
| `RECORD_NOT_FOUND` | 404 | The specified record ID does not exist |
| `LIMIT_EXCEEDED` | 400 | The requested limit exceeds the maximum (100) |

Error response format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'email' is required",
    "details": [
      { "field": "email", "message": "This field is required" }
    ]
  }
}
```

## Quick Reference

### Common Workflows

1. **Create a table** -> Use `backend_table_create` MCP tool
2. **Add fields later** -> Use `backend_field_manage` MCP tool
3. **Insert data** -> `POST /v1/data/:tableName`
4. **Query with filters** -> `GET /v1/data/:tableName?filter={...}&sort={...}&limit=20`
5. **Join related data** -> `GET /v1/data/:tableName?join=fieldName`
6. **Paginate results** -> Use `cursor` from `meta.nextCursor`
7. **Search records** -> `GET /v1/data/:tableName?search=keyword&searchType=partial`
8. **Manage indexes** -> Use `backend_index_manage` MCP tool
