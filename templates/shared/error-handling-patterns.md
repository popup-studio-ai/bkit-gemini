# Error Handling Patterns

> Shared error handling patterns for Skills and Agents
>
> Usage: Add to frontmatter imports in SKILL.md or Agent.md
> ```yaml
> imports:
>   - ${PLUGIN_ROOT}/templates/shared/error-handling-patterns.md
> ```

## Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Error Code Conventions

| Category | Prefix | Example |
|----------|--------|---------|
| Authentication | AUTH_ | AUTH_INVALID_TOKEN |
| Validation | VALIDATION_ | VALIDATION_REQUIRED_FIELD |
| Permission | PERMISSION_ | PERMISSION_DENIED |
| Resource | RESOURCE_ | RESOURCE_NOT_FOUND |
| Server | SERVER_ | SERVER_INTERNAL_ERROR |

## Error Handling Rules

1. **Always return structured errors** - Never expose raw exceptions
2. **Use appropriate HTTP status codes**:
   - 400: Client error (validation, bad request)
   - 401: Authentication required
   - 403: Permission denied
   - 404: Resource not found
   - 500: Server error
3. **Log errors with context** - Include request ID, user ID, timestamp
4. **Sanitize error messages** - Remove sensitive data before response

## Try-Catch Pattern

```javascript
try {
  // Operation
} catch (error) {
  debugLog('ModuleName', 'Operation failed', {
    error: error.message,
    context: { /* relevant data */ }
  });

  return {
    success: false,
    error: {
      code: categorizeError(error),
      message: sanitizeErrorMessage(error)
    }
  };
}
```
