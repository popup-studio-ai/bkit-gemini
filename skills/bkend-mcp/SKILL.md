---
name: bkend-mcp
description: |
  bkend.ai MCP tools and AI integration expert skill.
  Covers 28 MCP tools (Fixed 3 + Project 6 + Table 9 + Data CRUD 5 + Env 3 + Schema 2),
  4 MCP resources, OAuth 2.1 + PKCE authentication, and AI tool setup
  for Gemini CLI, Claude Code, and Cursor.

  Triggers: mcp, ai tool, mcp setup, backend tool, bkend mcp,
  MCP 설정, MCP 도구, AI 도구, MCP接続, MCP設定, AIツール,
  MCP连接, MCP设置, AI工具,
  herramientas MCP, configuracion MCP, outils MCP, configuration MCP,
  MCP-Werkzeuge, MCP-Einrichtung, strumenti MCP, configurazione MCP

  Do NOT use for: authentication implementation (use bkend-auth),
  database queries (use bkend-data), file storage (use bkend-storage)

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

# bkend-mcp: MCP Tools & AI Integration Expert Skill

## 1. MCP Overview

The Model Context Protocol (MCP) is an open standard that enables AI models to interact with external tools and data sources through a unified interface. bkend.ai implements MCP to provide AI-powered development workflows.

### Protocol Specification

| Property        | Value                                |
|-----------------|--------------------------------------|
| Protocol        | MCP 2025-03-26                       |
| Transport       | Streamable HTTP                      |
| Authentication  | OAuth 2.1 + PKCE                     |
| Server URL      | `https://api.bkend.ai/mcp`          |
| Content Type    | `application/json`                   |
| Session Header  | `Mcp-Session-Id`                     |

### How It Works

1. The AI client (Gemini CLI, Claude Code, Cursor, etc.) connects to the MCP server
2. The server advertises available tools and resources
3. The AI model invokes tools on behalf of the user
4. The server executes operations and returns structured results
5. OAuth 2.1 + PKCE ensures secure, user-authorized access

---

## 2. MCP Tool Catalog (28 Tools)

bkend.ai exposes 28 MCP tools organized into 6 categories. Each tool follows the MCP tool schema with `name`, `description`, and `inputSchema` properties.

### 2.1 Fixed Tools (3)

These tools are always available regardless of project context.

| Tool Name              | Description                                       | Parameters                     |
|------------------------|---------------------------------------------------|--------------------------------|
| `get_context`          | Returns current session context including org, project, environment, and user info | None |
| `search_docs`          | Searches bkend.ai documentation by topic or keyword | `query` (string, required), `category` (string, optional) |
| `get_operation_schema` | Returns the OpenAPI schema for a specific REST API operation | `operationId` (string, required) |

**Usage Notes:**
- Always call `get_context` first to verify your session is properly authenticated
- Use `search_docs` to find REST API documentation for Auth and Storage features (no MCP tools available for these)
- Use `get_operation_schema` to get detailed request/response schemas for code generation

### 2.2 Project Management Tools (6)

Tools for managing organizations, projects, and environments.

| Tool Name                | Description                                    | Parameters                                          |
|--------------------------|------------------------------------------------|-----------------------------------------------------|
| `backend_org_list`       | Lists all organizations the user belongs to    | None                                                |
| `backend_project_list`   | Lists all projects in the current organization | `orgId` (string, required)                          |
| `backend_project_create` | Creates a new project                          | `orgId` (string, required), `name` (string, required), `description` (string, optional) |
| `backend_project_get`    | Gets project details                           | `projectId` (string, required)                      |
| `backend_env_list`       | Lists environments for a project               | `projectId` (string, required)                      |
| `backend_env_create`     | Creates a new environment (dev/staging/prod)   | `projectId` (string, required), `name` (string, required), `type` (enum: dev/staging/prod) |

**Usage Notes:**
- Start with `backend_org_list` to get the `orgId`
- Then use `backend_project_list` or `backend_project_create` to set up project context
- Each project can have multiple environments with isolated data

### 2.3 Table Management Tools (9)

Tools for defining and managing database table schemas.

| Tool Name                      | Description                                 | Parameters                                              |
|--------------------------------|---------------------------------------------|---------------------------------------------------------|
| `backend_table_list`           | Lists all tables in the environment         | `envId` (string, required)                              |
| `backend_table_create`         | Creates a new table with fields             | `envId` (string, required), `name` (string, required), `fields` (array, required) |
| `backend_table_get`            | Gets table schema details                   | `envId` (string, required), `tableId` (string, required) |
| `backend_table_update`         | Updates table settings                      | `envId` (string, required), `tableId` (string, required), `settings` (object, required) |
| `backend_table_delete`         | Deletes a table and all its data            | `envId` (string, required), `tableId` (string, required) |
| `backend_field_manage`         | Adds, updates, or removes fields on a table | `envId` (string, required), `tableId` (string, required), `action` (enum: add/update/remove), `field` (object, required) |
| `backend_index_manage`         | Manages indexes on a table                  | `envId` (string, required), `tableId` (string, required), `action` (enum: create/delete), `index` (object, required) |
| `backend_schema_version_list`  | Lists schema versions (migration history)   | `envId` (string, required), `tableId` (string, required) |
| `backend_schema_version_get`   | Gets a specific schema version              | `envId` (string, required), `tableId` (string, required), `versionId` (string, required) |

**Field Types:**
- `string`, `number`, `boolean`, `date`, `datetime`
- `text` (long text), `richtext` (HTML content)
- `email`, `url`, `phone`
- `enum` (with `options` array)
- `relation` (with `targetTable` and `relationType`)
- `file` (stored in bkend Storage)
- `json` (arbitrary JSON object)

### 2.4 Data CRUD Tools (5)

Tools for creating, reading, updating, and deleting records in tables.

| Tool Name              | Description                              | Parameters                                                |
|------------------------|------------------------------------------|-----------------------------------------------------------|
| `backend_data_list`    | Lists records with filtering and paging  | `envId` (string, required), `tableId` (string, required), `filter` (object, optional), `sort` (object, optional), `page` (number, optional), `limit` (number, optional) |
| `backend_data_get`     | Gets a single record by ID              | `envId` (string, required), `tableId` (string, required), `recordId` (string, required) |
| `backend_data_create`  | Creates a new record                     | `envId` (string, required), `tableId` (string, required), `data` (object, required) |
| `backend_data_update`  | Updates an existing record               | `envId` (string, required), `tableId` (string, required), `recordId` (string, required), `data` (object, required) |
| `backend_data_delete`  | Deletes a record                         | `envId` (string, required), `tableId` (string, required), `recordId` (string, required) |

**Filter Syntax:**
```json
{
  "filter": {
    "field": "status",
    "operator": "eq",
    "value": "active"
  }
}
```

**Supported Operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `contains`, `startsWith`, `endsWith`, `exists`

**Sort Syntax:**
```json
{
  "sort": {
    "field": "createdAt",
    "order": "desc"
  }
}
```

### 2.5 Environment Tools (3)

Included in Project Management above: `backend_env_list`, `backend_env_create`, plus:

| Tool Name            | Description                                    | Parameters                                          |
|----------------------|------------------------------------------------|-----------------------------------------------------|
| `backend_env_get`    | Gets environment details and configuration     | `envId` (string, required)                          |

### 2.6 Schema Tools (2)

Included in Table Management above: `backend_schema_version_list`, `backend_schema_version_get`.

These tools provide migration history and rollback capabilities for table schemas.

---

## 3. MCP Resources (4)

MCP resources provide read-only contextual data that AI models can access without explicit tool calls.

| Resource URI                  | Description                                    | MIME Type          |
|-------------------------------|------------------------------------------------|--------------------|
| `bkend://context`             | Current session context (org, project, env)    | `application/json` |
| `bkend://tables`              | List of all tables in the current environment  | `application/json` |
| `bkend://schema/{table}`      | Full schema definition for a specific table    | `application/json` |
| `bkend://docs/{topic}`        | Documentation content for a specific topic     | `text/markdown`    |

**Resource Usage:**
- Resources are automatically available to AI models that support MCP resource reading
- Use `bkend://context` to understand the current working environment
- Use `bkend://tables` to discover available data structures
- Use `bkend://schema/{table}` to get detailed field definitions before data operations
- Use `bkend://docs/{topic}` to retrieve documentation (topics: `auth`, `storage`, `rls`, `api-keys`, `webhooks`)

---

## 4. Auth & Storage MCP Limitation

**Important:** bkend.ai does NOT provide MCP tools for Authentication or Storage operations. These features are accessible only through the REST API.

### Why No MCP Tools?

- **Authentication** operations (signup, login, token management) involve sensitive credentials and security flows that are better handled through direct REST API calls with proper error handling
- **Storage** operations (file upload, download, signed URLs) require binary data transfer that is not well-suited for the MCP tool protocol

### Recommended Workflow

1. Use `search_docs` to find the relevant REST API documentation:
   ```
   search_docs("authentication signup")
   search_docs("storage file upload")
   ```
2. Use `get_operation_schema` to get the detailed OpenAPI schema:
   ```
   get_operation_schema("auth-signup")
   get_operation_schema("storage-upload")
   ```
3. Generate REST API client code based on the retrieved documentation and schemas
4. Use the generated code in your application to call the REST API directly

### Auth REST API Endpoints (Reference)

| Endpoint                     | Method | Description               |
|------------------------------|--------|---------------------------|
| `/auth/signup`               | POST   | Register a new user       |
| `/auth/login`                | POST   | Login with credentials    |
| `/auth/logout`               | POST   | Invalidate session        |
| `/auth/refresh`              | POST   | Refresh access token      |
| `/auth/me`                   | GET    | Get current user profile  |
| `/auth/password/reset`       | POST   | Request password reset    |
| `/auth/password/change`      | POST   | Change password           |

### Storage REST API Endpoints (Reference)

| Endpoint                     | Method | Description               |
|------------------------------|--------|---------------------------|
| `/storage/upload`            | POST   | Upload a file             |
| `/storage/download/{fileId}` | GET    | Download a file           |
| `/storage/list`              | GET    | List files in a bucket    |
| `/storage/delete/{fileId}`   | DELETE | Delete a file             |
| `/storage/signed-url`        | POST   | Generate a signed URL     |

---

## 5. AI Tool Setup

### 5.1 Gemini CLI

Create or edit `.gemini/settings.json` in your project root:

```json
{
  "mcpServers": {
    "bkend": {
      "httpUrl": "https://api.bkend.ai/mcp"
    }
  }
}
```

**Verification:**
```bash
gemini --mcp-list
```

The first time you invoke a bkend tool, Gemini CLI will open your browser for OAuth authentication.

### 5.2 Claude Code

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "bkend": {
      "type": "streamable-http",
      "url": "https://api.bkend.ai/mcp"
    }
  }
}
```

**Verification:**
```bash
claude mcp list
```

Claude Code will automatically handle OAuth 2.1 + PKCE authentication when tools are first invoked.

### 5.3 Cursor

1. Open **Settings** (Cmd/Ctrl + ,)
2. Navigate to **MCP** section
3. Click **Add Server**
4. Configure:
   - **Name:** `bkend`
   - **Type:** HTTP
   - **URL:** `https://api.bkend.ai/mcp`
5. Click **Save**

Cursor will prompt for OAuth authentication when MCP tools are first used.

### 5.4 Windsurf

Create or edit `.windsurfrules` or use the MCP configuration in settings:

```json
{
  "mcpServers": {
    "bkend": {
      "serverUrl": "https://api.bkend.ai/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### 5.5 VS Code (GitHub Copilot)

Add to `.vscode/settings.json`:

```json
{
  "github.copilot.chat.mcpServers": {
    "bkend": {
      "type": "http",
      "url": "https://api.bkend.ai/mcp"
    }
  }
}
```

### 5.6 Other Editors

Any MCP-compatible editor can connect to bkend.ai using:
- **Transport:** Streamable HTTP
- **URL:** `https://api.bkend.ai/mcp`
- **Auth:** OAuth 2.1 + PKCE (handled automatically by most clients)

---

## 6. OAuth 2.1 + PKCE Authentication Flow

### Flow Overview

```
AI Client                    bkend.ai Auth Server              User Browser
   |                                |                               |
   |-- 1. Generate code_verifier -->|                               |
   |-- 2. Compute code_challenge -->|                               |
   |                                |                               |
   |-- 3. GET /oauth/authorize ---->|                               |
   |      ?client_id=...           |                               |
   |      &code_challenge=...      |                               |
   |      &code_challenge_method=S256                               |
   |      &redirect_uri=...        |                               |
   |      &response_type=code      |                               |
   |      &scope=mcp               |                               |
   |                                |-- 4. Show login page -------->|
   |                                |<-- 5. User authenticates -----|
   |                                |                               |
   |<-- 6. Redirect with auth code -|                               |
   |      ?code=AUTH_CODE           |                               |
   |                                |                               |
   |-- 7. POST /oauth/token ------->|                               |
   |      grant_type=authorization_code                             |
   |      code=AUTH_CODE            |                               |
   |      code_verifier=...         |                               |
   |                                |                               |
   |<-- 8. Access + Refresh tokens -|                               |
   |                                |                               |
   |-- 9. MCP requests with ------->|                               |
   |      Authorization: Bearer ... |                               |
```

### Token Lifecycle

| Token          | Lifetime | Storage             | Refresh Method          |
|----------------|----------|---------------------|-------------------------|
| Access Token   | 1 hour   | In-memory (client)  | Exchange refresh token  |
| Refresh Token  | 30 days  | Secure storage      | Re-authenticate         |

### Token Refresh

When the access token expires, the MCP client automatically:
1. Sends a `POST /oauth/token` request with `grant_type=refresh_token`
2. Includes the refresh token in the request body
3. Receives a new access token (and optionally a new refresh token)
4. Retries the failed MCP request with the new access token

---

## 7. MCP Best Practices

### 7.1 Session Initialization

Always start by verifying your session context:

```
1. Call get_context -> verify org, project, and environment
2. Call backend_table_list -> understand available data structures
3. Proceed with specific operations
```

### 7.2 Schema-First Development

Create tables and define schemas via MCP before performing data operations:

```
1. backend_table_create -> define table with fields
2. backend_field_manage -> add/modify fields as needed
3. backend_index_manage -> create indexes for query performance
4. backend_data_create -> insert records
```

### 7.3 Documentation-Driven Code Generation

For Auth and Storage features (no MCP tools), use documentation tools:

```
1. search_docs("authentication login flow") -> get documentation
2. get_operation_schema("auth-login") -> get OpenAPI schema
3. Generate client code based on the schema
```

### 7.4 Environment Awareness

- Always confirm which environment (dev/staging/prod) you are working in before making changes
- Use `get_context` to verify the active environment
- Create separate environments for development and production workflows

### 7.5 Batch Operations

- Use filtering and pagination with `backend_data_list` for large datasets
- Set appropriate `limit` values (default: 20, max: 100) to avoid excessive data transfer
- Use `sort` to control the order of returned records

---

## 8. Common MCP Errors and Solutions

### Connection Errors

| Error                           | Cause                              | Solution                                |
|---------------------------------|------------------------------------|-----------------------------------------|
| `401 Unauthorized`              | Expired or missing access token    | Re-authenticate via OAuth flow          |
| `403 Forbidden`                 | Insufficient permissions or RLS    | Check API key type and RLS policies     |
| `404 Not Found`                 | Invalid endpoint or resource ID    | Verify server URL and resource IDs      |
| `429 Too Many Requests`         | Rate limit exceeded                | Wait and retry with exponential backoff |
| `500 Internal Server Error`     | Server-side issue                  | Retry after a brief delay               |

### Tool Invocation Errors

| Error                           | Cause                              | Solution                                |
|---------------------------------|------------------------------------|-----------------------------------------|
| `tool_not_found`                | Tool name is incorrect             | Check tool catalog for exact names      |
| `invalid_params`                | Missing or invalid parameters      | Review tool parameter requirements      |
| `env_not_set`                   | No environment selected            | Call `get_context` and set environment  |
| `table_not_found`               | Table does not exist               | Use `backend_table_list` to verify      |
| `field_type_mismatch`           | Data type does not match schema    | Check field types with `backend_table_get` |

### Authentication Errors

| Error                           | Cause                              | Solution                                |
|---------------------------------|------------------------------------|-----------------------------------------|
| `oauth_pkce_mismatch`           | Code verifier does not match       | Regenerate code_verifier and retry      |
| `oauth_code_expired`            | Authorization code expired         | Restart OAuth flow from the beginning   |
| `oauth_redirect_mismatch`       | Redirect URI does not match        | Verify redirect_uri matches registered value |
| `refresh_token_expired`         | Refresh token (30d) expired        | Full re-authentication required         |

---

## Quick Reference Card

### Essential Tool Sequence

```
get_context                          # 1. Verify session
backend_org_list                     # 2. List organizations
backend_project_list(orgId)          # 3. List projects
backend_table_list(envId)            # 4. List tables
backend_data_list(envId, tableId)    # 5. Query data
```

### MCP Server Connection

```
URL:       https://api.bkend.ai/mcp
Transport: Streamable HTTP
Auth:      OAuth 2.1 + PKCE
```

### Tool Count Summary

| Category           | Count | Tools                                         |
|--------------------|-------|-----------------------------------------------|
| Fixed              | 3     | get_context, search_docs, get_operation_schema |
| Project Management | 6     | org_list, project_list/create/get, env_list/create |
| Table Management   | 9     | table CRUD (5), field_manage, index_manage, schema_version (2) |
| Data CRUD          | 5     | data_list/get/create/update/delete            |
| Environment        | 3     | env_list/create/get                           |
| Schema             | 2     | schema_version_list/get                       |
| **Total**          | **28**|                                               |
